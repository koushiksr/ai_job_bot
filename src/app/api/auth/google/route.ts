import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo, recordLoginDevice } from '@/lib/activityLogger'
import { findActivePaymentForEmail, syncUserPaymentPlan } from '@/lib/paymentSync'
import { issueSession } from '@/lib/session'
import { mintDeviceSession } from '@/lib/sessionRegistry'
import { exactMatchCI } from '@/lib/query'
import { findProfileByEmail, ensureTechnohmProfile, resolveGoogleRole } from '@/lib/googleAuth'
import { generateUniqueReferralCode, findReferrer } from '@/lib/referral'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    let emailClean = (body.email || '').trim().toLowerCase()
    let name = (body.name || '').trim()
    let picture = (body.picture || '').trim()

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
          if (payload.picture && !picture) {
            picture = payload.picture.trim()
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
    let profile: any = await findProfileByEmail(db, emailClean)

    const now = new Date()

    if (emailClean === 'technohmsit@gmail.com') {
      profile = await ensureTechnohmProfile(db, profile, name, now)
    }

    if (!profile) {
      // 2. New Google user -> Check if an active purchased plan already exists for this email
      let baseId = emailClean.split('@')[0].replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      let userId = baseId
      let counter = 1
      while (await db.collection('profiles').findOne({ user_id: userId })) {
        userId = `${baseId}_${counter}`
        counter++
      }

      const trialExpires = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      const activePayment = await findActivePaymentForEmail(db, emailClean)

      let initialPlan = 'trial'
      let initialPlanName = '3-Day Free Access'
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

      const newProfile: any = {
        user_id: userId,
        name: name || userId.replace('_', ' '),
        email: emailClean,
        password: '', // Authenticated via Google
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
        plan: initialPlan,
        plan_name: initialPlanName,
        trial_started_at: now,
        trial_expires_at: trialExpires,
        plan_activated_at: planActivatedAt,
        plan_expires_at: planExpiresAt,
        last_payment_id: lastPaymentId,
        last_order_id: lastOrderId,
        referral_code: await generateUniqueReferralCode(db),
        referred_by: (body.referral_code || body.ref || null)?.toString().trim() || null,
        payout_type: 'upi',
        upi_id: '',
        bank_details: {
          account_number: '',
          ifsc_code: '',
          account_holder_name: '',
          bank_name: ''
        },
        created_at: now,
        updated_at: now
      }

      const insertResult = await db.collection('profiles').insertOne(newProfile)
      await db.collection('users').insertOne({ ...newProfile })

      // Link any existing payments to the new Google user_id
      await db.collection('payments').updateMany(
        { email: exactMatchCI(emailClean) },
        { $set: { user_id: userId } }
      )

      profile = { ...newProfile, _id: insertResult.insertedId }
    } else {
      if (picture && !profile.picture) {
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

      // Sync any unlinked or recent payment for existing candidate
      await syncUserPaymentPlan(db, profile.user_id, emailClean, profile)
    }

    if (!profile) {
      return NextResponse.json({ detail: 'Failed to find or create profile.' }, { status: 500 })
    }

    if (!profile) {
      return NextResponse.json({ detail: 'Failed to find or create profile.' }, { status: 500 })
    }

    const { role, isSuperAdmin, isEntAdmin, orgAsAdmin } = await resolveGoogleRole(db, profile, emailClean)
    const enterpriseOrgId = profile.enterprise_org_id || orgAsAdmin?.org_id || (isEntAdmin ? 'org_technohmsit' : null)

    // Log Google GIS sign-in activity
    const { ip, userAgent } = getClientInfo(req)
    const gisDevice = await recordLoginDevice(db, {
      deviceId: (body.device_id || req.cookies.get('jf_device_id')?.value || '').trim(),
      ip, userAgent, userId: profile.user_id, email: profile.email
    })
    // Bind this browser to the identity
    try {
      const gisVid = (body.visitor_id || '').trim()
      if (gisVid) {
        const { linkVisitorToUser } = await import('@/lib/visitorIdentity')
        await linkVisitorToUser(db, { visitor_id: gisVid, email: profile.email, user_id: profile.user_id })
      }
    } catch {}
    await logUserActivity(db, {
      userId: profile.user_id,
      email: profile.email,
      eventType: 'login',
      description: role === 'admin'
        ? `Administrator signed in via Google OAuth GIS`
        : role === 'enterprise_admin'
          ? `Enterprise Administrator signed in via Google OAuth GIS (${profile.email})`
          : `Candidate signed in via Google OAuth GIS`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        method: 'google_gis',
        role: role,
        plan: profile.plan || 'trial',
        enterprise_org_id: enterpriseOrgId,
        device_id: gisDevice.deviceId,
        device_label: gisDevice.label,
        device_trusted: gisDevice.trusted
      }
    })

    const rawPlan = (profile.plan || 'trial').toLowerCase()
    let verifiedPlan = 'trial'
    let planName = 'JobFlux 3-Day Free Access'
    let isPlanActive = true

    if (rawPlan === 'org_pro') {
      const orgProExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      if (orgProExpires && orgProExpires > now) {
        verifiedPlan = 'org_pro'
        planName = 'JobFlux Org Pro'
        isPlanActive = true
      } else if (profile.enterprise_role === 'member') {
        verifiedPlan = 'enterprise'
        planName = 'JobFlux Enterprise Member'
        isPlanActive = true
      } else {
        verifiedPlan = 'trial'
        planName = 'JobFlux 3-Day Free Access (Plan Expired)'
        isPlanActive = false
      }
    } else if (profile.enterprise_role === 'member' || rawPlan === 'enterprise') {
      verifiedPlan = 'enterprise'
      planName = 'JobFlux Enterprise Member'
      isPlanActive = true
    } else if (rawPlan === 'vip') {
      verifiedPlan = 'vip'
      planName = 'JobFlux VIP Elite'
      isPlanActive = true
    } else if (rawPlan !== 'trial') {
      const planExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      if (planExpires && planExpires > now) {
        verifiedPlan = rawPlan
        planName = profile.plan_name || `JobFlux ${rawPlan.toUpperCase()}`
        isPlanActive = true
      } else {
        verifiedPlan = 'trial'
        planName = 'JobFlux 3-Day Free Access (Plan Expired)'
        isPlanActive = false
      }
    } else {
      const trialExpires = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null
      isPlanActive = trialExpires ? trialExpires > now : true
    }

    return issueSession(
      NextResponse.json({
        status: 'success',
        role: role,
        user_id: profile.user_id,
        email: profile.email,
        name: profile.name || profile.user_id.replace('_', ' '),
        picture: profile.picture || picture || '',
        plan: verifiedPlan,
        plan_name: planName,
        is_plan_active: isPlanActive,
        enterprise_org_id: enterpriseOrgId,
        enterprise_role: isEntAdmin ? 'admin' : (profile.enterprise_role || null),
        plan_expires_at: profile.plan_expires_at || null,
        trial_expires_at: profile.trial_expires_at || null,
        message: 'Authenticated successfully via Google!'
      }),
      {
        uid: profile.user_id,
        email: profile.email,
        role: (role === 'admin' || role === 'enterprise_admin' ? role : 'user') as 'admin' | 'enterprise_admin' | 'user',
        orgId: enterpriseOrgId,
        entRole: isEntAdmin ? 'admin' : (profile.enterprise_role || null),
        v: Number(profile.session_v || 0),
        jti: await mintDeviceSession(profile.user_id, req.headers.get('user-agent'))
      }
    )
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Google authentication failed.' },
      { status: 500 }
    )
  }
}
