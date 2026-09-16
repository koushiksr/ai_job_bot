import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { sendEmail, generatePurchaseOfferHtml } from '@/lib/mailService'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

import { OFFER_PRESETS } from '@/config/plans'
import { sendPushToUser } from '@/lib/webPushService'
import { evaluateOfferEligibility } from '@/lib/offerEligibility'



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

    // Get candidate audience breakdown, campaign history, and assigned offers in parallel
    const [allUsers, allProfilesRaw, history, assignedOffersList] = await Promise.all([
      db.collection('users').find({}, { projection: { plan: 1, trial_expires_at: 1, user_id: 1, email: 1 } }).toArray(),
      db.collection('profiles').find({}, { projection: { plan: 1, trial_expires_at: 1, user_id: 1, email: 1 } }).toArray(),
      db.collection('admin_offers').find({}).sort({ created_at: -1 }).limit(30).toArray(),
      db.collection('assigned_offers').find({}).sort({ created_at: -1 }).limit(100).toArray()
    ])
    const allProfiles = allUsers.length > 0 ? allUsers : allProfilesRaw

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

    const activeAssignedOffers = assignedOffersList.map(o => {
      const exp = o.expires_at ? new Date(o.expires_at) : null
      const isExpired = exp ? now > exp : false
      const hoursLeft = exp && !isExpired ? Math.round((exp.getTime() - now.getTime()) / 3600000) : 0
      return {
        id: o._id.toString(),
        candidate_email: o.candidate_email,
        candidate_name: o.candidate_name,
        promo_code: o.promo_code,
        offer_title: o.offer_title,
        discount_badge: o.discount_badge,
        discounted_price: o.discounted_price,
        original_price: o.original_price,
        claimed: Boolean(o.claimed),
        claimed_at: o.claimed_at || null,
        expires_at: o.expires_at || null,
        validity_hours: o.validity_hours || 48,
        is_expired: isExpired,
        hours_left: hoursLeft,
        revoked: Boolean(o.revoked),
        created_at: o.created_at
      }
    })

    return NextResponse.json({
      presets: OFFER_PRESETS,
      metrics: {
        total_candidates: allProfiles.length,
        unsubscribed_count: unsubscribedOrTrial.length,
        subscribed_count: Math.max(0, allProfiles.length - unsubscribedOrTrial.length),
        active_assigned_offers: activeAssignedOffers.filter(o => !o.claimed && !o.is_expired && !o.revoked).length,
        expired_offers: activeAssignedOffers.filter(o => o.is_expired && !o.revoked).length,
        revoked_offers: activeAssignedOffers.filter(o => o.revoked).length
      },
      assigned_offers: activeAssignedOffers,
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
        validity_hours: h.validity_hours || 48,
        expires_at: h.expires_at || null,
        emails_sent: h.emails_sent || 0,
        push_delivered: h.push_delivered || 0,
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
      validityHours = 48,
      validUntil = null,
      customMessage = '',
      confirmedByAdmin = false,
      forceOverride = false
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

    const hours = parseInt(validityHours as any, 10) || 48
    const offerExpiresAt = validUntil ? new Date(validUntil) : new Date(Date.now() + hours * 60 * 60 * 1000)

    // Determine target candidates
    let rawTargets: Array<{ email: string; name: string }> = []

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
          rawTargets.push({
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

      // Single candidate sales eligibility check
      const eligibility = evaluateOfferEligibility(user)
      if (!eligibility.eligible && !forceOverride) {
        return NextResponse.json({
          status: 'ineligible',
          detail: `Offer dispatch restricted by sales policy: ${eligibility.reason}`,
          eligibility,
          can_override: true
        }, { status: 422 })
      }

      rawTargets.push({
        email: cleanTarget,
        name: user?.name || cleanTarget.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ')
      })
    } else if (targetType === 'bulk_unsubscribed') {
      const allUsers = await db.collection('users').find({}).toArray()
      const allProfiles = allUsers.length > 0 ? allUsers : await db.collection('profiles').find({}).toArray()
      const seen = new Set<string>()
      allProfiles.forEach(t => {
        const em = (t.email || '').toLowerCase().trim()
        if (em && em.includes('@') && !seen.has(em)) {
          seen.add(em)
          rawTargets.push({
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
          rawTargets.push({
            email: em,
            name: t.name || em.split('@')[0]
          })
        }
      })
    }

    if (rawTargets.length === 0) {
      return NextResponse.json(
        { detail: 'No candidate recipients found for the selected target filter.' },
        { status: 400 }
      )
    }

    // Filter by sales eligibility (or allow all if admin explicitly overrides)
    const eligibleCandidates: Array<{ email: string; name: string }> = []
    const skippedCandidates: Array<{ email: string; name: string; reason: string }> = []

    for (const c of rawTargets) {
      const user = await db.collection('users').findOne({ email: { $regex: `^${c.email}$`, $options: 'i' } }) ||
                   await db.collection('profiles').findOne({ email: { $regex: `^${c.email}$`, $options: 'i' } })
      const el = evaluateOfferEligibility(user)
      if (el.eligible || forceOverride) {
        eligibleCandidates.push(c)
      } else {
        skippedCandidates.push({
          email: c.email,
          name: c.name,
          reason: el.reason
        })
      }
    }

    if (eligibleCandidates.length === 0) {
      return NextResponse.json({
        status: 'all_ineligible',
        detail: `All ${skippedCandidates.length} candidate(s) currently have active plans with > 48h remaining or VIP passes. Promotional offers are restricted to candidates with no plan, expired plan, or within 1-2 days of expiry to protect subscription value.`,
        skipped_count: skippedCandidates.length,
        skipped_candidates: skippedCandidates,
        can_override: true
      }, { status: 422 })
    }

    const candidatesToNotify = eligibleCandidates

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
            validity_hours: hours,
            expires_at: offerExpiresAt,
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
        message: `${offerTitle} — Pay only ${discountedPrice} (Regular ${originalPrice}) with code ${cleanPromoCode}. Expires in ${hours} hours.`,
        promo_code: cleanPromoCode,
        claim_url: claimUrl,
        read: false,
        created_at: new Date()
      })

      // 4. Dispatch background Web Push (reaches candidate OS outside browser via Google FCM / Apple APNs)
      try {
        const pushResult = await sendPushToUser(candidateEmailClean, {
          title: `🎁 Exclusive Offer: ${discountBadge}!`,
          body: `${offerTitle} (${originalPrice} → ${discountedPrice}). Code: ${cleanPromoCode}. Expires in ${hours}h.`,
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
      validity_hours: hours,
      expires_at: offerExpiresAt,
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

    const responseMsg = skippedCandidates.length > 0
      ? `✓ Offer dispatched to ${dispatchedRecipients.length} eligible candidate(s). Skipped ${skippedCandidates.length} candidate(s) with active subscriptions (> 48h remaining) to protect revenue.`
      : `✓ Offer successfully dispatched to ${dispatchedRecipients.length} candidate(s) (${totalEmailsSent} emails sent, ${totalPushDelivered} devices reached via Web Push).`

    return NextResponse.json({
      status: 'success',
      message: responseMsg,
      dispatched_count: dispatchedRecipients.length,
      skipped_count: skippedCandidates.length,
      skipped_candidates: skippedCandidates,
      emails_sent: totalEmailsSent,
      push_delivered: totalPushDelivered,
      recipients: dispatchedRecipients
    })
  } catch (err: any) {
    console.error('Admin offer dispatch error:', err)
    return NextResponse.json({ detail: err.message || 'Failed to dispatch offer campaign' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, userId, email: adminEmail } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const offerId = searchParams.get('id')
    const candidateEmail = searchParams.get('candidate_email')
    const promoCode = searchParams.get('promo_code')

    if (!offerId && !candidateEmail) {
      return NextResponse.json(
        { detail: 'Please specify offer id or candidate_email to remove offer.' },
        { status: 400 }
      )
    }

    let filter: any = {}
    if (offerId) {
      const { ObjectId } = await import('mongodb')
      try {
        filter._id = new ObjectId(offerId)
      } catch {
        filter._id = offerId
      }
    } else if (candidateEmail) {
      filter.candidate_email = candidateEmail.toLowerCase().trim()
      if (promoCode) {
        filter.promo_code = promoCode.trim().toUpperCase()
      }
    }

    const existing = await db.collection('assigned_offers').findOne(filter)
    if (!existing) {
      return NextResponse.json({ detail: 'Assigned offer not found or already removed.' }, { status: 404 })
    }

    // Permanently remove the assigned offer so it disappears from candidate dashboard & checkout
    await db.collection('assigned_offers').deleteOne(filter)

    // Clean up corresponding real-time notification
    if (existing.candidate_email && existing.promo_code) {
      await db.collection('user_notifications').deleteMany({
        email: existing.candidate_email,
        promo_code: existing.promo_code
      })
    }

    const { ip, userAgent } = getClientInfo(req)
    await logUserActivity(db, {
      userId: userId || 'admin',
      email: adminEmail || 'admin@jobfluxai.com',
      eventType: 'plan_update',
      description: `Revoked promotional offer "${existing.promo_code}" (${existing.offer_title}) from candidate ${existing.candidate_email}`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        revoked_promo: existing.promo_code,
        candidate_email: existing.candidate_email
      }
    })

    return NextResponse.json({
      status: 'success',
      message: `✓ Offer "${existing.promo_code}" (${existing.discount_badge || 'Promo'}) has been revoked from ${existing.candidate_email}. It has been completely removed from their account.`,
      revoked_id: offerId,
      candidate_email: existing.candidate_email,
      promo_code: existing.promo_code
    })
  } catch (err: any) {
    console.error('Admin delete offer error:', err)
    return NextResponse.json({ detail: err.message || 'Failed to revoke offer' }, { status: 500 })
  }
}
