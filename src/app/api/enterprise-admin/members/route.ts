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

    const orgId = auth.orgId || 'org_technohmsit'

    // Fetch org members
    const members = await db.collection('profiles').find({
      $or: [
        { enterprise_org_id: orgId },
        { email: 'technohmsit@gmail.com' }
      ]
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

    const memberList = members.map(m => {
      const s = statsMap.get(m.user_id) || {}
      const userTasks = recentTasks.filter(t => t.user_id === m.user_id)
      const onDemandUsed = userTasks.filter(t => t.source === 'web_dashboard_on_demand').length

      const now = new Date()
      const istOffsetMs = 5.5 * 60 * 60 * 1000
      const istNow = new Date(now.getTime() + istOffsetMs)
      const todayIstStr = istNow.toISOString().slice(0, 10)
      const todayCount = s.last_date === todayIstStr ? (s.today || 0) : 0

      return {
        user_id: m.user_id,
        email: m.email,
        name: m.name || m.user_id,
        role: m.role,
        enterprise_role: m.enterprise_role || (m.email === 'koushiksrmedala@gmail.com' ? 'admin' : 'member'),
        enterprise_status: m.enterprise_status || 'active',
        enabled_for_daily_run: m.enabled_for_daily_run !== false,
        plan: m.plan || 'enterprise',
        plan_name: m.plan_name || 'JobFlux Enterprise Member',
        applied_today: todayCount,
        applied_this_week: s.this_week || 0,
        applied_this_month: s.this_month || 0,
        total_applied: s.total_applied || 0,
        on_demand_runs_used: onDemandUsed,
        on_demand_quota: 10,
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
