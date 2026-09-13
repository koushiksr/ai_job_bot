import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { sendEmail, generatePurchaseOfferHtml } from '@/lib/mailService'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

const OFFER_PRESETS = [
  {
    id: 'flash_49',
    name: 'Essentials Flash Pass (₹49 / mo)',
    offerTitle: 'Exclusive 50% Flash Discount: JobFlux Essentials for ₹49',
    discountBadge: '50% OFF FLASH PASS',
    originalPrice: '₹99 / mo',
    discountedPrice: '₹49 / mo',
    promoCode: 'FLASH49',
    customMessage: 'Unlock 30 days of continuous daily autonomous job applications (600+ applies), Harvard ATS resume formatting, and direct priority recruiter submission at 50% off for your first month.'
  },
  {
    id: 'sprint_69',
    name: 'Weekend Career Sprint (₹69 / mo)',
    offerTitle: 'Weekend Career Sprint: 1-Month JobFlux Essentials for ₹69',
    discountBadge: 'SAVE 30% TODAY',
    originalPrice: '₹99 / mo',
    discountedPrice: '₹69 / mo',
    promoCode: 'SPRINT69',
    customMessage: 'Kickstart your interview pipeline this week with 600+ verified applications and daily smart scans across Naukri for only ₹69.'
  },
  {
    id: 'pro_129',
    name: 'Professional 3-Month Fast-Track (₹129)',
    offerTitle: 'Career Fast-Track: 3 Months of JobFlux Professional for ₹129',
    discountBadge: 'SPECIAL ₹129 PASS',
    originalPrice: '₹199 / 3 mos',
    discountedPrice: '₹129 / 3 mos',
    promoCode: 'PRO129',
    customMessage: 'Accelerate your interview shortlists with 90 days of continuous automated applies (1,800+ applications), on-demand sweeps up to 5x/week, and VIP priority queue for just ₹129.'
  },
  {
    id: 'vip_299',
    name: 'Lifetime VIP Career Pass (₹299)',
    offerTitle: 'Lifetime VIP Access: Autonomous Job Applications for ₹299',
    discountBadge: 'EXCLUSIVE VIP PASS',
    originalPrice: '₹2,500',
    discountedPrice: '₹299 One-Time',
    promoCode: 'VIP299',
    customMessage: 'Get unlimited autonomous job applications and daily recruiter sweeps until you sign your dream offer, plus permanent VIP queue slot and priority placement assistance.'
  }
]


