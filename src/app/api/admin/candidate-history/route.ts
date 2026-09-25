import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/candidate-history?user_id= — full dossier for Inspect modal:
 * account timeline, payment history, org journey (invites), run history,
 * recent activity. One call, lean projections.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const userId = (req.nextUrl.searchParams.get('user_id') || '').trim()
    if (!userId) return NextResponse.json({ detail: 'user_id is required.' }, { status: 400 })

    const profile = await db.collection('profiles').findOne(
      { user_id: userId },
      { projection: { picture: 0 } }
    ) || await db.collection('users').findOne(
      { user_id: userId },
      { projection: { picture: 0 } }
    )
    if (!profile) return NextResponse.json({ detail: 'Candidate not found.' }, { status: 404 })

    const email = (profile.email || '').toLowerCase()

    const [payments, runs, invites, activity, stats] = await Promise.all([
      db.collection('payments').find(
        { $or: [{ user_id: userId }, ...(email ? [{ email }] : [])] },
        { projection: { plan_id: 1, amount: 1, status: 1, verified_at: 1, created_at: 1, expires_at: 1, order_id: 1, payment_id: 1 } }
      ).sort({ verified_at: -1, created_at: -1 }).limit(20).toArray(),
      db.collection('tasks').find(
        { user_id: userId },
        { projection: { task_id: 1, source: 1, status: 1, created_at: 1, started_at: 1, completed_at: 1, stats: 1, summary: 1 } }
      ).sort({ created_at: -1 }).limit(15).toArray(),
      email ? db.collection('enterprise_invites').find(
        { invited_email: email },
        { projection: { org_id: 1, org_name: 1, invited_email: 1, invited_by: 1, status: 1, created_at: 1, responded_at: 1 } }
      ).sort({ created_at: -1 }).limit(10).toArray() : [],
      db.collection('user_activity_logs').find(
        { $or: [{ user_id: userId }, { userId }, ...(email ? [{ email }] : [])] },
        { projection: { event_type: 1, description: 1, ip_address: 1, created_at: 1 } }
      ).sort({ created_at: -1 }).limit(20).toArray(),
      db.collection('user_stats').findOne({ user_id: userId })
    ])

    const orgDoc = profile.enterprise_org_id
      ? await db.collection('enterprise_orgs').findOne(
          { org_id: profile.enterprise_org_id },
          { projection: { org_id: 1, name: 1, status: 1 } }
        )
      : null

    // Login aggregates (local calendar boundaries) for the dossier stats row
    const now = new Date()
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(dayStart.getTime() - 6 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), 1)
    const loginMatch: any = {
      event_type: 'login',
      $or: [{ user_id: userId }, { userId }, ...(email ? [{ email }] : [])]
    }
    // On-demand sweep quota (mirrors enterprise on-demand rate limits).
    // Super-admin triggers (admin_on_demand / manual_cli) NEVER count toward
    // the user's quota — only user + org-admin triggers do.
    const USER_ON_DEMAND_SOURCES = ['enterprise_admin_on_demand', 'web_dashboard_on_demand']
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffsetMs)
    const todayIstStr = istNow.toISOString().slice(0, 10)
    const todayStartIst = new Date(new Date(todayIstStr + 'T00:00:00+05:30').getTime())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const rawPlan = (profile.plan || '').toLowerCase()
    const isVipQ = Boolean(profile.is_vip || profile.vip_access || profile.free_privilege)
    const isOrgQ = profile.enterprise_role === 'member' || Boolean(profile.enterprise_org_id) || ['enterprise', 'org_starter', 'org_pro', 'org_pro_3m'].includes(rawPlan)
    const weeklySweepLimit = !isOrgQ ? 5 : (isVipQ || ['org_pro', 'org_pro_3m', 'pro'].includes(rawPlan) ? 15 : 10)
    const [loginsToday, loginsWeek, loginsMonth, sweepsToday, sweepsWeek] = await Promise.all([
      db.collection('user_activity_logs').countDocuments({ ...loginMatch, created_at: { $gte: dayStart } }),
      db.collection('user_activity_logs').countDocuments({ ...loginMatch, created_at: { $gte: weekStart } }),
      db.collection('user_activity_logs').countDocuments({ ...loginMatch, created_at: { $gte: monthStart } }),
      db.collection('tasks').countDocuments({ user_id: userId, source: { $in: USER_ON_DEMAND_SOURCES }, created_at: { $gte: todayStartIst } }),
      db.collection('tasks').countDocuments({ user_id: userId, source: { $in: USER_ON_DEMAND_SOURCES }, created_at: { $gte: weekAgo } })
    ])

    return NextResponse.json({
      status: 'success',
      timeline: {
        joined_at: profile.created_at || null,
        trial_started_at: profile.trial_started_at || null,
        trial_expires_at: profile.trial_expires_at || null,
        plan_activated_at: profile.plan_activated_at || null,
        plan: profile.plan || null,
        plan_name: profile.plan_name || null,
        plan_expires_at: profile.plan_expires_at || null,
        last_login_at: profile.last_login_at || null,
        login_count: profile.login_count || 0,
        last_profile_updated_at: profile.last_profile_updated_at || profile.updated_at || null,
        profile_update_count: profile.profile_update_count || 0,
        last_resume_updated_at: profile.last_resume_updated_at || null,
        resume_upload_count: profile.resume_upload_count || 0,
        on_demand_run_count: profile.on_demand_run_count || 0,
        enabled_for_daily_run: profile.enabled_for_daily_run !== false
      },
      org: {
        org_id: profile.enterprise_org_id || null,
        org_name: orgDoc?.name || null,
        org_status: orgDoc?.status || null,
        enterprise_role: profile.enterprise_role || null,
        enterprise_status: profile.enterprise_status || null
      },
      payments: payments.map((p: any) => ({
        plan_id: p.plan_id || null,
        amount: p.amount || null,
        status: p.status || null,
        verified_at: p.verified_at || p.created_at || null,
        expires_at: p.expires_at || null,
        order_id: p.order_id || null,
        payment_id: p.payment_id || null
      })),
      invites: invites.map((i: any) => ({
        org_id: i.org_id || null,
        org_name: i.org_name || null,
        invited_by: i.invited_by || null,
        status: i.status || null,
        invited_at: i.created_at || null,
        responded_at: i.responded_at || null
      })),
      runs: runs.map((t: any) => ({
        task_id: t.task_id || null,
        source: t.source || null,
        status: t.status || null,
        created_at: t.created_at || null,
        completed_at: t.completed_at || null,
        applied: t.stats?.applied ?? t.stats?.today ?? null,
        total: t.stats?.total_applied ?? null,
        summary: t.summary || null
      })),
      activity: activity.map((a: any) => ({
        event_type: a.event_type || null,
        description: a.description || null,
        ip_address: a.ip_address || null,
        created_at: a.created_at || null
      })),
      stats: stats ? {
        today: stats.today || 0,
        this_week: stats.this_week || 0,
        this_month: stats.this_month || 0,
        total_applied: stats.total_applied || 0
      } : null,
      logins: {
        today: loginsToday,
        week: loginsWeek,
        month: loginsMonth,
        total: profile.login_count || 0
      },
      sweeps: {
        used_today: sweepsToday,
        daily_limit: 3,
        remaining_today: Math.max(0, 3 - sweepsToday),
        used_week: sweepsWeek,
        weekly_limit: weeklySweepLimit,
        remaining_week: Math.max(0, weeklySweepLimit - sweepsWeek),
        lifetime: profile.on_demand_run_count || 0
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to load history.' }, { status: 500 })
  }
}
