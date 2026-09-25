import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * GET: List all members of the enterprise organization with stats and run status.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Enterprise Admin privileges required.' }, { status: 403 })
    }

    let orgId = req.headers.get('x-org-id') || req.nextUrl.searchParams.get('org_id') || auth.orgId || 'org_technohmsit'
    let orgDoc = await db.collection('enterprise_orgs').findOne({ org_id: orgId })
    if (!orgDoc) {
      const adminEmailParam = req.headers.get('x-admin-email') || req.nextUrl.searchParams.get('admin_email')
      if (adminEmailParam) {
        orgDoc = await db.collection('enterprise_orgs').findOne({ admin_email: exactMatchCI(adminEmailParam) })
        if (orgDoc?.org_id) orgId = orgDoc.org_id
      }
    }
    const orgDisabled = (orgDoc?.status || 'active') === 'disabled'

    // Fetch org members (exclude super admin and org admin - only real job seekers)
    const members = await db.collection('profiles').find({
      enterprise_org_id: orgId,
      is_org_admin_only: { $ne: true },          // exclude org admin (koushiksrmedala manages, doesn't apply)
      enterprise_role: { $nin: ['admin', 'super_admin'] }  // only actual member role
    }).toArray()

    const memberIds = members.map(m => m.user_id).filter(Boolean)

    // Fetch corresponding user stats
    const statsDocs = await db.collection('user_stats').find({
      user_id: { $in: memberIds }
    }).toArray()
    const statsMap = new Map(statsDocs.map(s => [s.user_id, s]))

    // Count on-demand runs in the last 7 days per member
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentTasks = await db.collection('tasks').find({
      user_id: { $in: memberIds },
      created_at: { $gte: sevenDaysAgo }
    }).toArray()

    // Active (pending/running) tasks per member + global queue positions.
    // Queue is strictly FIFO: position = pending tasks created before it + 1.
    const activeTasks = await db.collection('tasks').find({
      user_id: { $in: memberIds },
      status: { $in: ['pending', 'running'] }
    }).sort({ created_at: 1 }).toArray()
    const allPending = await db.collection('tasks').find(
      { status: 'pending' },
      { projection: { task_id: 1, created_at: 1 } }
    ).sort({ created_at: 1 }).toArray()
    const pendingIndex = new Map(allPending.map((t, i) => [t.task_id, i + 1]))

    // Pool-exhaustion flags for today (worker-set after 2 fruitless runs)
    let poolStateByUser: Record<string, string> = {}
    try {
      const poolDocs = await db.collection('dispatch_state').find(
        {},
        { projection: { user_id: 1, date_ist: 1, pool_state: 1 } }
      ).toArray()
      const nowIstStr = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10)
      for (const d of poolDocs) {
        if (d.date_ist === nowIstStr && d.user_id && d.pool_state) {
          poolStateByUser[d.user_id] = d.pool_state
        }
      }
    } catch {}

    const memberList = members.map(m => {
      const s = statsMap.get(m.user_id) || {}
      const userTasks = recentTasks.filter(t => t.user_id === m.user_id)
      const onDemandUsed = userTasks.filter(t => t.source === 'web_dashboard_on_demand' || t.source === 'enterprise_admin_on_demand').length

      const now = new Date()
      const istOffsetMs = 5.5 * 60 * 60 * 1000
      const istNow = new Date(now.getTime() + istOffsetMs)
      const todayIstStr = istNow.toISOString().slice(0, 10)
      const todayCount = s.last_date === todayIstStr ? (s.today || 0) : 0

      // Resolve effective current plan:
      // If an organization candidate has NOT paid anything, they cannot apply even one job.
      // Must hold an active Org Starter (₹79), Org Pro (₹99 / ₹289), or VIP access.
      const rawPlan = (m.plan || 'none').toLowerCase()
      const isPaidOrgPro = (rawPlan === 'org_pro' || rawPlan === 'org_pro_3m' || rawPlan === 'pro')
      const isPaidOrgStarter = (rawPlan === 'org_starter' || rawPlan === 'starter')
      const exp = m.plan_expires_at ? new Date(m.plan_expires_at) : null
      const isExpired = exp ? exp <= now : false
      const isPlanValid = exp ? exp > now : false
      const isVipUser = Boolean(m.is_vip || m.vip_access || m.free_privilege || m.granted_by_super_admin)

      let effPlan = 'none'
      let effPlanName = 'No Plan'
      let effExpiresAt: any = null
      let isPlanActive = false

      if (isExpired) {
        effPlan = 'none'
        effPlanName = 'Plan Expired'
        effExpiresAt = m.plan_expires_at
        isPlanActive = false
      } else if (isVipUser && (isPlanValid || !exp)) {
        effPlan = isPaidOrgStarter ? 'org_starter' : (rawPlan === 'org_pro_3m' ? 'org_pro_3m' : 'org_pro')
        effPlanName = isPaidOrgStarter
          ? 'Org Starter (Privilege)'
          : rawPlan === 'org_pro_3m'
          ? 'Org Pro · 3M (Privilege)'
          : 'Org Pro (Privilege)'
        effExpiresAt = m.plan_expires_at
        isPlanActive = true
      } else if (isPaidOrgPro && isPlanValid) {
        effPlan = rawPlan === 'org_pro_3m' ? 'org_pro_3m' : 'org_pro'
        effPlanName = rawPlan === 'org_pro_3m' ? 'Org Pro · 3 Months' : 'Org Pro'
        effExpiresAt = m.plan_expires_at
        isPlanActive = true
      } else if (isPaidOrgStarter && isPlanValid) {
        effPlan = 'org_starter'
        effPlanName = 'Org Starter'
        effExpiresAt = m.plan_expires_at
        isPlanActive = true
      } else if (rawPlan === 'enterprise' && isPlanValid) {
        // Org base (covered by the organization) — active with base quotas.
        effPlan = 'enterprise'
        effPlanName = 'Enterprise Base'
        effExpiresAt = m.plan_expires_at
        isPlanActive = true
      }

      const activeDoc = activeTasks.find(t => t.user_id === m.user_id) || null
      const activeTask = activeDoc ? {
        task_id: activeDoc.task_id,
        status: activeDoc.status,
        queue_position: activeDoc.status === 'running' ? 0 : (pendingIndex.get(activeDoc.task_id) || null)
      } : null

      // Sweep eligibility: member must have active paid subscription to be queued
      const blockers: string[] = []
      if (orgDisabled) blockers.push('Org disabled by Super Admin')
      if (m.enabled_for_daily_run === false) blockers.push('Daily run paused')
      if ((m.enterprise_status || 'active') === 'disabled') blockers.push('Member disabled')
      if (!m.password || !String(m.password).trim()) blockers.push('Naukri password missing')
      if (!isPlanActive) blockers.push('No active plan')

      const dailyLimit = !isPlanActive ? 0 : (effPlan.startsWith('org_pro') || effPlan === 'enterprise' ? 55 : 20)
      const onDemandQuota = !isPlanActive ? 0 : (effPlan.startsWith('org_pro') ? 15 : effPlan === 'enterprise' ? 10 : 0)

      return {
        user_id: m.user_id || m.email || '',
        email: m.email || m.user_id || '',
        name: m.name || m.user_id || m.email,
        role: m.role,
        enterprise_role: m.enterprise_role || (m.email === 'koushiksrmedala@gmail.com' ? 'admin' : 'member'),
        enterprise_status: m.enterprise_status || 'active',
        enabled_for_daily_run: m.enabled_for_daily_run !== false && isPlanActive,
        plan: effPlan,
        plan_name: effPlanName,
        plan_active: isPlanActive,
        plan_expires_at: effExpiresAt,
        applied_today: todayCount,
        applied_this_week: Math.min(Math.max(s.total_applied || 0, todayCount), Math.max(s.this_week || 0, todayCount)),
        applied_this_month: Math.min(Math.max(s.total_applied || 0, todayCount), Math.max(s.this_month || 0, todayCount)),
        total_applied: Math.max(s.total_applied || 0, s.this_week || 0, todayCount),
        on_demand_runs_used: onDemandUsed,
        on_demand_quota: onDemandQuota,
        sweep_eligible: blockers.length === 0,
        sweep_blockers: blockers,
        active_task: activeTask,
        daily_application_limit: dailyLimit,
        match_status: poolStateByUser[m.user_id] || 'matching',
        last_applied_at: s.last_applied_at || null,
        created_at: m.created_at || null
      }
    })

    return NextResponse.json({
      status: 'success',
      org_id: orgId,
      total_count: memberList.length,
      members: memberList
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error loading members' }, { status: 500 })
  }
}

