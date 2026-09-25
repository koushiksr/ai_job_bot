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

    let orgId = req.headers.get('x-org-id') || req.nextUrl.searchParams.get('org_id') || auth.orgId || 'org_technohmsit'

    // Fetch org record or build fallback
    let org = await db.collection('enterprise_orgs').findOne({ org_id: orgId })
    if (!org) {
      const adminEmailParam = req.headers.get('x-admin-email') || req.nextUrl.searchParams.get('admin_email')
      if (adminEmailParam) {
        org = await db.collection('enterprise_orgs').findOne({ admin_email: exactMatchCI(adminEmailParam) })
        if (org?.org_id) orgId = org.org_id
      }
    }
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
        daily_sweep_time: '06:00',
        status: 'active',
        created_at: now,
        updated_at: now
      }
      await db.collection('enterprise_orgs').insertOne(org)
    }

    // Query members in this org (only real members, NOT super admin)
    const members = await db.collection('profiles').find({
      enterprise_org_id: orgId,
      enterprise_role: { $ne: 'super_admin' },  // exclude super admin
      is_org_admin_only: { $ne: true }           // exclude org admin (koushiksrmedala has no candidate profile)
    }).toArray()

    const memberUserIds = members.map(m => m.user_id).filter(Boolean)

    // Aggregate stats for org members
    const statsList = await db.collection('user_stats').find({
      user_id: { $in: memberUserIds }
    }).toArray()

    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const nowIst = new Date(Date.now() + istOffsetMs)
    const todayIstStr = nowIst.toISOString().slice(0, 10)
    const sevenDaysAgoDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysAgoIst = new Date(sevenDaysAgoDate.getTime() + istOffsetMs).toISOString().slice(0, 10)
    const monthStartIst = `${todayIstStr.slice(0, 7)}-01`

    // Aggregate real job records from applied_jobs collection
    const jobStats = await db.collection('applied_jobs').aggregate([
      {
        $match: {
          user_id: { $in: memberUserIds },
          status: { $in: ['applied', 'success'] }
        }
      },
      {
        $group: {
          _id: null,
          total_applied: { $sum: 1 },
          applied_today: {
            $sum: {
              $cond: [{ $eq: ['$applied_date', todayIstStr] }, 1, 0]
            }
          },
          applied_this_week: {
            $sum: {
              $cond: [{ $gte: ['$applied_date', sevenDaysAgoIst] }, 1, 0]
            }
          },
          applied_this_month: {
            $sum: {
              $cond: [{ $gte: ['$applied_date', monthStartIst] }, 1, 0]
            }
          }
        }
      }
    ]).toArray()

    const realJobAgg = jobStats[0] || {
      total_applied: 0,
      applied_today: 0,
      applied_this_week: 0,
      applied_this_month: 0
    }

    let statsToday = 0
    let statsTotal = 0
    statsList.forEach(s => {
      if (s.last_date === todayIstStr) {
        statsToday += (s.today || 0)
      }
      statsTotal += (s.total_applied || 0)
    })

    // Mathematical invariant: total_applied >= applied_this_month >= applied_this_week >= applied_today
    const appliedToday = Math.max(realJobAgg.applied_today, statsToday)
    const totalApplied = Math.max(realJobAgg.total_applied, statsTotal, appliedToday)
    const appliedThisWeek = Math.min(totalApplied, Math.max(realJobAgg.applied_this_week, appliedToday))
    const appliedThisMonth = Math.min(totalApplied, Math.max(realJobAgg.applied_this_month, appliedThisWeek))

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
        name: org.name || org.display_name || 'My Organisation',
        admin_email: org.admin_email,
        admin_name: org.admin_name,
        status: org.status || 'active',
        daily_limit_per_user: org.daily_limit_per_user || 55,
        weekly_on_demand_quota: org.weekly_on_demand_quota || 10,
        daily_sweep_time: org.daily_sweep_time || '06:00',
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

// PATCH: Update org settings — name and/or daily sweep time (org admin)
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
    const newName = (body.name || '').trim()
    const sweepTime = (body.daily_sweep_time || '').trim()

    const updates: any = {}
    if (newName) {
      if (newName.length < 2) {
        return NextResponse.json({ detail: 'Organisation name must be at least 2 characters.' }, { status: 400 })
      }
      if (newName.length > 80) {
        return NextResponse.json({ detail: 'Organisation name must be 80 characters or fewer.' }, { status: 400 })
      }
      updates.name = newName
      updates.display_name = newName
    }
    if (sweepTime) {
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(sweepTime)) {
        return NextResponse.json({ detail: 'Daily sweep time must be HH:MM in 24-hour IST (e.g. 09:00).' }, { status: 400 })
      }
      updates.daily_sweep_time = sweepTime
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ detail: 'Nothing to update. Provide name and/or daily_sweep_time.' }, { status: 400 })
    }

    const orgId = body.org_id || req.headers.get('x-org-id') || auth.orgId || 'org_technohmsit'
    updates.updated_at = new Date()

    await db.collection('enterprise_orgs').updateOne(
      { org_id: orgId },
      { $set: updates }
    )

    let resetCount = 0
    if (updates.daily_sweep_time) {
      // New sweep time = fresh run for everyone today: clear today's
      // executed markers so all members queue at the new time.
      const r1 = await db.collection('profiles').updateMany(
        { enterprise_org_id: orgId },
        { $unset: { last_automated_run_date: '', daily_status: '' } }
      )
      await db.collection('users').updateMany(
        { enterprise_org_id: orgId },
        { $unset: { last_automated_run_date: '', daily_status: '' } }
      )
      resetCount = r1.modifiedCount || 0
    }

    const parts: string[] = []
    if (updates.name) parts.push(`renamed to "${updates.name}"`)
    if (updates.daily_sweep_time) parts.push(`daily sweep set to ${updates.daily_sweep_time} IST — ${resetCount} member(s) reset to not-run-today and will queue at the new time`)
    return NextResponse.json({
      status: 'success',
      message: `Organisation updated: ${parts.join('; ')}.`,
      name: updates.name,
      daily_sweep_time: updates.daily_sweep_time,
      members_reset: resetCount
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error updating org name' }, { status: 500 })
  }
}
