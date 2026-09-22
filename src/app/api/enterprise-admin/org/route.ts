import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

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

    // Fetch org record or build fallback
    let org = await db.collection('enterprise_orgs').findOne({ org_id: orgId })
    if (!org) {
      // Auto-create default record if not yet inserted
      const now = new Date()
      org = {
        org_id: orgId,
        name: 'Technohm SIT Org',
        admin_email: 'koushiksrmedala@gmail.com',
        admin_user_id: 'koushiksrmedala',
        admin_name: 'Koushik S.R. Medala',
        created_by: 'technohmsit@gmail.com',
        daily_limit_per_user: 55,
        weekly_on_demand_quota: 10,
        status: 'active',
        created_at: now,
        updated_at: now
      }
      await db.collection('enterprise_orgs').insertOne(org)
    }

    // Query members in this org
    const members = await db.collection('profiles').find({
      $or: [
        { enterprise_org_id: orgId },
        { email: 'technohmsit@gmail.com' } // Included by default in Technohm SIT
      ]
    }).toArray()

    const memberUserIds = members.map(m => m.user_id).filter(Boolean)

    // Aggregate stats for org members
    const statsList = await db.collection('user_stats').find({
      user_id: { $in: memberUserIds }
    }).toArray()

    let appliedToday = 0
    let appliedThisWeek = 0
    let appliedThisMonth = 0
    let totalApplied = 0

    statsList.forEach(s => {
      appliedToday += (s.today || 0)
      appliedThisWeek += (s.this_week || 0)
      appliedThisMonth += (s.this_month || 0)
      totalApplied += (s.total_applied || 0)
    })

    // Count on-demand runs used in the last 7 days by org members
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const onDemandRunsUsed = await db.collection('tasks').countDocuments({
      user_id: { $in: memberUserIds },
      source: 'web_dashboard_on_demand',
      created_at: { $gte: sevenDaysAgo }
    })

    // Active scheduled count
    const activeScheduledCount = members.filter(m => m.enabled_for_daily_run !== false && m.enterprise_status !== 'disabled').length

    return NextResponse.json({
      status: 'success',
      org: {
        org_id: org.org_id,
        name: org.name,
        admin_email: org.admin_email,
        admin_name: org.admin_name,
        status: org.status || 'active',
        daily_limit_per_user: org.daily_limit_per_user || 55,
        weekly_on_demand_quota: org.weekly_on_demand_quota || 10,
        created_at: org.created_at
      },
      metrics: {
        total_members: members.length,
        active_scheduled_members: activeScheduledCount,
        applied_today: appliedToday,
        applied_this_week: appliedThisWeek,
        applied_this_month: appliedThisMonth,
        total_applied: totalApplied,
        on_demand_runs_used_this_week: onDemandRunsUsed,
        weekly_quota_per_member: org.weekly_on_demand_quota || 10
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error fetching org' }, { status: 500 })
  }
}