/**
 * PATCH: Enable or Disable a user from running in automated sweeps.
 * Body: { user_id: string, enabled: boolean }
 */
export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Enterprise Admin privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    // Plan assignment is a super-admin-only override. Org admins may pause /
    // resume and pay via Razorpay, but never grant plans for free.
    if (body.plan_id && !auth.isSuperAdmin) {
      return NextResponse.json({ detail: 'Only Super Admin can assign plans directly. Please pay via Razorpay.' }, { status: 403 })
    }
    const targetUserId = (body.user_id || body.target_user_id || '').trim()
    const targetEmail = (body.email || body.target_email || '').trim().toLowerCase()
    const enabled = Boolean(body.enabled)

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ detail: 'user_id or email is required' }, { status: 400 })
    }

    const orClauses: any[] = []
    if (targetUserId) {
      orClauses.push({ user_id: targetUserId })
    }
    if (targetEmail) {
      orClauses.push({ email: exactMatchCI(targetEmail) })
      orClauses.push({ user_id: targetEmail })
    }
    const query: any = orClauses.length === 1 ? orClauses[0] : { $or: orClauses }

    const updateFields: any = {
      updated_at: new Date()
    }

    if (body.enabled !== undefined) {
      updateFields.enabled_for_daily_run = Boolean(body.enabled)
      updateFields.enterprise_status = Boolean(body.enabled) ? 'active' : 'disabled'
    }

    if (body.plan_id) {
      const planId = body.plan_id
      const days = planId === 'org_pro_3m' ? 90 : 30
      const now = new Date()
      if (planId === 'none' || planId === 'unpaid') {
        updateFields.plan = 'none'
        updateFields.plan_name = 'No Plan'
        updateFields.plan_expires_at = null
        updateFields.daily_application_limit = 0
        updateFields.enabled_for_daily_run = false
        updateFields.is_vip = false
        updateFields.vip_access = false
        updateFields.free_privilege = false
        updateFields.granted_by_super_admin = false
      } else {
        const isPro = planId.startsWith('org_pro')
        const planLabel = planId === 'org_starter'
          ? 'Org Starter (Privilege)'
          : planId === 'org_pro_3m'
          ? 'Org Pro · 3M (Privilege)'
          : 'Org Pro (Privilege)'

        updateFields.plan = planId
        updateFields.plan_name = planLabel
        updateFields.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        updateFields.plan_activated_at = now
        updateFields.daily_application_limit = isPro ? 55 : 20
        updateFields.enabled_for_daily_run = true
        updateFields.enterprise_role = 'member'
        updateFields.granted_by_super_admin = true
        updateFields.free_privilege = true
        updateFields.is_vip = true
        updateFields.vip_access = true
      }
    }

    await db.collection('profiles').updateMany(query, { $set: updateFields })
    await db.collection('users').updateMany(query, { $set: updateFields })

    return NextResponse.json({
      status: 'success',
      message: body.plan_id
        ? `Plan updated to ${updateFields.plan_name || body.plan_id} successfully.`
        : `Member ${body.enabled ? 'enabled' : 'disabled'} successfully.`,
      user_id: targetUserId || targetEmail,
      ...updateFields
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error updating member status' }, { status: 500 })
  }
}
