import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

export const dynamic = 'force-dynamic'

const PLAN_AMOUNTS: Record<string, { amount: number; name: string; days: number }> = {
  starter: { amount: 49900, name: 'JobFlux 1-Month Plan (30 Days)', days: 30 },
  pro: { amount: 49900, name: 'JobFlux 1-Month Career Pro (30 Days)', days: 30 },
  elite: { amount: 119900, name: 'JobFlux 3-Month Career Elite (90 Days)', days: 90 }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan_id, user_id, email } = body

    const plan = PLAN_AMOUNTS[plan_id]
    if (!plan) {
      return NextResponse.json({ detail: 'Invalid plan selected' }, { status: 400 })
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
      amount: plan.amount,
      currency: 'INR',
      receipt: receipt,
      notes: {
        plan_id: plan_id,
        plan_name: plan.name,
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
      plan_name: plan.name
    })
  } catch (err: any) {
    console.error('Razorpay order creation error:', err)
    return NextResponse.json(
      { detail: err.message || 'Failed to create payment order.' },
      { status: 500 }
    )
  }
}

