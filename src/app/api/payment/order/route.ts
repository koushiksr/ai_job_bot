import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

import { PLAN_AMOUNTS, PROMO_DISCOUNTS } from '@/config/plans'
import { exactMatchCI } from '@/lib/query'
export { PROMO_DISCOUNTS }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan_id, user_id, email, promo_code } = body

    const plan = PLAN_AMOUNTS[plan_id]
    if (!plan) {
      return NextResponse.json({ detail: 'Invalid plan selected' }, { status: 400 })
    }

    // Org plans are exclusive to verified organization members (members-only upgrade)
    if (plan_id === 'org_starter' || plan_id === 'org_pro' || plan_id === 'org_pro_3m') {
      const db = await getDb()
      const cleanEmail = ((email || '') as string).toLowerCase().trim()
      const cleanUid = ((user_id || '') as string).trim()
      const memberProfile = db ? await db.collection('profiles').findOne({
        $or: [
          ...(cleanUid ? [{ user_id: cleanUid }] : []),
          ...(cleanEmail ? [{ email: exactMatchCI(cleanEmail) }] : [])
        ]
      }) : null
      if (!memberProfile?.enterprise_org_id && !memberProfile?.org_id) {
        return NextResponse.json({ detail: 'This plan is available only to organization members. Join an organization first.' }, { status: 403 })
      }
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

      const candidateEmailClean = (email || '').toLowerCase().trim()
      const db = await getDb()
      if (db && candidateEmailClean) {
        const assigned = await db.collection('assigned_offers').findOne({
          candidate_email: candidateEmailClean,
          promo_code: cleanPromo,
          claimed: false
        })
        if (assigned) {
          assignedOfferId = assigned._id.toString()
        }
      }

      orderAmount = discount.amount
      orderPlanName = discount.name
      promoApplied = true
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

