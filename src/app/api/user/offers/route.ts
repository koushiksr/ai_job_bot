import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { PROMO_DISCOUNTS } from '@/config/plans'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/offers?email=user@example.com
 * Fetches active, unclaimed promotional offers and notifications assigned to a specific candidate.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const emailParam = searchParams.get('email')

    if (!emailParam) {
      return NextResponse.json({
        assigned_offers: [],
        unclaimed_count: 0,
        latest_offer: null,
        notifications: []
      })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const cleanEmail = emailParam.toLowerCase().trim()

    // 1. Fetch active unclaimed offers assigned to this specific candidate
    const assignedOffers = await db.collection('assigned_offers')
      .find({
        candidate_email: cleanEmail,
        claimed: false,
        revoked: { $ne: true }
      })
      .sort({ created_at: -1 })
      .toArray()

    // 2. Fetch unread notifications
    const notifications = await db.collection('user_notifications')
      .find({
        email: cleanEmail,
        read: false
      })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray()

    const now = new Date()
    const mappedOffers = assignedOffers.map(o => {
      const exp = o.expires_at ? new Date(o.expires_at) : null
      const isExpired = exp ? now > exp : false
      const hoursLeft = exp && !isExpired ? Math.round((exp.getTime() - now.getTime()) / 3600000) : 0
      return {
        id: o._id.toString(),
        promo_code: o.promo_code,
        preset_id: o.preset_id,
        offer_title: o.offer_title,
        discount_badge: o.discount_badge,
        original_price: o.original_price,
        discounted_price: o.discounted_price,
        claim_url: o.claim_url,
        custom_message: o.custom_message,
        expires_at: o.expires_at || null,
        validity_hours: o.validity_hours || 48,
        is_expired: isExpired,
        hours_left: hoursLeft,
        created_at: o.created_at
      }
    })

    const activeUnexpiredOffers = mappedOffers.filter(o => !o.is_expired)

    return NextResponse.json({
      assigned_offers: mappedOffers,
      unclaimed_count: activeUnexpiredOffers.length,
      latest_offer: activeUnexpiredOffers.length > 0 ? {
        promo_code: activeUnexpiredOffers[0].promo_code,
        offer_title: activeUnexpiredOffers[0].offer_title,
        discount_badge: activeUnexpiredOffers[0].discount_badge,
        discounted_price: activeUnexpiredOffers[0].discounted_price,
        original_price: activeUnexpiredOffers[0].original_price,
        claim_url: activeUnexpiredOffers[0].claim_url,
        expires_at: activeUnexpiredOffers[0].expires_at,
        hours_left: activeUnexpiredOffers[0].hours_left
      } : null,
      notifications: notifications.map(n => ({
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        promo_code: n.promo_code,
        claim_url: n.claim_url,
        created_at: n.created_at
      }))
    })
  } catch (err: any) {
    console.error('Error fetching candidate offers:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/user/offers
 * Validates whether a specific promo code is assigned to the candidate and eligible for checkout.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = (body.email || '').toLowerCase().trim()
    const cleanPromo = (body.promo_code || '').trim().toUpperCase()
    const planId = body.plan_id

    if (!cleanPromo) {
      return NextResponse.json({ valid: false, error: 'Please provide a promo code.' }, { status: 400 })
    }

    // 1. Verify promo preset exists in system configuration
    const discountConfig = PROMO_DISCOUNTS[cleanPromo]
    if (!discountConfig) {
      return NextResponse.json({
        valid: false,
        error: `Promo code "${cleanPromo}" is invalid or expired.`
      }, { status: 400 })
    }

    if (planId && !discountConfig.allowedPlans.includes(planId)) {
      return NextResponse.json({
        valid: false,
        error: `Promo code "${cleanPromo}" is valid for ${discountConfig.allowedPlans.join('/')}, not for the selected plan.`
      }, { status: 400 })
    }

    // 2. Query MongoDB to verify candidate assignment
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    if (!email) {
      return NextResponse.json({
        valid: false,
        error: 'Please sign in or enter your account email to verify offer assignment.'
      }, { status: 400 })
    }

    const assigned = await db.collection('assigned_offers').findOne({
      candidate_email: email,
      promo_code: cleanPromo,
      claimed: false,
      revoked: { $ne: true }
    })

    if (!assigned) {
      return NextResponse.json({
        valid: false,
        assigned_to_user: false,
        error: `Exclusive offer "${cleanPromo}" is not assigned to your account (${email}). Offers are individually assigned by the administrator.`
      }, { status: 403 })
    }

    // 3. Verify offer is not expired
    if (assigned.expires_at && new Date() > new Date(assigned.expires_at)) {
      return NextResponse.json({
        valid: false,
        assigned_to_user: true,
        expired: true,
        error: `This exclusive offer (${cleanPromo}) expired on ${new Date(assigned.expires_at).toLocaleDateString()}. Please contact support or check your dashboard for new offers.`
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      assigned_to_user: true,
      offer: {
        promo_code: assigned.promo_code,
        offer_title: assigned.offer_title,
        discount_badge: assigned.discount_badge,
        discounted_price: assigned.discounted_price,
        original_price: assigned.original_price,
        amount_paise: discountConfig.amount
      },
      message: `✓ Offer verified! ${assigned.discount_badge} applied to your account.`
    })
  } catch (err: any) {
    console.error('Error validating candidate promo code:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * PATCH /api/user/offers
 * Marks an individual notification or all notifications as read for a candidate.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { notification_id, email } = body

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    if (notification_id) {
      const { ObjectId } = await import('mongodb')
      try {
        await db.collection('user_notifications').updateOne(
          { _id: new ObjectId(notification_id) },
          { $set: { read: true, read_at: new Date() } }
        )
      } catch {
        // ID might be string or invalid, fallback
      }
    } else if (email) {
      await db.collection('user_notifications').updateMany(
        { email: email.toLowerCase().trim(), read: false },
        { $set: { read: true, read_at: new Date() } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

