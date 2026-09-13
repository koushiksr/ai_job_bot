import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { sendEmail, generatePurchaseOfferHtml } from '@/lib/mailService'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

import { OFFER_PRESETS } from '@/config/plans'
import { sendPushToUser } from '@/lib/webPushService'



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
      targetEmails = [],
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

    if (targetType === 'multiple') {
      const rawList: string[] = Array.isArray(targetEmails)
        ? targetEmails
        : (typeof targetEmails === 'string' ? (targetEmails as string).split(',') : [])
      const cleanList = rawList.map(e => e.trim().toLowerCase()).filter(e => e && e.includes('@'))
      const seen = new Set<string>()
      for (const em of cleanList) {
        if (!seen.has(em)) {
          seen.add(em)
          const user = await db.collection('users').findOne({ email: { $regex: `^${em}$`, $options: 'i' } }) ||
                       await db.collection('profiles').findOne({ email: { $regex: `^${em}$`, $options: 'i' } })
          candidatesToNotify.push({
            email: em,
            name: user?.name || em.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ')
          })
        }
      }
    } else if (targetType === 'single' || targetType === 'custom_email') {
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

    // Dispatch offers via Dual-Channel (Email + Native Background Web Push)
    const dispatchedRecipients: string[] = []
    let totalEmailsSent = 0
    let totalPushDelivered = 0

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

      // 1. Send Email Notification via Google SMTP
      try {
        const mailResult = await sendEmail({
          to: candidate.email,
          subject: `⚡ ${offerTitle} [Code: ${promoCode}]`,
          html,
          text: `Hi ${candidate.name},\n\nSpecial Offer: ${offerTitle}\nUse code ${promoCode} to get ${discountBadge} at ${discountedPrice} (Regular ${originalPrice}).\nClaim here: ${claimUrl}`
        })
        if (mailResult && (mailResult as any).success) {
          totalEmailsSent++
        }
      } catch (mailErr) {
        console.warn(`[Offers] Failed sending email to ${candidate.email}:`, mailErr)
      }

      // 2. Persist Candidate-Restricted Offer Assignment in MongoDB
      const candidateEmailClean = candidate.email.toLowerCase().trim()
      const cleanPromoCode = promoCode.trim().toUpperCase()
      await db.collection('assigned_offers').updateOne(
        {
          candidate_email: candidateEmailClean,
          promo_code: cleanPromoCode
        },
        {
          $set: {
            candidate_email: candidateEmailClean,
            candidate_name: candidate.name,
            promo_code: cleanPromoCode,
            preset_id: body.offerPreset || 'custom',
            offer_title: offerTitle,
            discount_badge: discountBadge,
            original_price: originalPrice,
            discounted_price: discountedPrice,
            claim_url: claimUrl,
            custom_message: customMessage || '',
            assigned_by: adminEmail || userId || 'admin',
            claimed: false,
            claimed_at: null,
            updated_at: new Date()
          },
          $setOnInsert: {
            created_at: new Date()
          }
        },
        { upsert: true }
      )

      // 3. Create Real-Time In-App Notification for Candidate Dashboard
      await db.collection('user_notifications').insertOne({
        email: candidateEmailClean,
        type: 'offer_assigned',
        title: `⚡ Exclusive Offer: ${discountBadge}`,
        message: `${offerTitle} — Pay only ${discountedPrice} (Regular ${originalPrice}) with code ${cleanPromoCode}.`,
        promo_code: cleanPromoCode,
        claim_url: claimUrl,
        read: false,
        created_at: new Date()
      })

      // 4. Dispatch background Web Push (reaches candidate OS outside browser via Google FCM / Apple APNs)
      try {
        const pushResult = await sendPushToUser(candidateEmailClean, {
          title: `🎁 Exclusive Offer: ${discountBadge}!`,
          body: `${offerTitle} (${originalPrice} → ${discountedPrice}). Code: ${cleanPromoCode}.`,
          url: claimUrl,
          tag: `jobflux_offer_${cleanPromoCode}`
        })
        if (pushResult && pushResult.delivered > 0) {
          totalPushDelivered += pushResult.delivered
        }
      } catch (pushErr) {
        console.warn(`[Offers] Web Push dispatch notice for ${candidateEmailClean}:`, pushErr)
      }

      dispatchedRecipients.push(candidate.email)
    }

    // Record Campaign in admin_offers collection with delivery telemetry
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
      emails_sent: totalEmailsSent,
      push_delivered: totalPushDelivered,
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
      message: `✓ Offer successfully dispatched to ${dispatchedRecipients.length} candidate(s) (${totalEmailsSent} emails sent, ${totalPushDelivered} devices reached via Web Push).`,
      dispatched_count: dispatchedRecipients.length,
      emails_sent: totalEmailsSent,
      push_delivered: totalPushDelivered,
      recipients: dispatchedRecipients
    })
  } catch (err: any) {
    console.error('Admin offer dispatch error:', err)
    return NextResponse.json({ detail: err.message || 'Failed to dispatch offer campaign' }, { status: 500 })
  }
}