export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    // Get candidate audience breakdown
    const allUsers = await db.collection('users').find({}).toArray()
    const allProfiles = allUsers.length > 0 ? allUsers : await db.collection('profiles').find({}).toArray()

    const now = new Date()
    const unsubscribedOrTrial = allProfiles.filter(p => {
      const plan = (p.plan || 'none').toLowerCase()
      if (plan === 'none' || plan === 'no_plan') return true
      if (plan === 'trial') {
        const expires = p.trial_expires_at ? new Date(p.trial_expires_at) : null
        return !expires || expires < now
      }
      return false
    })

    // Get past campaigns history
    const history = await db.collection('admin_offers')
      .find({})
      .sort({ created_at: -1 })
      .limit(30)
      .toArray()

    return NextResponse.json({
      presets: OFFER_PRESETS,
      metrics: {
        total_candidates: allProfiles.length,
        unsubscribed_count: unsubscribedOrTrial.length,
        subscribed_count: Math.max(0, allProfiles.length - unsubscribedOrTrial.length)
      },
      history: history.map(h => ({
        id: h._id.toString(),
        campaign_name: h.campaign_name,
        preset: h.preset,
        target_type: h.target_type,
        recipient_count: h.recipient_count,
        recipients: h.recipients || [],
        discount_badge: h.discount_badge,
        discounted_price: h.discounted_price,
        promo_code: h.promo_code,
        confirmed_by: h.confirmed_by,
        created_at: h.created_at,
        status: h.status || 'sent'
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to fetch offer data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, userId, email: adminEmail } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const {
      targetType = 'single',
      targetEmail = 'koushiksrmedala@gmail.com',
      offerTitle = 'Exclusive 50% Flash Discount: JobFlux Essentials for ₹49',
      discountBadge = '50% OFF FLASH PASS',
      originalPrice = '₹99 / mo',
      discountedPrice = '₹49 / mo',
      promoCode = 'FLASH49',
      customMessage = '',
      confirmedByAdmin = false
    } = body

    // Enforce explicit Admin Confirmation safeguard
    if (!confirmedByAdmin) {
      return NextResponse.json(
        { detail: 'Campaign dispatch not confirmed. Please confirm the action in the administrative modal.' },
        { status: 400 }
      )
    }

    const { ip, userAgent } = getClientInfo(req)
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://jobfluxai.vercel.app'
    const claimUrl = `${origin}/pricing?promo=${encodeURIComponent(promoCode)}`

    // Determine target candidates
    let candidatesToNotify: Array<{ email: string; name: string }> = []

    if (targetType === 'single' || targetType === 'custom_email') {
      const cleanTarget = (targetEmail || '').trim().toLowerCase()
      if (!cleanTarget || !cleanTarget.includes('@')) {
        return NextResponse.json({ detail: 'Please specify a valid candidate email.' }, { status: 400 })
      }

      const user = await db.collection('users').findOne({ email: { $regex: `^${cleanTarget}$`, $options: 'i' } }) ||
                   await db.collection('profiles').findOne({ email: { $regex: `^${cleanTarget}$`, $options: 'i' } })

      candidatesToNotify.push({
        email: cleanTarget,
        name: user?.name || cleanTarget.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ')
      })
    } else if (targetType === 'bulk_unsubscribed') {
      const allUsers = await db.collection('users').find({}).toArray()
      const allProfiles = allUsers.length > 0 ? allUsers : await db.collection('profiles').find({}).toArray()
      const now = new Date()

      const targets = allProfiles.filter(p => {
        if (!p.email || !p.email.includes('@')) return false
        const plan = (p.plan || 'none').toLowerCase()
        if (plan === 'none' || plan === 'no_plan') return true
        if (plan === 'trial') {
          const expires = p.trial_expires_at ? new Date(p.trial_expires_at) : null
          return !expires || expires < now
        }
        return false
      })

      const seen = new Set<string>()
      targets.forEach(t => {
        const em = t.email.toLowerCase().trim()
        if (!seen.has(em)) {
          seen.add(em)
          candidatesToNotify.push({
            email: em,
            name: t.name || em.split('@')[0]
          })
        }
      })
    } else if (targetType === 'all_users') {
      const allUsers = await db.collection('users').find({}).toArray()
      const allProfiles = allUsers.length > 0 ? allUsers : await db.collection('profiles').find({}).toArray()

      const seen = new Set<string>()
      allProfiles.forEach(t => {
        const em = (t.email || '').toLowerCase().trim()
        if (em && em.includes('@') && !seen.has(em)) {
          seen.add(em)
          candidatesToNotify.push({
            email: em,
            name: t.name || em.split('@')[0]
          })
        }
      })
    }

    if (candidatesToNotify.length === 0) {
      return NextResponse.json(
        { detail: 'No eligible candidate recipients found for the selected target filter.' },
        { status: 400 }
      )
    }

    // Dispatch offers
    const dispatchedRecipients: string[] = []
    for (const candidate of candidatesToNotify) {
      const html = generatePurchaseOfferHtml({
        candidateName: candidate.name,
        offerTitle,
        discountBadge,
        originalPrice,
        discountedPrice,
        promoCode,
        claimUrl,
        customMessage: customMessage || undefined
      })

      await sendEmail({
        to: candidate.email,
        subject: `⚡ ${offerTitle} [Code: ${promoCode}]`,
        html,
        text: `Hi ${candidate.name},\n\nSpecial Offer: ${offerTitle}\nUse code ${promoCode} to get ${discountBadge} at ${discountedPrice} (Regular ${originalPrice}).\nClaim here: ${claimUrl}`
      })

      dispatchedRecipients.push(candidate.email)
    }

    // Record Campaign in admin_offers collection
    const campaignRecord = {
      campaign_name: offerTitle,
      preset: body.offerPreset || 'custom',
      target_type: targetType,
      recipient_count: dispatchedRecipients.length,
      recipients: dispatchedRecipients,
      discount_badge: discountBadge,
      original_price: originalPrice,
      discounted_price: discountedPrice,
      promo_code: promoCode,
      claim_url: claimUrl,
      custom_message: customMessage,
      confirmed_by: adminEmail || userId,
      status: 'dispatched',
      created_at: new Date()
    }

    await db.collection('admin_offers').insertOne(campaignRecord)

    // Log admin activity
    await logUserActivity(db, {
      userId: userId || 'admin',
      email: adminEmail || 'admin@jobfluxai.com',
      eventType: 'plan_update',
      description: `Dispatched purchase offer campaign "${offerTitle}" to ${dispatchedRecipients.length} candidate(s) (Target: ${targetType})`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        campaign_name: offerTitle,
        recipients_count: dispatchedRecipients.length,
        promo_code: promoCode,
        target_type: targetType
      }
    })

    return NextResponse.json({
      status: 'success',
      message: `Purchase offer campaign successfully dispatched to ${dispatchedRecipients.length} candidate(s).`,
      dispatched_count: dispatchedRecipients.length,
      recipients: dispatchedRecipients
    })
  } catch (err: any) {
    console.error('Admin offer dispatch error:', err)
    return NextResponse.json({ detail: err.message || 'Failed to dispatch offer campaign' }, { status: 500 })
  }
}
