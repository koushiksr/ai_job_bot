import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

const PLAN_AMOUNTS: Record<string, { amount: number; name: string; days: number }> = {
  starter: { amount: 9900, name: 'JobFlux 1-Month Plan (30 Days)', days: 30 },
  pro: { amount: 9900, name: 'JobFlux 1-Month Career Pro (30 Days)', days: 30 },
  elite: { amount: 19900, name: 'JobFlux 3-Month Professional Plan (90 Days)', days: 90 },
  professional: { amount: 19900, name: 'JobFlux 3-Month Professional Plan (90 Days)', days: 90 }
}

export const PROMO_DISCOUNTS: Record<string, { amount: number; name: string; allowedPlans: string[]; days: number }> = {
  FLASH49: { amount: 4900, name: 'JobFlux Essentials - 95% Flash Pass (30 Days)', allowedPlans: ['pro', 'starter'], days: 30 },
  SPRINT69: { amount: 6900, name: 'JobFlux Essentials - 93% Sprint Pass (30 Days)', allowedPlans: ['pro', 'starter'], days: 30 },
  OFFER90: { amount: 9900, name: 'JobFlux Essentials - 90% Special Pass (30 Days)', allowedPlans: ['pro', 'starter'], days: 30 },
  PRO199: { amount: 19900, name: 'JobFlux Professional - 92% 3-Month Pass (90 Days)', allowedPlans: ['elite', 'professional'], days: 90 },
  PRO129: { amount: 12900, name: 'JobFlux Professional - 95% Fast-Track (90 Days)', allowedPlans: ['elite', 'professional'], days: 90 },
  VIP299: { amount: 29900, name: 'JobFlux Professional - 97% VIP Annual Pass (365 Days)', allowedPlans: ['elite', 'professional'], days: 365 }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan_id, user_id, email, promo_code } = body

    const plan = PLAN_AMOUNTS[plan_id]
    if (!plan) {
      return NextResponse.json({ detail: 'Invalid plan selected' }, { status: 400 })
    }

    const cleanPromo = (promo_code || '').trim().toUpperCase()
    let orderAmount = plan.amount
    let orderPlanName = plan.name
    let promoApplied = false
    let assignedOfferId = ''

    if (cleanPromo && PROMO_DISCOUNTS[cleanPromo]) {
      const discount = PROMO_DISCOUNTS[cleanPromo]
      if (!discount.allowedPlans.includes(plan_id)) {
        return NextResponse.json({
          detail: `Promo code "${cleanPromo}" is valid for ${discount.allowedPlans.join('/')}, not ${plan_id}.`
        }, { status: 400 })
      }

      // STRICT CANDIDATE-LOCK: Verify offer was assigned to this candidate's email
      const db = await getDb()
      if (!db) {
        return NextResponse.json({ detail: 'Database unavailable for offer verification' }, { status: 503 })
      }

      const candidateEmailClean = (email || '').toLowerCase().trim()
      if (!candidateEmailClean) {
        return NextResponse.json({
          detail: 'Account email is required to verify exclusive promotional offer eligibility.'
        }, { status: 400 })
      }

      const assigned = await db.collection('assigned_offers').findOne({
        candidate_email: candidateEmailClean,
        promo_code: cleanPromo,
        claimed: false
      })

      if (!assigned) {
        return NextResponse.json({
          detail: `Exclusive promotional rate "${cleanPromo}" is not assigned to your account (${candidateEmailClean}). Only candidates assigned by the administrator can claim this offer.`
        }, { status: 403 })
      }

      orderAmount = discount.amount
      orderPlanName = discount.name
      promoApplied = true
      assignedOfferId = assigned._id.toString()
    } else if (cleanPromo && !PROMO_DISCOUNTS[cleanPromo]) {
      return NextResponse.json({ detail: `Invalid promotional code "${cleanPromo}".` }, { status: 400 })
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { detail: 'Razorpay keys are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' },
        { status: 500 }
      )
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    })

    const receipt = `rcpt_${(user_id || 'guest').slice(0, 15)}_${Date.now()}`.slice(0, 40)

    const order = await razorpay.orders.create({
      amount: orderAmount,
      currency: 'INR',
      receipt: receipt,
      notes: {
        plan_id: plan_id,
        plan_name: orderPlanName,
        promo_code: promoApplied ? cleanPromo : '',
        assigned_offer_id: assignedOfferId,
        user_id: user_id || '',
        email: email || ''
      }
    })

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan_name: orderPlanName,
      promo_applied: promoApplied,
      promo_code: promoApplied ? cleanPromo : null
    })
  } catch (err: any) {
    console.error('Razorpay order creation error:', err)
    return NextResponse.json(
      { detail: err.message || 'Failed to create payment order.' },
      { status: 500 }
    )
  }
}

