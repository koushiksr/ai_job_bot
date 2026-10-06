import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

/**
 * Auto-heal tasks stuck in 'running' status with stale heartbeats (> 90 seconds).
 * If retries < 2, auto-re-queue to 'pending' so other active workers can claim them.
 * Always releases orphaned candidate locks so other workers can process candidates without delays.
 */
async function autoHealStaleTasks(db: any): Promise<number> {
  const ninetySecondsAgo = new Date(Date.now() - 90 * 1000)
  try {
    const staleRunning = await db.collection('tasks').find({
      status: 'running',
      $or: [
        { heartbeat_at: { $lt: ninetySecondsAgo } },
        { heartbeat_at: { $exists: false }, started_at: { $lt: ninetySecondsAgo } }
      ]
    }).toArray()

    let healedCount = 0
    const now = new Date()

    for (const t of staleRunning) {
      const retries = Number(t.retry_count || 0)
      const stopRequested = Boolean(t.stop_requested || t.status === 'stopped' || t.status === 'stop_requested')
      const targetUserId = t.user_id

      if (stopRequested) {
        await db.collection('tasks').updateOne(
          { _id: t._id },
          {
            $set: {
              status: 'stopped',
              stop_requested: true,
              completed_at: now,
              summary: 'Task stopped by user or administrator'
            },
            $push: {
              logs: `[${now.toLocaleTimeString()}] 🛑 Task stopped cleanly.`
            } as any
          }
        )
      } else if (retries < 2) {
        // Return to pending queue for other active workers
        await db.collection('tasks').updateOne(
          { _id: t._id },
          {
            $set: {
              status: 'pending',
              started_at: null,
              heartbeat_at: null,
              worker_id: null,
              worker_host: null,
              worker_pid: null
            },
            $inc: { retry_count: 1 },
            $push: {
              logs: `[${now.toLocaleTimeString()}] ⚠️ Worker disconnected (>90s silence). Task auto-returned to queue for other active workers (attempt ${retries + 1}/2).`
            } as any
          }
        )
      } else {
        await db.collection('tasks').updateOne(
          { _id: t._id },
          {
            $set: {
              status: 'failed',
              completed_at: now,
              summary: 'Worker disconnected (>90s silence) - exceeded max retries',
              error: 'Worker process heartbeat timed out (>90s) without recovery'
            },
            $push: {
              logs: `[${now.toLocaleTimeString()}] ❌ Marked as failed due to repeated worker heartbeat timeout (>90s).`
            } as any
          }
        )
      }

      // Always release candidate lock for this user
      if (targetUserId) {
        await db.collection('profiles').updateMany(
          { user_id: targetUserId },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
        await db.collection('users').updateMany(
          { user_id: targetUserId },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
      }
      healedCount++
    }

    // Also auto-reclaim orphaned candidate locks across profiles and users
    await db.collection('profiles').updateMany(
      {
        'current_execution.status': 'applying',
        $or: [
          { 'current_execution.heartbeat_at': { $lt: ninetySecondsAgo } },
          { 'current_execution.heartbeat_at': { $exists: false }, 'current_execution.locked_at': { $lt: ninetySecondsAgo } }
        ]
      },
      {
        $set: {
          'current_execution.status': 'idle',
          'current_execution.worker_id': null,
          automation_status: 'idle'
        }
      }
    )
    await db.collection('users').updateMany(
      {
        'current_execution.status': 'applying',
        $or: [
          { 'current_execution.heartbeat_at': { $lt: ninetySecondsAgo } },
          { 'current_execution.heartbeat_at': { $exists: false }, 'current_execution.locked_at': { $lt: ninetySecondsAgo } }
        ]
      },
      {
        $set: {
          'current_execution.status': 'idle',
          'current_execution.worker_id': null,
          automation_status: 'idle'
        }
      }
    )

    return healedCount
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
        action: t.action || null,
        headless: Boolean(t.headless),
        created_at: t.created_at,
        started_at: t.started_at || null,
        completed_at: t.completed_at || null,
        heartbeat_at: t.heartbeat_at || null,
        heartbeat_seconds_ago: heartbeatSecondsAgo,
        summary: t.summary || '',
        jobs_applied: t.jobs_applied || (t.stats?.total_applied) || 0,
        stop_requested: Boolean(t.stop_requested),
        worker_id: t.worker_id || null,
        worker_host: t.worker_host || t.worker_hostname || t.hostname || null,
        worker_device_brand: t.worker_device_brand || t.device_brand || null,
        worker_hardware_model: t.worker_hardware_model || t.hardware_model || null,
        worker_platform: t.worker_platform || t.platform || null,
        logs_count: Array.isArray(t.logs) ? t.logs.length : 0,
        logs_preview: Array.isArray(t.logs) ? (searchQuery ? t.logs.slice(-200) : t.logs.slice(-60)) : []
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

      const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
      const todayIstStr = istNow.toISOString().slice(0, 10)
      // When admin triggers on-demand sweep, clear previous transient limit flags
      // so the candidate's worker actively attempts fresh applications
      if (targetUserId !== 'admin' && targetUserId !== 'all') {
        await Promise.all([
          db.collection('profiles').updateOne(
            { user_id: targetUserId },
            { $set: { naukri_daily_limit_reached: false, naukri_daily_limit_date: null, naukri_daily_limit_reason: null } }
          ),
          db.collection('users').updateOne(
            { user_id: targetUserId },
            { $set: { naukri_daily_limit_reached: false, naukri_daily_limit_date: null, naukri_daily_limit_reason: null } }
          )
        ])
      }

      const aheadPendingCount = await db.collection('tasks').countDocuments({ status: 'pending' })

      const isAllCandidates = targetUserId === 'all' || targetUserId === 'admin'

      if (isAllCandidates) {
        // Query users, profiles, and active tasks to construct individual parallel tasks
        const [userDocs, profileDocs, activeTasksDocs] = await Promise.all([
          db.collection('users').find({}, { projection: { user_id: 1, email: 1, name: 1, role: 1, is_admin: 1, is_org_admin: 1, is_org_admin_only: 1, enterprise_role: 1, enabled_for_daily_run: 1, naukri_daily_limit_date: 1, naukri_daily_limit_reason: 1 } }).toArray(),
          db.collection('profiles').find({}, { projection: { user_id: 1, email: 1, name: 1, role: 1, is_admin: 1, is_org_admin: 1, is_org_admin_only: 1, enterprise_role: 1, enabled_for_daily_run: 1, naukri_daily_limit_date: 1, naukri_daily_limit_reason: 1 } }).toArray(),
          db.collection('tasks').find({ status: { $in: ['pending', 'running'] } }, { projection: { user_id: 1, task_id: 1, status: 1 } }).toArray()
        ])

        const isAdministrativeAccount = (u: any): boolean => {
          if (!u) return false
          const uid = (u.user_id || '').toLowerCase()
          const email = (u.email || '').toLowerCase()
          const role = (u.role || '').toLowerCase()
          const entRole = (u.enterprise_role || '').toLowerCase()
          if (uid === 'technohmsit' || uid === 'admin') return true
          if (email === 'technohmsit@gmail.com' || email === 'ranganathat32@gmail.com' || email === 'koushiksrmedala@gmail.com') return true
          if (role === 'admin' || role === 'enterprise_admin') return true
          if (entRole === 'admin' || entRole === 'super_admin') return true
          if (u.is_admin || u.is_org_admin || u.is_org_admin_only) return true
          return false
        }

        const profileMap = new Map<string, any>()
        profileDocs.forEach(p => { if (p.user_id) profileMap.set(p.user_id, p) })
        userDocs.forEach(u => {
          if (u.user_id && !profileMap.has(u.user_id)) {
            profileMap.set(u.user_id, u)
          } else if (u.user_id && profileMap.has(u.user_id)) {
            profileMap.set(u.user_id, { ...u, ...profileMap.get(u.user_id) })
          }
        })

        const activeUserTaskMap = new Map<string, any>()
        activeTasksDocs.forEach(t => {
          if (t.user_id) activeUserTaskMap.set(t.user_id, t)
        })

        const candidates = Array.from(profileMap.values()).filter(p => !isAdministrativeAccount(p))
        const newTasks: any[] = []
        let skippedAlreadyActive = 0
        let skippedNaukriLimit = 0
        let skippedDisabled = 0

        for (let i = 0; i < candidates.length; i++) {
          const cand = candidates[i]
          const uid = cand.user_id

          // Check if candidate hit Naukri daily limit today (unless force)
          if (cand.naukri_daily_limit_date === todayIstStr && !body.force) {
            skippedNaukriLimit++
            continue
          }

          // Check if candidate is manually paused / disabled for daily run (unless force)
          if (cand.enabled_for_daily_run === false && !body.force) {
            skippedDisabled++
            continue
          }

          // Check if candidate already has an active pending/running task (unless force)
          if (activeUserTaskMap.has(uid) && !body.force) {
            skippedAlreadyActive++
            continue
          }

          const candidateTaskId = `task_${uid}_admin_${Date.now()}_${i}`
          const candLabel = cand.name ? `${cand.name} (${cand.email || uid})` : uid
          const queuePosition = aheadPendingCount + newTasks.length + 1

          newTasks.push({
            task_id: candidateTaskId,
            user_id: uid,
            status: 'pending',
            headless: false,
            source: 'admin_on_demand',
            created_at: new Date(now.getTime() + i * 50),
            logs: [
              `[${now.toLocaleTimeString()}] 🚀 Enqueued for parallel worker fleet execution by Administrator (${adminEmail || adminId}) for '${candLabel}'.`,
              `[${now.toLocaleTimeString()}] ⏳ Ready in queue (position #${queuePosition}). Awaiting worker pickup...`
            ]
          })
        }

        if (newTasks.length > 0) {
          await db.collection('tasks').insertMany(newTasks)

          // Batch update profiles & users current_execution status to 'in_queue'
          const enqueuedUids = newTasks.map(t => t.user_id)
          await Promise.all([
            db.collection('profiles').updateMany(
              { user_id: { $in: enqueuedUids } },
              { $set: { 'current_execution.status': 'in_queue', automation_status: 'queued' } }
            ),
            db.collection('users').updateMany(
              { user_id: { $in: enqueuedUids } },
              { $set: { 'current_execution.status': 'in_queue', automation_status: 'queued' } }
            )
          ])
        }

        await logUserActivity(db, {
          userId: adminId || 'admin',
          email: adminEmail || 'admin@jobfluxai.com',
          eventType: 'task_run',
          description: `Administrator triggered parallel fleet run for all candidates (${newTasks.length} enqueued, ${skippedAlreadyActive} already active, ${skippedNaukriLimit} limit-paused)`,
          ipAddress: ip,
          userAgent: userAgent,
          metadata: { action: 'trigger_all_candidates_parallel', enqueuedCount: newTasks.length }
        })

        return NextResponse.json({
          status: 'success',
          message: `Dispatched ${newTasks.length} candidate tasks to the queue for parallel worker execution! (${skippedAlreadyActive} already active, ${skippedNaukriLimit} limit-paused)`,
          enqueuedCount: newTasks.length,
          skippedActive: skippedAlreadyActive,
          skippedLimit: skippedNaukriLimit,
          skippedDisabled
        })
      }

      // Single Candidate Trigger
      const prof = await db.collection('profiles').findOne({ user_id: targetUserId }) ||
                   await db.collection('users').findOne({ user_id: targetUserId })

      if (prof?.naukri_daily_limit_date === todayIstStr && !body.force) {
        const reason = prof.naukri_daily_limit_reason || 'There was an error while processing your request, please try again later'
        return NextResponse.json({
          status: 'naukri_limit_reached',
          detail: `Naukri daily application limit reached for today ("${reason}"). You cannot apply to jobs today anymore. On-demand sweeps are paused until tomorrow.`,
          reason
        }, { status: 400 })
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

      const queuePosition = aheadPendingCount + 1
      const taskId = `task_${targetUserId}_admin_${Date.now()}`

      // Resolve candidate label for logging
      const candidateLabel = prof ? `${prof.name || targetUserId} (${prof.email || targetUserId})` : targetUserId

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

      await Promise.all([
        db.collection('profiles').updateOne(
          { user_id: targetUserId },
          { $set: { 'current_execution.status': 'in_queue', 'current_execution.task_id': taskId, automation_status: 'queued' } }
        ),
        db.collection('users').updateOne(
          { user_id: targetUserId },
          { $set: { 'current_execution.status': 'in_queue', 'current_execution.task_id': taskId, automation_status: 'queued' } }
        )
      ])

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

      if (task.user_id) {
        await db.collection('profiles').updateMany(
          { user_id: task.user_id },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
        await db.collection('users').updateMany(
          { user_id: task.user_id },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
      }

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
          heartbeat_at: '',
          worker_id: '',
          worker_host: '',
          worker_pid: ''
        },
        $push: {
          logs: `[${now.toLocaleTimeString()}] 🔄 Task restored to pending queue by Administrator.`
        } as any
      })

      if (task.user_id) {
        await db.collection('profiles').updateMany(
          { user_id: task.user_id },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
        await db.collection('users').updateMany(
          { user_id: task.user_id },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
      }

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

      const taskToDelete = await db.collection('tasks').findOne(idQuery)
      await db.collection('tasks').deleteOne(idQuery)

      if (taskToDelete?.user_id) {
        await db.collection('profiles').updateMany(
          { user_id: taskToDelete.user_id },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
        await db.collection('users').updateMany(
          { user_id: taskToDelete.user_id },
          { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
        )
      }

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
