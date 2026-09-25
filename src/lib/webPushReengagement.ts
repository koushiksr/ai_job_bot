import { Db } from 'mongodb'
import { sendPushToSubscription, PushSubscriptionRecord, WebPushPayload } from './webPushService'
import { exactMatchCI } from './query'

export interface DripCampaign {
  id: string
  title: string
  body: string
  url: string
  tag: string
  badgeText: string
  category: 'welcome_offer' | 'referral_cash' | 'job_surge' | 'ats_resume'
}

export const DRIP_CAMPAIGNS: DripCampaign[] = [
  {
    id: 'camp_pro_499',
    title: '🔥 55 Jobs Auto-Applied Daily: Claim ₹499 Pass',
    body: 'Over 1,200+ candidates landed interviews this month. Let JobFlux AI auto-apply to 55 verified jobs every morning for just ₹499/mo!',
    url: '/pricing',
    tag: 'drip_pro_499',
    badgeText: '₹499 Pro Offer',
    category: 'welcome_offer'
  },
  {
    id: 'camp_referral_200',
    title: '💰 Earn ₹200 Direct Cash on JobFlux!',
    body: 'Refer your college friends or developer peers. Receive ₹200 cash sent directly to your UPI or Bank Account on every Pro upgrade!',
    url: '/profile',
    tag: 'drip_referral_200',
    badgeText: '₹200 Cash Reward',
    category: 'referral_cash'
  },
  {
    id: 'camp_surge_hiring',
    title: '⚡ 350+ Fresh Tech Vacancies Added on Naukri',
    body: 'Software Engineer, Python, React, and Data roles surged today. Let autonomous 6:00 AM sweeps apply to matched roles for you.',
    url: '/pricing',
    tag: 'drip_surge_hiring',
    badgeText: 'Hiring Surge Alert',
    category: 'job_surge'
  },
  {
    id: 'camp_ats_harvard',
    title: '🎯 Harvard ATS Resume Optimization Included',
    body: 'Pass 98% of recruiter ATS filters. Upgrade to JobFlux Pro to get single-column Harvard ATS resume formatting and priority sweeps.',
    url: '/pricing',
    tag: 'drip_ats_harvard',
    badgeText: 'ATS Resume Studio',
    category: 'ats_resume'
  }
]

/** Paid plan identifiers that must NEVER receive promotional offer pushes */
const PAID_PLANS = new Set([
  'pro',
  'elite',
  'professional',
  'org_pro',
  'org_pro_3m',
  'org_starter',
  'enterprise'
])

export interface AudienceStats {
  total_subscriptions: number
  anonymous_devices: number
  unpaid_user_devices: number
  paid_devices_excluded: number
  eligible_devices: number
}

/**
 * Filter subscriptions so ONLY anonymous browsers or browsers tagged to users
 * WITHOUT a paid plan receive promotional drip notifications.
 * Paid subscribers are strictly excluded.
 */
