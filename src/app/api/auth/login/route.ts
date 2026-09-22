import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'
import { APP_CONFIG } from '@/config/appConfig'
import { syncUserPaymentPlan } from '@/lib/paymentSync'
import { issueSession } from '@/lib/session'

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf-8').digest('hex')
}

function secretsEqual(a: string, b: string): boolean {
  const ha = Buffer.from(sha256Hex(a))
  const hb = Buffer.from(sha256Hex(b))
  return ha.length === hb.length && timingSafeEqual(ha, hb)
}

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

    // 1. Super-admin login via environment credentials (no hardcoded bypass).
    // Works even when the DB is unreachable (break-glass).
    const superEmail = (process.env.SUPER_ADMIN_EMAIL || 'technohmsit@gmail.com').toLowerCase().trim()
    const superPass = process.env.SUPER_ADMIN_PASSWORD || ''
    if (
      emailClean && pwdClean && superPass &&
      (emailClean === superEmail || emailClean === 'technohmsit' || emailClean === 'admin') &&
      secretsEqual(pwdClean, superPass)
    ) {
      const adminUid = 'technohmsit'
      const adminMail = superEmail.includes('@') ? superEmail : 'technohmsit@gmail.com'

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

      // Carry the live session version so post-logout replays stay dead
      let adminV = 0
      try {
        const rec = db ? await db.collection('profiles').findOne({ user_id: adminUid }) : null
        adminV = Number(rec?.session_v || 0)
      } catch { /* break-glass: stay at 0 */ }

      return issueSession(
        NextResponse.json({
          status: 'success',
          role: 'admin',
          user_id: adminUid,
          email: adminMail,
          name: 'Technohm SIT Administrator'
        }),
        { uid: adminUid, email: adminMail, role: 'admin', v: adminV }
      )
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
            { admin_email: { $regex: `^${emailClean}$`, $options: 'i' } },
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
            enterprise_org_id: enterpriseOrgId
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
