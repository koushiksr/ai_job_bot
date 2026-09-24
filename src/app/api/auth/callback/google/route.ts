import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo, recordLoginDevice } from '@/lib/activityLogger'
import { issueSession } from '@/lib/session'
import { getGoogleOAuthConfig, findProfileByEmail, ensureTechnohmProfile, resolveGoogleRole } from '@/lib/googleAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    const msg = encodeURIComponent(error || 'Google login cancelled or failed.')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }

  let clientId: string
  let clientSecret: string
  let redirectUri: string
  try {
    const cfg = getGoogleOAuthConfig(req)
    clientId = cfg.clientId
    clientSecret = cfg.clientSecret
    redirectUri = cfg.redirectUri
  } catch (e: any) {
    const msg = encodeURIComponent(e.message || 'Google OAuth is not configured.')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }

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

    let profile: any = await findProfileByEmail(db, emailClean)

    const now = new Date()

    if (emailClean === 'technohmsit@gmail.com') {
      profile = await ensureTechnohmProfile(db, profile, name, now)
    }

    if (!profile) {
      let baseId = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      let userId = baseId
      let counter = 1
      while (await db.collection('profiles').findOne({ user_id: userId })) {
        userId = `${baseId}_${counter}`
        counter++
      }

      const trialExpires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

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
        plan_name: 'JobFlux 3-Day Free Access',
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

    // 4. Determine user role and redirect path (shared Google role mapping)
    const { role, isSuperAdmin, isEntAdmin } = await resolveGoogleRole(db, profile, emailClean)
    const redirectPath = role === 'admin' ? '/admin' : role === 'enterprise_admin' ? '/enterprise-admin' : '/dashboard'

    // Log Google OAuth Redirect login activity
    const { ip, userAgent } = getClientInfo(req)
    const redirectDevice = await recordLoginDevice(db, {
      deviceId: req.cookies.get('jf_device_id')?.value || '',
      ip, userAgent, userId: profile.user_id, email: profile.email
    })
    await logUserActivity(db, {
      userId: profile.user_id,
      email: profile.email,
      eventType: 'login',
      description: `Candidate authenticated via Google OAuth Redirect (${role})`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        method: 'google_oauth_redirect',
        role: role,
        plan: profile.plan || 'trial',
        device_id: redirectDevice.deviceId,
        device_label: redirectDevice.label,
        device_trusted: redirectDevice.trusted
      }
    })

    const rawPlan = (profile.plan || 'trial').toLowerCase()
    let verifiedPlan = 'trial'
    if (rawPlan === 'org_pro') {
      const orgProExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      if (orgProExpires && orgProExpires > now) {
        verifiedPlan = 'org_pro'
      } else if (profile.enterprise_role === 'member') {
        verifiedPlan = 'enterprise'
      } else {
        verifiedPlan = 'trial'
      }
    } else if (profile.enterprise_role === 'member' || rawPlan === 'enterprise') {
      verifiedPlan = 'enterprise'
    } else if (rawPlan === 'vip') {
      verifiedPlan = 'vip'
    } else if (rawPlan !== 'trial') {
      const planExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      if (planExpires && planExpires > now) {
        verifiedPlan = rawPlan
      } else {
        verifiedPlan = 'trial'
      }
    }

    const targetUrl = new URL(redirectPath, req.url)
    targetUrl.searchParams.set('auth', 'google')
    targetUrl.searchParams.set('user_id', profile.user_id)
    targetUrl.searchParams.set('email', profile.email)
    targetUrl.searchParams.set('name', profile.name || profile.user_id.replace(/_/g, ' '))
    targetUrl.searchParams.set('plan', verifiedPlan)
    targetUrl.searchParams.set('role', role)
    if (profile.enterprise_org_id) {
      targetUrl.searchParams.set('org_id', profile.enterprise_org_id)
    }
    if (profile.picture || picture) {
      targetUrl.searchParams.set('picture', profile.picture || picture)
    }

    return issueSession(NextResponse.redirect(targetUrl), {
      uid: profile.user_id,
      email: profile.email,
      role: (role === 'admin' || role === 'enterprise_admin' ? role : 'user') as 'admin' | 'enterprise_admin' | 'user',
      orgId: profile.enterprise_org_id || null,
      entRole: profile.enterprise_role || null,
      v: Number(profile.session_v || 0)
    })
  } catch (err: any) {
    const msg = encodeURIComponent(err.message || 'Authentication with Google failed.')
    return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
  }
}

