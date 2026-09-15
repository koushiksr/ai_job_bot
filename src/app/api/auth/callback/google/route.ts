import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    const msg = encodeURIComponent(error || 'Google login cancelled or failed.')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    const msg = encodeURIComponent('Server configuration error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing.')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }

  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host') || 'jobfluxai.vercel.app'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || `${forwardedProto}://${host}`).replace(/\/+$/, '')
  const redirectUri = `${appUrl}/api/auth/callback/google`

  try {
    // 1. Exchange authorization code with Google for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Google token exchange failed')
    }

    // 2. Fetch authenticated user info from Google's official userinfo endpoint
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    })
    const userData = await userRes.json()

    const emailClean = (userData.email || '').trim().toLowerCase()
    const name = (userData.name || emailClean.split('@')[0]).trim()
    const picture = (userData.picture || '').trim()

    if (!emailClean) {
      throw new Error('Google did not return a valid email address.')
    }

    // 3. Match or initialize candidate profile in MongoDB
    const db = await getDb()
    if (!db) {
      throw new Error('Database connection failed.')
    }

    let profile: any = await db.collection('users').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    }) || await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    const now = new Date()

    if (emailClean === 'technohmsit@gmail.com') {
      if (!profile) {
        profile = {
          user_id: 'technohmsit',
          name: name || 'Technohm SIT Administrator',
          email: 'technohmsit@gmail.com',
          role: 'admin',
          plan: 'trial',
          plan_name: 'JobFlux 1-Day Free Trial',
          created_at: now,
          updated_at: now
        }
      } else {
        profile.user_id = 'technohmsit'
        profile.role = 'admin'
      }
      await db.collection('profiles').updateOne(
        { email: { $regex: '^technohmsit@gmail\\.com$', $options: 'i' } },
        { $set: { role: 'admin', user_id: 'technohmsit' } },
        { upsert: true }
      )
      await db.collection('users').updateOne(
        { email: { $regex: '^technohmsit@gmail\\.com$', $options: 'i' } },
        { $set: { role: 'admin', user_id: 'technohmsit' } },
        { upsert: true }
      )
    }

    if (!profile) {
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
        name: name,
        email: emailClean,
        password: '',
        picture: picture || '',
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
        role: 'user',
        is_vip: false,
        plan: 'trial',
        plan_name: 'JobFlux 1-Day Free Trial',
        trial_started_at: now,
        trial_expires_at: trialExpires,
        created_at: now,
        updated_at: now
      }

      const insertResult = await db.collection('profiles').insertOne({ ...newProfile })
      await db.collection('users').insertOne({ ...newProfile })

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
      profile = { ...newProfile, _id: insertResult.insertedId }
    } else if (picture && !profile.picture) {
      // Sync Google picture if candidate doesn't have a custom picture
      await db.collection('profiles').updateOne(
        { user_id: profile.user_id },
        { $set: { picture } }
      )
      await db.collection('users').updateOne(
        { user_id: profile.user_id },
        { $set: { picture } }
      )
      profile.picture = picture
    }

    // 4. Redirect to dashboard with authentication params
    const role = (
      emailClean === 'technohmsit@gmail.com' ||
      emailClean === 'admin@jobfluxai.com' ||
      emailClean === 'admin@jobflux.ai' ||
      profile.role === 'admin'
    ) ? 'admin' : 'user'

    // Log Google OAuth Redirect login activity
    const { ip, userAgent } = getClientInfo(req)
    await logUserActivity(db, {
      userId: profile.user_id,
      email: profile.email,
      eventType: 'login',
      description: `Candidate authenticated via Google OAuth Redirect`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        method: 'google_oauth_redirect',
        role: role,
        plan: profile.plan || 'trial'
      }
    })

    const rawPlan = (profile.plan || 'trial').toLowerCase()
    let verifiedPlan = 'trial'
    if (rawPlan === 'vip') {
      verifiedPlan = 'vip'
    } else if (rawPlan !== 'trial') {
      const planExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      if (planExpires && planExpires > now) {
        verifiedPlan = rawPlan
      } else {
        verifiedPlan = 'trial'
      }
    }

    const targetUrl = new URL(role === 'admin' ? '/admin' : '/dashboard', req.url)
    targetUrl.searchParams.set('auth', 'google')
    targetUrl.searchParams.set('user_id', profile.user_id)
    targetUrl.searchParams.set('email', profile.email)
    targetUrl.searchParams.set('name', profile.name || profile.user_id.replace(/_/g, ' '))
    targetUrl.searchParams.set('plan', verifiedPlan)
    targetUrl.searchParams.set('role', role)
    if (profile.picture || picture) {
      targetUrl.searchParams.set('picture', profile.picture || picture)
    }

    return NextResponse.redirect(targetUrl)
  } catch (err: any) {
    const msg = encodeURIComponent(err.message || 'Authentication with Google failed.')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }
}

