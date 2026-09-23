import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'

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

    const memberList = members.map(m => {
      const s = statsMap.get(m.user_id) || {}
      const userTasks = recentTasks.filter(t => t.user_id === m.user_id)
      const onDemandUsed = userTasks.filter(t => t.source === 'web_dashboard_on_demand' || t.source === 'enterprise_admin_on_demand').length

      const now = new Date()
      const istOffsetMs = 5.5 * 60 * 60 * 1000
      const istNow = new Date(now.getTime() + istOffsetMs)
      const todayIstStr = istNow.toISOString().slice(0, 10)
      const todayCount = s.last_date === todayIstStr ? (s.today || 0) : 0

      // Resolve effective current plan: active Org Pro purchase wins,
      // otherwise the free org-provided Enterprise base (always active for members)
      const rawPlan = (m.plan || 'enterprise').toLowerCase()
      let effPlan = 'enterprise'
      let effPlanName = 'JobFlux Enterprise Member'
      let effExpiresAt: any = null
      if (rawPlan === 'org_pro') {
        const exp = m.plan_expires_at ? new Date(m.plan_expires_at) : null
        if (exp && exp > now) {
          effPlan = 'org_pro'
          effPlanName = 'JobFlux Org Pro'
          effExpiresAt = m.plan_expires_at
        }
      }

      const activeDoc = activeTasks.find(t => t.user_id === m.user_id) || null
      const activeTask = activeDoc ? {
        task_id: activeDoc.task_id,
        status: activeDoc.status,
        queue_position: activeDoc.status === 'running' ? 0 : (pendingIndex.get(activeDoc.task_id) || null)
      } : null

      // Sweep eligibility: will this member actually be queued at sweep time?
      // Mirrors backend plan rules: org base + active Org Pro + active paid/trial/VIP.
      const blockers: string[] = []
      if (orgDisabled) blockers.push('Org disabled by Super Admin')
      if (m.enabled_for_daily_run === false) blockers.push('Daily run paused')
      if ((m.enterprise_status || 'active') === 'disabled') blockers.push('Member disabled')
      if (!m.password || !String(m.password).trim()) blockers.push('Naukri password missing')
      const mPlan = (m.plan || 'enterprise').toLowerCase()
      const nowMs = Date.now()
      const expOk = (d: any) => {
        if (!d) return false
        const t = new Date(d).getTime()
        return !isNaN(t) && t > nowMs
      }
      const planOk =
        mPlan === 'enterprise' ||
        mPlan === 'org_pro' || // paid upgrade; expired falls back to org base cover
        Boolean(m.is_vip || m.vip_access || m.free_privilege) ||
        (['starter', 'pro', 'elite', 'professional', 'paid'].includes(mPlan) && expOk(m.plan_expires_at)) ||
        (mPlan === 'trial' && (!m.trial_expires_at || expOk(m.trial_expires_at))) ||
        mPlan === 'vip'
      if (!planOk) blockers.push(`No active plan (${mPlan})`)

      return {
        user_id: m.user_id,
        email: m.email,
        name: m.name || m.user_id,
        role: m.role,
        enterprise_role: m.enterprise_role || (m.email === 'koushiksrmedala@gmail.com' ? 'admin' : 'member'),
        enterprise_status: m.enterprise_status || 'active',
        enabled_for_daily_run: m.enabled_for_daily_run !== false,
        plan: effPlan,
        plan_name: effPlanName,
        plan_active: true,
        plan_expires_at: effExpiresAt,
        applied_today: todayCount,
        applied_this_week: s.this_week || 0,
        applied_this_month: s.this_month || 0,
        total_applied: s.total_applied || 0,
        on_demand_runs_used: onDemandUsed,
        on_demand_quota: effPlan === 'org_pro' ? 15 : 10,
        sweep_eligible: blockers.length === 0,
        sweep_blockers: blockers,
        active_task: activeTask,
        daily_application_limit: 55,
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
    const targetUserId = (body.user_id || '').trim()
    const targetEmail = (body.email || '').trim().toLowerCase()
    const enabled = Boolean(body.enabled)

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ detail: 'user_id or email is required' }, { status: 400 })
    }

    const query: any = targetUserId ? { user_id: targetUserId } : { email: targetEmail }

    const updateFields = {
      enabled_for_daily_run: enabled,
      enterprise_status: enabled ? 'active' : 'disabled',
      updated_at: new Date()
    }

    await db.collection('profiles').updateOne(query, { $set: updateFields })
    await db.collection('users').updateOne(query, { $set: updateFields })

    return NextResponse.json({
      status: 'success',
      message: `Member ${enabled ? 'enabled' : 'disabled'} successfully. ${enabled ? 'Automated sweeps will include this member.' : 'Future automated runs will skip this member.'}`,
      user_id: targetUserId,
      enabled_for_daily_run: enabled,
      enterprise_status: enabled ? 'active' : 'disabled'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error updating member status' }, { status: 500 })
  }
}
