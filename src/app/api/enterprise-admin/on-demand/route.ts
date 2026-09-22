import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * POST: Enterprise Admin dispatches an on-demand application sweep for a member
 * Body: { user_id: string }
 */
export async function POST(req: NextRequest) {
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

    if (!targetUserId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    // Verify target candidate belongs to this enterprise organization or is Super Admin
    const targetProfile = await db.collection('profiles').findOne({ user_id: targetUserId })
    if (!targetProfile) {
      return NextResponse.json({ detail: 'Candidate profile not found' }, { status: 404 })
    }

    if (
      !auth.isSuperAdmin &&
      targetProfile.enterprise_org_id !== auth.orgId &&
      targetProfile.email !== 'technohmsit@gmail.com'
    ) {
      return NextResponse.json({ detail: 'Forbidden. Target candidate does not belong to your organization.' }, { status: 403 })
    }

    // Check if user is currently disabled
    if (targetProfile.enabled_for_daily_run === false || targetProfile.enterprise_status === 'disabled') {
      return NextResponse.json({ detail: 'Cannot run on-demand sweep for a disabled member. Please enable the member first.' }, { status: 400 })
    }

    // Check if the org itself is disabled by Super Admin
    if (targetProfile.enterprise_org_id) {
      const orgRecord = await db.collection('enterprise_orgs').findOne({ org_id: targetProfile.enterprise_org_id })
      if (orgRecord && orgRecord.status === 'disabled') {
        return NextResponse.json({
          detail: `Organisation "${orgRecord.name || targetProfile.enterprise_org_id}" has been disabled by Super Admin. All on-demand and daily runs are blocked until re-enabled.`
        }, { status: 403 })
      }
    }


    // Check if task is already running
    const existingTask = await db.collection('tasks').findOne({
      user_id: targetUserId,
      status: { $in: ['pending', 'running'] }
    })

    if (existingTask) {
      return NextResponse.json({
        status: 'active',
        message: 'A live application sweep is already currently processing or queued for this candidate.',
        task_id: existingTask.task_id
      })
    }

    const now = new Date()

    // ── Rate Limit: Max 3 on-demand runs per day ────────────────────────────
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffsetMs)
    const todayIstStr = istNow.toISOString().slice(0, 10) // "YYYY-MM-DD"
    const todayStart = new Date(new Date(todayIstStr + 'T00:00:00+05:30').getTime())
    const todayEnd   = new Date(new Date(todayIstStr + 'T23:59:59+05:30').getTime())

    const todayOnDemandCount = await db.collection('tasks').countDocuments({
      user_id: targetUserId,
      source: { $in: ['enterprise_admin_on_demand', 'web_dashboard_on_demand'] },
      created_at: { $gte: todayStart, $lte: todayEnd }
    })

    if (todayOnDemandCount >= 3) {
      return NextResponse.json({
        detail: `Daily limit reached. On-demand sweeps are capped at 3 per day per member. ${targetProfile.name || targetUserId} has already used all 3 today. Resets at midnight IST.`,
        limit: 3,
        used_today: todayOnDemandCount,
        remaining_today: 0
      }, { status: 429 })
    }

    // ── Rate Limit: Max 10 on-demand runs per week ──────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const weeklyOnDemandCount = await db.collection('tasks').countDocuments({
      user_id: targetUserId,
      source: { $in: ['enterprise_admin_on_demand', 'web_dashboard_on_demand'] },
      created_at: { $gte: sevenDaysAgo }
    })

    if (weeklyOnDemandCount >= 10) {
      return NextResponse.json({
        detail: `Weekly limit reached. On-demand sweeps are capped at 10 per week per member. ${targetProfile.name || targetUserId} has used all 10 this week. Resets on a rolling 7-day basis.`,
        limit: 10,
        used_this_week: weeklyOnDemandCount,
        remaining_this_week: 0
      }, { status: 429 })
    }
    // ───────────────────────────────────────────────────────────────────────

    const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Count pending tasks ahead in queue
    const aheadCount = await db.collection('tasks').countDocuments({ status: 'pending' })
    const queuePosition = aheadCount + 1

    const newTask = {
      task_id: taskId,
      user_id: targetUserId,
      status: 'pending',
      source: 'enterprise_admin_on_demand',
      triggered_by: auth.email,
      created_at: now,
      updated_at: now,
      logs: [
        `[${now.toLocaleTimeString()}] 🏢 On-demand enterprise sweep initiated by Administrator (${auth.email}).`,
        `[${now.toLocaleTimeString()}] 📋 Enqueued at position #${queuePosition} in cloud dispatch pipeline.`
      ]
    }

    await db.collection('tasks').insertOne(newTask)

    // Update member profile last_scout_run_at
    await db.collection('profiles').updateOne(
      { user_id: targetUserId },
      {
        $set: { last_scout_run_at: now },
        $inc: { on_demand_run_count: 1 }
      }
    )

    return NextResponse.json({
      status: 'success',
      message: `On-demand sweep enqueued for ${targetProfile.name || targetUserId} at position #${queuePosition} in line.`,
      task_id: taskId,
      queue_position: queuePosition,
      candidate_name: targetProfile.name || targetUserId
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error triggering on-demand task' }, { status: 500 })
  }
}

/**
 * GET: Fetch live execution logs and status for a task within the enterprise org.
 * Query: ?task_id=... or ?user_id=...
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('task_id')
    const userId = searchParams.get('user_id')

    const query: any = {}
    if (taskId) {
      query.task_id = taskId
    } else if (userId) {
      query.user_id = userId
    } else {
      return NextResponse.json({ detail: 'task_id or user_id required' }, { status: 400 })
    }

    const tasks = await db.collection('tasks').find(query).sort({ created_at: -1 }).limit(1).toArray()
    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ task: null })
    }

    const t = tasks[0]
    return NextResponse.json({
      task: {
        task_id: t.task_id,
        user_id: t.user_id,
        status: t.status,
        summary: t.summary || null,
        created_at: t.created_at,
        started_at: t.started_at,
        completed_at: t.completed_at,
        heartbeat_at: t.heartbeat_at,
        logs_preview: Array.isArray(t.logs) ? t.logs.slice(-100) : [],
        logs_count: Array.isArray(t.logs) ? t.logs.length : 0
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

/**
 * DELETE: Stop / Halt a running or pending task for a member.
 * Query: ?task_id=...
 */
export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('task_id')
    if (!taskId) {
      return NextResponse.json({ detail: 'task_id required' }, { status: 400 })
    }

    const res = await db.collection('tasks').updateOne(
      { task_id: taskId, status: { $in: ['pending', 'running'] } },
      {
        $set: {
          status: 'cancelled',
          stop_requested: true,
          completed_at: new Date(),
          summary: `Halted by Enterprise Administrator (${auth.email})`
        },
        $push: {
          logs: `[${new Date().toLocaleTimeString()}] 🛑 Task halted by Enterprise Administrator (${auth.email}).`
        } as any
      }
    )

    if (res.matchedCount === 0) {
      return NextResponse.json({ detail: 'Task not found or not in active state' }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      message: `Task ${taskId} halted successfully.`
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