export async function getEligibleDripSubscriptions(db: Db): Promise<{
  eligible: any[]
  stats: AudienceStats
}> {
  const now = new Date()
  const allSubs = await db.collection('push_subscriptions').find({}).toArray()

  // 1. Gather all unique emails, user_ids, and visitor_ids
  const userEmails = new Set<string>()
  const userIds = new Set<string>()
  const visitorIds = new Set<string>()

  allSubs.forEach(s => {
    if (s.email) userEmails.add(s.email.toLowerCase().trim())
    if (s.user_id) userIds.add(s.user_id.trim())
    if (s.visitor_id) visitorIds.add(s.visitor_id.trim())
  })

  // 2. Fetch profiles to check active paid plans
  const profiles = await db.collection('profiles').find({
    $or: [
      { email: { $in: Array.from(userEmails) } },
      { user_id: { $in: Array.from(userIds) } }
    ]
  }, {
    projection: { email: 1, user_id: 1, plan: 1, plan_expires_at: 1 }
  }).toArray()

  // 3. Check visitors_summary for any visitor_id mapped to an identified email
  const visitors = visitorIds.size > 0
    ? await db.collection('visitors_summary').find({ visitor_id: { $in: Array.from(visitorIds) } }).toArray()
    : []

  const visitorEmailMap = new Map<string, string>()
  visitors.forEach(v => {
    if (v.identified_email) visitorEmailMap.set(v.visitor_id, v.identified_email.toLowerCase().trim())
  })

  // 4. Build set of paid emails & user_ids
  const paidEmails = new Set<string>()
  const paidUserIds = new Set<string>()

  profiles.forEach(p => {
    const rawPlan = (p.plan || '').toLowerCase()
    if (PAID_PLANS.has(rawPlan)) {
      // Check if plan has expired
      let isActive = true
      if (p.plan_expires_at) {
        isActive = new Date(p.plan_expires_at) > now
      }
      if (isActive) {
        if (p.email) paidEmails.add(p.email.toLowerCase().trim())
        if (p.user_id) paidUserIds.add(p.user_id.trim())
      }
    }
  })

  // 5. Partition subscriptions
  let anonymousCount = 0
  let unpaidCount = 0
  let paidExcludedCount = 0
  const eligible: any[] = []

  for (const sub of allSubs) {
    const cleanEmail = (sub.email || '').toLowerCase().trim()
    const cleanUid = (sub.user_id || '').trim()
    const cleanVid = (sub.visitor_id || '').trim()

    // Check if visitor is associated with a paid email
    const mappedEmail = cleanVid ? visitorEmailMap.get(cleanVid) : undefined
    const isPaid = (cleanEmail && paidEmails.has(cleanEmail)) ||
                   (cleanUid && paidUserIds.has(cleanUid)) ||
                   (mappedEmail && paidEmails.has(mappedEmail))

    if (isPaid) {
      paidExcludedCount++
      continue
    }

    if (!cleanEmail && !cleanUid && !mappedEmail) {
      anonymousCount++
      eligible.push({ ...sub, audience_type: 'anonymous' })
    } else {
      unpaidCount++
      eligible.push({ ...sub, audience_type: 'unpaid_user' })
    }
  }

  return {
    eligible,
    stats: {
      total_subscriptions: allSubs.length,
      anonymous_devices: anonymousCount,
      unpaid_user_devices: unpaidCount,
      paid_devices_excluded: paidExcludedCount,
      eligible_devices: eligible.length
    }
  }
}

/**
 * Dispatch an offer re-engagement push notification to all eligible devices.
 */
export async function dispatchDripPush(
  db: Db,
  options?: {
    campaignId?: string
    adminUser?: string
    forceAll?: boolean
  }
): Promise<{
  success: boolean
  delivered: number
  failed: number
  totalEligible: number
  campaign: DripCampaign
  stats: AudienceStats
}> {
  const { eligible, stats } = await getEligibleDripSubscriptions(db)

  // Pick the specified campaign or the first one by default
  const campaign = DRIP_CAMPAIGNS.find(c => c.id === options?.campaignId) || DRIP_CAMPAIGNS[0]
  const now = new Date()

  // Cooldown: skip devices that received a push in the last 18 hours unless forceAll is set
  const cooldownCutoff = new Date(now.getTime() - 18 * 60 * 60 * 1000)
  const targets = options?.forceAll
    ? eligible
    : eligible.filter(sub => !sub.last_drip_at || new Date(sub.last_drip_at) < cooldownCutoff)

  let delivered = 0
  let failed = 0

  const pushPayload: WebPushPayload = {
    title: campaign.title,
    body: campaign.body,
    url: campaign.url,
    tag: `${campaign.tag}_${Date.now()}`,
    ttlSeconds: 6 * 3600, // 6 hours TTL in APNs/FCM
    expiresAt: now.getTime() + 6 * 3600 * 1000
  }

  // Concurrently dispatch to batches of 15
  const batchSize = 15
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize)
    await Promise.all(
      batch.map(async subDoc => {
        const subRecord: PushSubscriptionRecord = {
          endpoint: subDoc.endpoint,
          keys: subDoc.keys
        }
        const res = await sendPushToSubscription(subRecord, pushPayload, db)
        if (res.success) {
          delivered++
          await db.collection('push_subscriptions').updateOne(
            { endpoint: subDoc.endpoint },
            {
              $set: {
                last_drip_at: now,
                last_campaign_id: campaign.id
              },
              $inc: { drip_count: 1 }
            }
          )
        } else {
          failed++
        }
      })
    )
  }

  // Log dispatch in admin_push_logs
  await db.collection('admin_push_logs').insertOne({
    target_email: `${targets.length} Non-Paying & Anonymous Browsers`,
    target_type: 'reengagement_drip',
    campaign_id: campaign.id,
    campaign_title: campaign.title,
    recipient_count: targets.length,
    web_push_delivered: delivered,
    web_push_failed: failed,
    dispatched_by: options?.adminUser || 'automated_drip',
    dispatched_at: now,
    status: delivered > 0 ? 'delivered' : 'no_devices_reached'
  })

  return {
    success: true,
    delivered,
    failed,
    totalEligible: targets.length,
    campaign,
    stats
  }
}
