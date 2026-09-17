import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { findActivePaymentForEmail } from '@/lib/paymentSync'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    const emailClean = (body.email || '').trim().toLowerCase()
    const pwdClean = (body.password || '').trim()

    if (!emailClean || !pwdClean) {
      return NextResponse.json(
        { detail: 'Email and password are required.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { detail: 'Database unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Check if candidate account already exists
    const existing = await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    if (existing) {
      return NextResponse.json(
        { detail: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    // Generate unique user_id based on email prefix
    let baseId = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    let userId = baseId
    let counter = 1
    while (await db.collection('profiles').findOne({ user_id: userId })) {
      userId = `${baseId}_${counter}`
      counter++
    }

    const now = new Date()
    // 3-Day Free Access expires 72 hours from now
    const trialExpires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Check if this email has an active purchased plan in the payments collection
    const activePayment = await findActivePaymentForEmail(db, emailClean)
    let initialPlan = 'trial'
    let initialPlanName = 'JobFlux 3-Day Free Access'
    let planActivatedAt: Date | null = null
    let planExpiresAt: Date | null = null
    let lastPaymentId: string | null = null
    let lastOrderId: string | null = null

    if (activePayment.payment && activePayment.isActive && activePayment.expiresAt) {
      const p = activePayment.payment
      const rawPlanId = p.plan_id || 'pro'
      initialPlan = rawPlanId === 'starter' ? 'pro' : rawPlanId
      initialPlanName =
        initialPlan === 'elite' || initialPlan === 'professional'
          ? 'JobFlux Professional'
          : 'JobFlux Essentials'
      planActivatedAt = p.verified_at ? new Date(p.verified_at) : now
      planExpiresAt = activePayment.expiresAt
      lastPaymentId = p.payment_id || null
      lastOrderId = p.order_id || null
    }

    const newProfile = {
      user_id: userId,
      name: name || userId.replace('_', ' '),
      email: emailClean,
      password: pwdClean,
      experience: 1,
      current_ctc: 0,
      expected_ctc: 0,
      search_url: 'https://www.naukri.com/mnjuser/recommendedjobs',
      skills: [],
      job_filters: {
        location: ['Bangalore', 'Remote', 'Hyderabad', 'Mumbai'],
        keywords: [],
        must_have_keywords: [],
        avoid_companies: []
      },
      predefined_answers: {
        'What is your notice period?': 'Immediate / 15 Days',
        'Are you on a career break?': 'No'
      },
      enabled_for_daily_run: true,
      role: 'user',
      is_vip: false,
      plan: initialPlan,
      plan_name: initialPlanName,
      trial_started_at: now,
      trial_expires_at: trialExpires,
      plan_activated_at: planActivatedAt,
      plan_expires_at: planExpiresAt,
      last_payment_id: lastPaymentId,
      last_order_id: lastOrderId,
      created_at: now,
      updated_at: now
    }

    await db.collection('profiles').insertOne({ ...newProfile })
    await db.collection('users').insertOne({ ...newProfile })

    // Link any existing payments for this email to the new user_id
    await db.collection('payments').updateMany(
      { email: { $regex: `^${emailClean}$`, $options: 'i' } },
      { $set: { user_id: userId } }
    )

    // Initialize clean user_stats record
    await db.collection('user_stats').updateOne(
      { user_id: userId },
      {
        $setOnInsert: {
          user_id: userId,
          today: 0,
          this_week: 0,
          this_month: 0,
          total_applied: 0,
          last_applied_at: null,
          last_date: now.toISOString().split('T')[0]
        }
      },
      { upsert: true }
    )

    const isPaid = initialPlan !== 'trial'
    return NextResponse.json({
      status: 'success',
      role: 'user',
      user_id: userId,
      email: emailClean,
      name: newProfile.name,
      plan: initialPlan,
      plan_name: initialPlanName,
      plan_expires_at: planExpiresAt ? planExpiresAt.toISOString() : null,
      trial_expires_at: trialExpires.toISOString(),
      message: isPaid
        ? `Your verified purchase (${initialPlanName}) has been automatically linked and activated!`
        : 'Your 3-Day Free Access (up to 150 applications) has been activated!'
    })
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Registration failed.' },
      { status: 500 }
    )
  }
}

