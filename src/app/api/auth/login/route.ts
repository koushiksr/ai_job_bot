import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo, recordLoginDevice } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'
import { APP_CONFIG } from '@/config/appConfig'
import { syncUserPaymentPlan } from '@/lib/paymentSync'
import { issueSession } from '@/lib/session'
import { exactMatchCI } from '@/lib/query'

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req, { limit: 12, windowSeconds: 60 })
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
    const rawDeviceId = (body.device_id || req.cookies.get('jf_device_id')?.value || '').trim()

    const db = await getDb()

    // NOTE: technohmsit authenticates ONLY via its DB record (password stored
    // in profiles/users). There is intentionally no env-based admin login —
    // one credential store, audited in one place.

    // 1. Authenticate against cloud users & profiles collections
    if (!db) {
      return NextResponse.json(
        { detail: 'Database unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const profile = await db.collection('users').findOne({
      email: exactMatchCI(emailClean)
    }) || await db.collection('profiles').findOne({
      email: exactMatchCI(emailClean)
    })

    if (profile) {
      if (profile.password === pwdClean) {
        // Sync any unlinked or newly purchased plan from payments collection
        await syncUserPaymentPlan(db, profile.user_id, emailClean, profile)

        // Check Enterprise Admin designation
        const isSuperAdmin = (
          (emailClean === 'technohmsit@gmail.com' || profile.user_id === 'technohmsit' || profile.email === 'technohmsit@gmail.com') &&
          profile.role === 'admin'
        )

        // Check if enterprise admin in enterprise_orgs or profile
        const isEntAdminConfig = APP_CONFIG.enterpriseAdminEmails.map(e => e.toLowerCase()).includes(emailClean)
        const orgAsAdmin = await db.collection('enterprise_orgs').findOne({
          $or: [
            { admin_email: exactMatchCI(emailClean) },
            { admin_user_id: profile.user_id }
          ]
        })
        const isEntAdmin = isEntAdminConfig || Boolean(orgAsAdmin) || profile.enterprise_role === 'admin'

        let assignedRole = 'user'
        if (isSuperAdmin) {
          assignedRole = 'admin'
        } else if (isEntAdmin) {
          assignedRole = 'enterprise_admin'
        }

        const rawPlan = (profile.plan || 'trial').toLowerCase()
        const now = new Date()
        let activePlan = 'trial'
        let planName = 'JobFlux 3-Day Free Access'
        let isPlanActive = true

        if (rawPlan === 'org_pro') {
          // Paid org-member upgrade: recognized while active; falls back to
          // free org base on expiry (members never drop to 'none' while in org)
          const orgProExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
          if (orgProExpires && orgProExpires > now) {
            activePlan = 'org_pro'
            planName = 'JobFlux Org Pro'
            isPlanActive = true
          } else if (profile.enterprise_role === 'member') {
            activePlan = 'enterprise'
            planName = 'JobFlux Enterprise Member'
            isPlanActive = true
          } else {
            activePlan = 'none'
            planName = 'Plan Expired (No Active Plan)'
            isPlanActive = false
          }
        } else if (profile.enterprise_role === 'member' || rawPlan === 'enterprise') {
          activePlan = 'enterprise'
          planName = 'JobFlux Enterprise Member'
          isPlanActive = true
        } else if (rawPlan === 'none' || rawPlan === 'no_plan') {
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

        // Determine org ID
        const enterpriseOrgId = profile.enterprise_org_id || orgAsAdmin?.org_id || (isEntAdmin ? 'org_technohmsit' : null)

        // Log candidate/admin login event
        const loginDevice = await recordLoginDevice(db, { deviceId: rawDeviceId, ip, userAgent, userId: profile.user_id, email: profile.email })
        await logUserActivity(db, {
          userId: profile.user_id,
          email: profile.email,
          eventType: 'login',
          description: assignedRole === 'admin' 
            ? `Administrator signed in (${profile.user_id})` 
            : assignedRole === 'enterprise_admin'
              ? `Enterprise Administrator signed in (${profile.email})`
              : `Candidate signed in successfully (Method: Password)`,
          ipAddress: ip,
          userAgent: userAgent,
          metadata: {
            method: 'password',
            role: assignedRole,
            plan: activePlan,
            enterprise_org_id: enterpriseOrgId,
            device_id: loginDevice.deviceId,
            device_label: loginDevice.label,
            device_trusted: loginDevice.trusted
          }
        })

        return issueSession(
          NextResponse.json({
            status: 'success',
            role: assignedRole,
            user_id: profile.user_id,
            email: profile.email,
            name: profile.name || profile.user_id.replace('_', ' '),
            plan: activePlan,
            plan_name: planName,
            is_plan_active: isPlanActive,
            enterprise_org_id: enterpriseOrgId,
            enterprise_role: isEntAdmin ? 'admin' : (profile.enterprise_role || null),
            enterprise_status: profile.enterprise_status || 'active',
            plan_expires_at: profile.plan_expires_at || null,
            trial_expires_at: profile.trial_expires_at || null
          }),
          {
            uid: profile.user_id,
            email: profile.email,
            role: assignedRole as 'admin' | 'enterprise_admin' | 'user',
            orgId: enterpriseOrgId,
            entRole: isEntAdmin ? 'admin' : (profile.enterprise_role || null),
            v: Number(profile.session_v || 0)
          }
        )
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
