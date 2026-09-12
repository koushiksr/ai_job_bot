import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ accounts: [] }, { status: 200 })
    }
    const profiles = await db.collection('profiles')
      .find({}, { projection: { user_id: 1, email: 1, name: 1, plan: 1, _id: 0 } })
      .limit(10)
      .toArray()

    return NextResponse.json({
      accounts: profiles
        .filter(p => p.email)
        .map(p => ({
          user_id: p.user_id,
          email: p.email,
          name: p.name || p.user_id.replace(/^candidate\d+_/, '').replace(/_/g, ' '),
          plan: p.plan || 'trial'
        }))
    })
  } catch (err: any) {
    return NextResponse.json({ accounts: [] }, { status: 200 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let emailClean = (body.email || '').trim().toLowerCase()
    let name = (body.name || '').trim()

    // Support Google Identity Services (GIS) JWT ID token
    if (body.credential) {
      try {
        const parts = body.credential.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'))
          if (payload.email) {
            emailClean = payload.email.trim().toLowerCase()
          }
          if (payload.name && !name) {
            name = payload.name.trim()
          }
        }
      } catch (e) {
        console.error('Failed to parse Google JWT credential:', e)
      }
    }

    if (!emailClean) {
      return NextResponse.json(
        { detail: 'Google account email is required.' },
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

    const role = (
      emailClean === 'admin@jobfluxai.com' ||
      emailClean === 'admin@jobflux.ai' ||
      profile.role === 'admin'
    ) ? 'admin' : (profile.role || 'user')

    return NextResponse.json({
      status: 'success',
      role: role,
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
