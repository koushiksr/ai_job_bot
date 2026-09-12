import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    const emailClean = (body.email || '').trim().toLowerCase()
    const pwdClean = (body.password || '').trim()
    const selectedPlan = body.plan || 'trial'

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
    // 1-Day Trial expires 24 hours from now
    const trialExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000)

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
      plan: selectedPlan,
      plan_name: selectedPlan === 'trial' ? '1-Day Free Trial' : selectedPlan,
      trial_started_at: now,
      trial_expires_at: trialExpires,
      created_at: now,
      updated_at: now
    }

    await db.collection('profiles').insertOne(newProfile)

    return NextResponse.json({
      status: 'success',
      role: 'user',
      user_id: userId,
      email: emailClean,
      name: newProfile.name,
      plan: newProfile.plan,
      trial_expires_at: trialExpires.toISOString(),
      message: 'Your 1-Day Free Trial has been activated!'
    })
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Registration failed.' },
      { status: 500 }
    )
  }
}

