import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '@/lib/mongodb'
import { PLAN_DAYS, PROMO_DISCOUNTS } from '@/config/plans'
import { exactMatchCI } from '@/lib/query'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
      promo_code,
      user_id,
      email
    } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { detail: 'Missing required Razorpay payment confirmation fields.' },
        { status: 400 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json(
        { detail: 'Razorpay Key Secret is missing on the server.' },
        { status: 500 }
      )
    }

    // 1. Verify HMAC SHA256 signature
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { detail: 'Invalid payment signature. Verification failed.' },
        { status: 400 }
      )
    }

    // 2. Connect to MongoDB and update candidate profile
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database connection failed.' }, { status: 500 })
    }

    const now = new Date()
    const cleanPromo = (promo_code || '').trim().toUpperCase()
    let durationDays = PLAN_DAYS[plan_id] || 30
    let recordedAmount = plan_id === 'elite' || plan_id === 'professional' ? '₹199' : '₹99'

    if (cleanPromo && PROMO_DISCOUNTS[cleanPromo]) {
      const discount = PROMO_DISCOUNTS[cleanPromo]
      if (discount.allowedPlans.includes(plan_id)) {
        recordedAmount = `₹${discount.amount / 100}`
        if (discount.days) durationDays = discount.days
      }
    }

    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const cleanEmail = (email || '').toLowerCase().trim()
    let resolvedUserId = user_id || null
    if (!resolvedUserId && cleanEmail) {
      const existingProfile = await db.collection('profiles').findOne({
        email: exactMatchCI(cleanEmail)
      })
      if (existingProfile) {
        resolvedUserId = existingProfile.user_id
      }
    }

    let query: any = null
    if (resolvedUserId && cleanEmail) {
      query = {
        $or: [
          { user_id: resolvedUserId },
          { email: exactMatchCI(cleanEmail) }
        ]
      }
    } else if (resolvedUserId) {
      query = { user_id: resolvedUserId }
    } else if (cleanEmail) {
      query = { email: exactMatchCI(cleanEmail) }
    }

    const planDisplayName = 
      plan_id === 'org_starter' ? 'Org Starter' :
      plan_id === 'org_pro' ? 'Org Pro' :
      plan_id === 'org_pro_3m' ? 'Org Pro (3 Months)' :
      plan_id.toUpperCase()

    const resolvedDailyLimit = 
      (plan_id === 'org_pro' || plan_id === 'org_pro_3m' || plan_id === 'pro' || plan_id === 'elite') ? 55 : 20

    const updateFields: any = {
      plan: plan_id,
      plan_name: 
        plan_id === 'org_starter' ? 'JobFlux Org Starter' :
        plan_id === 'org_pro' ? 'JobFlux Org Pro' :
        plan_id === 'org_pro_3m' ? 'JobFlux Org Pro (3 Months)' :
        `JobFlux ${plan_id.toUpperCase()}`,
      daily_application_limit: resolvedDailyLimit,
      plan_activated_at: now,
      plan_expires_at: expiresAt,
      trial_expires_at: null,
      enabled_for_daily_run: true,
      last_payment_id: razorpay_payment_id,
      last_order_id: razorpay_order_id,
      updated_at: now
    }

    if (query) {
      await db.collection('profiles').updateMany(query, { $set: updateFields })
      await db.collection('users').updateMany(query, { $set: updateFields })
    }

    // 3. If an assigned offer promo was applied, mark it permanently as claimed
    if (cleanPromo) {
      await db.collection('assigned_offers').updateMany(
        {
          promo_code: cleanPromo,
          candidate_email: cleanEmail,
          claimed: false
        },
        {
          $set: {
            claimed: true,
            claimed_at: now,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
          }
        }
      )
    }

    // 4. Record verified transaction in payments collection
    await db.collection('payments').insertOne({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      user_id: resolvedUserId,
      email: cleanEmail || null,
      plan_id: plan_id,
      promo_code: cleanPromo || null,
      amount: recordedAmount,
      verified_at: now,
      expires_at: expiresAt,
      status: 'captured'
    })

    return NextResponse.json({
      success: true,
      verified: true,
      plan: plan_id,
      plan_name: plan_id === 'org_pro' ? 'JobFlux Org Pro' : `JobFlux ${plan_id.toUpperCase()}`,
      plan_activated_at: now,
      plan_expires_at: expiresAt,
      message: `Payment confirmed! ${planDisplayName} plan activated successfully for ${durationDays} days.`
    })
  } catch (err: any) {
    console.error('Payment verification error:', err)
    return NextResponse.json(
      { detail: err.message || 'Payment verification failed.' },
      { status: 500 }
    )
  }
}

