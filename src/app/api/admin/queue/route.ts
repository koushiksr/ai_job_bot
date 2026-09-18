import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

/**
 * Auto-heal tasks stuck in 'running' status with stale heartbeats (> 10 minutes)
 */
async function autoHealStaleTasks(db: any): Promise<number> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  try {
    const res = await db.collection('tasks').updateMany(
      {
        status: 'running',
        $or: [
          { heartbeat_at: { $lt: tenMinutesAgo } },
          { heartbeat_at: { $exists: false }, started_at: { $lt: tenMinutesAgo } }
        ]
      },
      {
        $set: {
          status: 'failed',
          summary: 'Session timed out or worker process was interrupted (Heartbeat lost)',
          completed_at: new Date()
        },
        $push: {
          logs: `[${new Date().toLocaleTimeString()}] ⚠️ Marked as failed due to worker heartbeat timeout.`
        } as any
      }
    )
    return res.modifiedCount || 0
  } catch (err) {
    console.error('Error auto-healing stale tasks:', err)
    return 0
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    // Auto-heal any stale running tasks
    await autoHealStaleTasks(db)

    const url = new URL(req.url)
    const statusFilter = url.searchParams.get('status') || 'all'
    const searchQuery = (url.searchParams.get('q') || '').trim().toLowerCase()
    const limitParam = parseInt(url.searchParams.get('limit') || '100', 10)

    // Compute metrics across the entire queue
    const allTasksCount = await db.collection('tasks').countDocuments()
    const pendingCount = await db.collection('tasks').countDocuments({ status: 'pending' })
    const runningCount = await db.collection('tasks').countDocuments({ status: 'running' })
    const completedCount = await db.collection('tasks').countDocuments({ status: 'completed' })
    const failedCount = await db.collection('tasks').countDocuments({ status: 'failed' })
    const cancelledCount = await db.collection('tasks').countDocuments({ status: { $in: ['cancelled', 'stopped'] } })

    // Find active running task
    const activeRunningDoc = await db.collection('tasks').findOne({ status: 'running' })

    // Build query filter
    const query: any = {}
    if (statusFilter !== 'all') {
      if (statusFilter === 'cancelled') {
        query.status = { $in: ['cancelled', 'stopped'] }
      } else {
        query.status = statusFilter
      }
    }

    if (searchQuery) {
      query.$or = [
        { user_id: { $regex: searchQuery, $options: 'i' } },
        { task_id: { $regex: searchQuery, $options: 'i' } },
        { summary: { $regex: searchQuery, $options: 'i' } }
      ]
    }

    // Sort order: Running first, then Pending (FIFO by created_at ASC), then Completed/Failed/Cancelled (DESC)
    const rawTasks = await db
      .collection('tasks')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limitParam)
      .toArray()

    // Calculate queue positions for pending tasks
    const pendingTasksInOrder = await db
      .collection('tasks')
      .find({ status: 'pending' })
      .sort({ created_at: 1 })
      .project({ _id: 1, task_id: 1 })
      .toArray()

    const queuePositionMap = new Map<string, number>()
    pendingTasksInOrder.forEach((pt: any, idx: number) => {
      const idStr = pt._id.toString()
      queuePositionMap.set(idStr, idx + 1)
      if (pt.task_id) queuePositionMap.set(pt.task_id, idx + 1)
    })

    // Fetch candidate profiles for rich display
    const userIds = Array.from(new Set(rawTasks.map((t: any) => t.user_id).filter(Boolean)))
    const profiles = await db.collection('profiles').find({ user_id: { $in: userIds } }).toArray()
    const users = await db.collection('users').find({ user_id: { $in: userIds } }).toArray()

    const profileMap = new Map<string, any>()
    profiles.forEach((p: any) => profileMap.set(p.user_id, p))
    users.forEach((u: any) => {
      if (!profileMap.has(u.user_id)) profileMap.set(u.user_id, u)
    })

    const formattedTasks = rawTasks.map((t: any) => {
      const idStr = t._id.toString()
      const p = profileMap.get(t.user_id) || {}
      const isRunning = t.status === 'running'
      const isPending = t.status === 'pending'
      const isCancelled = t.status === 'cancelled' || t.status === 'stopped'

      let queuePos = 0
      if (isPending) {
        queuePos = queuePositionMap.get(idStr) || queuePositionMap.get(t.task_id) || 1
      }

      // Compute heartbeat freshness
      let heartbeatSecondsAgo: number | null = null
      if (t.heartbeat_at) {
        heartbeatSecondsAgo = Math.max(0, Math.floor((Date.now() - new Date(t.heartbeat_at).getTime()) / 1000))
      }

      return {
        id: idStr,
        task_id: t.task_id || idStr,
        user_id: t.user_id || 'anonymous',
        candidate_name: p.name || (t.user_id ? t.user_id.replace('_', ' ') : 'Candidate'),
        candidate_email: p.email || '',
        candidate_plan: p.plan || 'trial',
        is_vip: Boolean(p.is_vip || p.vip_access),
        status: isCancelled ? 'cancelled' : t.status,
        queue_position: queuePos,
        source: t.source || 'on_demand',
        headless: Boolean(t.headless),
        created_at: t.created_at,
        started_at: t.started_at || null,
        completed_at: t.completed_at || null,
        heartbeat_at: t.heartbeat_at || null,
        heartbeat_seconds_ago: heartbeatSecondsAgo,
        summary: t.summary || '',
        jobs_applied: t.jobs_applied || (t.stats?.total_applied) || 0,
        stop_requested: Boolean(t.stop_requested),
        logs_count: Array.isArray(t.logs) ? t.logs.length : 0,
        logs_preview: Array.isArray(t.logs) ? t.logs.slice(-30) : []
      }
    })

    return NextResponse.json({
      metrics: {
        total: allTasksCount,
        pending: pendingCount,
        running: runningCount,
        completed: completedCount,
        failed: failedCount,
        cancelled: cancelledCount
      },
      worker_status: {
        is_busy: Boolean(activeRunningDoc),
        active_task_id: activeRunningDoc?.task_id || activeRunningDoc?._id?.toString() || null,
        active_user_id: activeRunningDoc?.user_id || null,
        started_at: activeRunningDoc?.started_at || null
      },
      tasks: formattedTasks
    })
  } catch (err: any) {
    console.error('Admin Queue GET error:', err)
    return NextResponse.json({ detail: err.message || 'Failed to fetch queue tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, userId: adminId, email: adminEmail } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const { action, taskId, reason } = body
    const { ip, userAgent } = getClientInfo(req)

    if (!action) {
      return NextResponse.json({ detail: 'Action parameter is required.' }, { status: 400 })
    }

    const now = new Date()

    // ACTION 0: Admin On-Demand Trigger for any chosen candidate or all candidates
    if (action === 'trigger_on_demand' || action === 'enqueue_on_demand') {
      const targetUserId = (body.userId || body.user_id || body.candidateId || '').trim()
      if (!targetUserId) {
        return NextResponse.json({ detail: 'Target candidate user_id is required.' }, { status: 400 })
      }

      // Check if candidate already has an active pending/running task unless force is requested
      const activeTask = await db.collection('tasks').findOne({
        user_id: targetUserId,
        status: { $in: ['pending', 'running'] }
      })

      if (activeTask && !body.force) {
        return NextResponse.json({
          status: 'already_active',
          detail: `Candidate '${targetUserId}' already has an active task (${activeTask.status}) in the queue (Task ID: ${activeTask.task_id}).`,
          taskId: activeTask.task_id,
          taskStatus: activeTask.status
        }, { status: 409 })
      }

      const aheadPendingCount = await db.collection('tasks').countDocuments({ status: 'pending' })
      const queuePosition = aheadPendingCount + 1
      const taskId = `task_${targetUserId}_admin_${Date.now()}`

      // Resolve candidate label for logging
      let candidateLabel = targetUserId
      if (targetUserId === 'admin') {
        candidateLabel = 'All Candidates (Admin Autopilot Controller)'
      } else {
        const prof = await db.collection('profiles').findOne({ user_id: targetUserId }) ||
                     await db.collection('users').findOne({ user_id: targetUserId })
        if (prof) {
          candidateLabel = `${prof.name || targetUserId} (${prof.email || targetUserId})`
        }
      }

      const newTask = {
        task_id: taskId,
        user_id: targetUserId,
        status: 'pending',
        headless: false,
        source: 'admin_on_demand',
        created_at: now,
        logs: [
          `[${now.toLocaleTimeString()}] 🚀 On-demand application sweep enqueued by Administrator (${adminEmail || adminId}) for '${candidateLabel}'.`,
          queuePosition > 1
            ? `[${now.toLocaleTimeString()}] ⏳ Queued at position #${queuePosition} in line.`
            : `[${now.toLocaleTimeString()}] ⏳ Ready in queue. Awaiting worker pickup...`
        ]
      }

      await db.collection('tasks').insertOne(newTask)

      await logUserActivity(db, {
        userId: adminId || 'admin',
        email: adminEmail || 'admin@jobfluxai.com',
        eventType: 'task_run',
        description: `Administrator triggered on-demand run for '${candidateLabel}' (Task: ${taskId})`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { action: 'trigger_on_demand', taskId, targetUserId }
      })

      return NextResponse.json({
        status: 'success',
        message: `Successfully enqueued on-demand run for ${candidateLabel} (Queue position #${queuePosition}).`,
        taskId,
        queuePosition
      })
    }

    // ACTION 1: Mark specific task NOT to execute (Cancel task)
    if (action === 'mark_not_to_execute' || action === 'cancel') {
      if (!taskId) {
        return NextResponse.json({ detail: 'taskId is required.' }, { status: 400 })
      }

      let idQuery: any = { task_id: taskId }
      try {
        idQuery = { $or: [{ _id: new ObjectId(taskId) }, { _id: taskId }, { task_id: taskId }] }
      } catch {
        idQuery = { $or: [{ _id: taskId }, { task_id: taskId }] }
      }

      const task = await db.collection('tasks').findOne(idQuery)
      if (!task) {
        return NextResponse.json({ detail: 'Task not found in queue.' }, { status: 404 })
      }

      const cancelSummary = reason || 'Marked NOT to execute by Administrator'

      await db.collection('tasks').updateOne(idQuery, {
        $set: {
          status: 'cancelled',
          stop_requested: true,
          completed_at: now,
          summary: cancelSummary,
          updated_at: now
        },
        $push: {
          logs: `[${now.toLocaleTimeString()}] 🛑 Task marked NOT TO EXECUTE by Administrator (${adminEmail || adminId}). Worker will skip this job.`
        } as any
      })

      await logUserActivity(db, {
        userId: adminId || 'admin',
        email: adminEmail || 'admin@jobfluxai.com',
        eventType: 'task_run',
        description: `Administrator marked task ${taskId} NOT to execute (${task.user_id})`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { action: 'mark_not_to_execute', taskId, targetUserId: task.user_id }
      })

      return NextResponse.json({
        status: 'success',
        message: `Task ${taskId} marked NOT TO EXECUTE. Worker will not run this application request.`
      })
    }

    // ACTION 2: Re-queue task to pending
    if (action === 'requeue') {
      if (!taskId) {
        return NextResponse.json({ detail: 'taskId is required.' }, { status: 400 })
      }

      let idQuery: any = { task_id: taskId }
      try {
        idQuery = { $or: [{ _id: new ObjectId(taskId) }, { _id: taskId }, { task_id: taskId }] }
      } catch {
        idQuery = { $or: [{ _id: taskId }, { task_id: taskId }] }
      }

      const task = await db.collection('tasks').findOne(idQuery)
      if (!task) {
        return NextResponse.json({ detail: 'Task not found.' }, { status: 404 })
      }

      await db.collection('tasks').updateOne(idQuery, {
        $set: {
          status: 'pending',
          stop_requested: false,
          created_at: now,
          summary: 'Re-queued to execution line by Administrator',
          updated_at: now
        },
        $unset: {
          started_at: '',
          completed_at: '',
          heartbeat_at: ''
        },
        $push: {
          logs: `[${now.toLocaleTimeString()}] 🔄 Task restored to pending queue by Administrator.`
        } as any
      })

      await logUserActivity(db, {
        userId: adminId || 'admin',
        email: adminEmail || 'admin@jobfluxai.com',
        eventType: 'task_run',
        description: `Administrator re-queued task ${taskId} into pending line`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { action: 'requeue', taskId }
      })

      return NextResponse.json({
        status: 'success',
        message: `Task ${taskId} successfully placed back in pending queue.`
      })
    }

    // ACTION 3: Cancel all pending tasks in bulk
    if (action === 'cancel_all_pending') {
      const result = await db.collection('tasks').updateMany(
        { status: 'pending' },
        {
          $set: {
            status: 'cancelled',
            stop_requested: true,
            completed_at: now,
            summary: 'Bulk cancelled by Administrator',
            updated_at: now
          },
          $push: {
            logs: `[${now.toLocaleTimeString()}] 🛑 Pending queue cleared by Administrator.`
          } as any
        }
      )

      await logUserActivity(db, {
        userId: adminId || 'admin',
        email: adminEmail || 'admin@jobfluxai.com',
        eventType: 'task_run',
        description: `Administrator cancelled all pending tasks in bulk (${result.modifiedCount} tasks)`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: { action: 'cancel_all_pending', modifiedCount: result.modifiedCount }
      })

      return NextResponse.json({
        status: 'success',
        message: `Successfully cancelled ${result.modifiedCount} pending tasks in queue.`,
        modified_count: result.modifiedCount
      })
    }

    // ACTION 4: Permanent delete task
    if (action === 'delete') {
      if (!taskId) {
        return NextResponse.json({ detail: 'taskId is required.' }, { status: 400 })
      }

      let idQuery: any = { task_id: taskId }
      try {
        idQuery = { $or: [{ _id: new ObjectId(taskId) }, { _id: taskId }, { task_id: taskId }] }
      } catch {
        idQuery = { $or: [{ _id: taskId }, { task_id: taskId }] }
      }

      await db.collection('tasks').deleteOne(idQuery)

      return NextResponse.json({
        status: 'success',
        message: `Task ${taskId} removed permanently from database.`
      })
    }

    // ACTION 5: Reclaim stale running tasks
    if (action === 'reclaim_stale') {
      const reclaimed = await autoHealStaleTasks(db)
      return NextResponse.json({
        status: 'success',
        message: `Reclaimed ${reclaimed} stale running tasks.`,
        reclaimed_count: reclaimed
      })
    }

    return NextResponse.json({ detail: `Unknown action: ${action}` }, { status: 400 })
  } catch (err: any) {
    console.error('Admin Queue POST error:', err)
    return NextResponse.json({ detail: err.message || 'Failed to update queue' }, { status: 500 })
  }
}
