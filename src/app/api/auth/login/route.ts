import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, { limit: 12, windowSeconds: 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { detail: `Too many sign-in attempts. Please wait ${rateCheck.resetSeconds} seconds before trying again.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const emailClean = (body.email || '').trim().toLowerCase()
    const pwdClean = (body.password || '').trim()
    const { ip, userAgent } = getClientInfo(req)

    const db = await getDb()

    // 1. Admin login check
    if (
      (
        emailClean === 'technohmsit@gmail.com' ||
        emailClean === 'technohmsit' ||
        emailClean === 'admin' ||
        emailClean === 'admin@jobfluxai.com' ||
        emailClean === 'admin@jobflux.ai' ||
        emailClean === 'admin@jobbot.ai' ||
        emailClean === 'admin@admin.com'
      ) &&
      pwdClean === 'admin'
    ) {
      const isTechnohm = emailClean === 'technohmsit@gmail.com' || emailClean === 'technohmsit'
      const adminUid = isTechnohm ? 'technohmsit' : 'admin'
      const adminMail = isTechnohm ? 'technohmsit@gmail.com' : (emailClean.includes('@') ? emailClean : 'admin@jobfluxai.com')

      if (db) {
        await logUserActivity(db, {
          userId: adminUid,
          email: adminMail,
          eventType: 'login',
          description: `Administrator signed in to central control hub (${adminMail})`,
          ipAddress: ip,
          userAgent: userAgent,
          metadata: { method: 'admin_password', role: 'admin' }
        })
      }

      return NextResponse.json({
        status: 'success',
        role: 'admin',
        user_id: adminUid,
        email: adminMail,
        name: isTechnohm ? 'Technohm SIT Administrator' : 'JobFlux Controller'
      })
    }

    // 2. Authenticate against cloud users & profiles collections
    if (!db) {
      return NextResponse.json(
        { detail: 'Database unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const profile = await db.collection('users').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    }) || await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    if (profile) {
      if (profile.password === pwdClean) {
        const assignedRole = (
          emailClean === 'technohmsit@gmail.com' ||
          emailClean === 'technohmsit' ||
          profile.user_id === 'technohmsit' ||
          (profile.email && profile.email.toLowerCase() === 'technohmsit@gmail.com') ||
          profile.role === 'admin'
        ) ? 'admin' : 'user'

        const rawPlan = (profile.plan || 'trial').toLowerCase()
        const now = new Date()
        let activePlan = 'trial'
        let planName = 'JobFlux 1-Day Free Trial'
        let isPlanActive = true

        if (rawPlan === 'none' || rawPlan === 'no_plan') {
          activePlan = 'none'
          planName = 'No Active Plan'
          isPlanActive = false
        } else if (rawPlan === 'vip') {
          activePlan = 'vip'
          planName = 'JobFlux VIP Elite'
          isPlanActive = true
        } else if (rawPlan !== 'trial') {
          const planExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
          if (planExpires && planExpires > now) {
            activePlan = rawPlan
            planName = profile.plan_name || `JobFlux ${rawPlan.toUpperCase()}`
            isPlanActive = true
          } else {
            // Plan expired or unverified
            activePlan = 'none'
            planName = 'Plan Expired (No Active Plan)'
            isPlanActive = false
          }
        } else {
          const trialExpires = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null
          isPlanActive = trialExpires ? trialExpires > now : true
          if (!isPlanActive) {
            activePlan = 'none'
            planName = 'Free Trial Expired (No Active Plan)'
          }
        }

        // Log candidate/admin login event
        await logUserActivity(db, {
          userId: profile.user_id,
          email: profile.email,
          eventType: 'login',
          description: assignedRole === 'admin' ? `Administrator signed in (${profile.user_id})` : `Candidate signed in successfully (Method: Password)`,
          ipAddress: ip,
          userAgent: userAgent,
          metadata: {
            method: 'password',
            role: assignedRole,
            plan: activePlan
          }
        })

        return NextResponse.json({
          status: 'success',
          role: assignedRole,
          user_id: profile.user_id,
          email: profile.email,
          name: profile.name || profile.user_id.replace('_', ' '),
          plan: activePlan,
          plan_name: planName,
          is_plan_active: isPlanActive,
          plan_expires_at: profile.plan_expires_at || null,
          trial_expires_at: profile.trial_expires_at || null
        })
      } else {
        return NextResponse.json(
          { detail: 'Invalid password. Please check your credentials.' },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { detail: 'Invalid email or password. Candidate account not found.' },
      { status: 401 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { detail: err.message || 'Authentication error' },
      { status: 500 }
    )
  }
}
