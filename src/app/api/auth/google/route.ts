import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const emailClean = (body.email || '').trim().toLowerCase()
    const name = (body.name || '').trim()

    if (!emailClean) {
      return NextResponse.json(
        { detail: 'Google email is required.' },
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

    // 1. Check if user already exists
    let profile: any = await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    const now = new Date()

    if (!profile) {
      // 2. New Google user -> Initialize with 1-Day Free Trial
      let baseId = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      let userId = baseId
      let counter = 1
      while (await db.collection('profiles').findOne({ user_id: userId })) {
        userId = `${baseId}_${counter}`
        counter++
      }

      const trialExpires = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const newProfile: any = {
        user_id: userId,
        name: name || userId.replace('_', ' '),
        email: emailClean,
        password: '', // Authenticated via Google
        auth_provider: 'google',
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
        plan: 'trial',
        plan_name: '1-Day Free Trial',
        trial_started_at: now,
        trial_expires_at: trialExpires,
        created_at: now,
        updated_at: now
      }

      const insertResult = await db.collection('profiles').insertOne(newProfile)
      profile = { ...newProfile, _id: insertResult.insertedId }
    }

    if (!profile) {
      return NextResponse.json({ detail: 'Failed to find or create profile.' }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      role: 'user',
      user_id: profile.user_id,
      email: profile.email,
      name: profile.name || profile.user_id.replace('_', ' '),
      plan: profile.plan || 'trial',
      trial_expires_at: profile.trial_expires_at || null,
      message: 'Authenticated successfully via Google!'
    })
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Google authentication failed.' },
      { status: 500 }
    )
  }
}
