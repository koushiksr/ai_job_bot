import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

const PLAN_DAYS: Record<string, number> = {
  starter: 7,
  pro: 30,
  elite: 90
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan_id,
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
    const durationDays = PLAN_DAYS[plan_id] || 30
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

    const query: any = {}
    if (user_id) {
      query.user_id = user_id
    } else if (email) {
      query.email = { $regex: `^${email.trim()}$`, $options: 'i' }
    }

    const updateFields: any = {
      plan: plan_id,
      plan_name: `JobFlux ${plan_id.toUpperCase()}`,
      plan_activated_at: now,
      plan_expires_at: expiresAt,
      enabled_for_daily_run: true,
      last_payment_id: razorpay_payment_id,
      last_order_id: razorpay_order_id,
      updated_at: now
    }

    if (Object.keys(query).length > 0) {
      await db.collection('profiles').updateOne(query, { $set: updateFields }, { upsert: false })
    }

    // 3. Record transaction in payments collection
    await db.collection('payments').insertOne({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      user_id: user_id || null,
      email: email || null,
      plan_id: plan_id,
      verified_at: now,
      expires_at: expiresAt,
      status: 'captured'
    })

    return NextResponse.json({
      success: true,
      plan: plan_id,
      expires_at: expiresAt,
      message: `Plan activated successfully! Active for ${durationDays} days.`
    })
  } catch (err: any) {
    console.error('Payment verification error:', err)
    return NextResponse.json(
      { detail: err.message || 'Payment verification failed.' },
      { status: 500 }
    )
  }
}

