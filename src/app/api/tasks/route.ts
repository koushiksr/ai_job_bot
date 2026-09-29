import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'
import { getWeeklyOnDemandLimit } from '@/config/plans'

export const dynamic = 'force-dynamic'

async function healStaleUserTasks(db: any, userId: string) {
  const ninetySecondsAgo = new Date(Date.now() - 90 * 1000)
  try {
    const staleTasks = await db.collection('tasks').find({
      user_id: userId,
      status: 'running',
      $or: [
        { heartbeat_at: { $lt: ninetySecondsAgo } },
        { heartbeat_at: { $exists: false }, started_at: { $lt: ninetySecondsAgo } }
      ]
    }).toArray()

    const now = new Date()
    for (const t of staleTasks) {
      const retries = Number(t.retry_count || 0)
      const stopRequested = Boolean(t.stop_requested || t.status === 'stopped' || t.status === 'stop_requested')

      if (stopRequested) {
        await db.collection('tasks').updateOne(
          { _id: t._id },
          {
            $set: {
              status: 'stopped',
              stop_requested: true,
              completed_at: now,
              summary: 'Task stopped by user or administrator'
            }
          }
        )
      } else if (retries < 2) {
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
              logs: `[${now.toLocaleTimeString()}] ❌ Task marked as failed due to repeated worker heartbeat timeout (>90s).`
            } as any
          }
        )
      }

      await db.collection('profiles').updateMany(
        { user_id: userId },
        { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
      )
      await db.collection('users').updateMany(
        { user_id: userId },
        { $set: { 'current_execution.status': 'idle', 'current_execution.worker_id': null, automation_status: 'idle' } }
      )
    }
  } catch (err) {
    console.error('Error auto-healing stale tasks:', err)
  }
}

async function getWeeklyOnDemandQuota(db: any, userId: string, isSuperUser: boolean, isVip: boolean, isEnterpriseMember: boolean = false, plan?: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const usedCount = await db.collection('tasks').countDocuments({
    user_id: userId,
    source: 'web_dashboard_on_demand',
    created_at: { $gte: sevenDaysAgo }
  })
  // Org Pro buyers get 15 weekly on-demand runs (vs 10 enterprise base, 5 pro)
  const weeklyLimit = getWeeklyOnDemandLimit(plan, isEnterpriseMember)
  const isUnlimited = isSuperUser || (isVip && !isEnterpriseMember)
  return {
    limit: weeklyLimit,
    used: usedCount,
    remaining: isUnlimited ? 999 : Math.max(0, weeklyLimit - usedCount),
    is_unlimited: isUnlimited,
    is_enterprise: isEnterpriseMember
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ task: null })
    }

    // Auto-heal any stale running tasks for this candidate
    await healStaleUserTasks(db, userId)

    // Check user plan eligibility
    const profile = await db.collection('profiles').findOne({ user_id: userId }) ||
                    await db.collection('users').findOne({ user_id: userId })

    const role = profile?.role || 'user'
    const plan = (profile?.plan || 'trial').toLowerCase()
    const now = new Date()
    const isSuperUser = role === 'admin' || userId === 'admin' || userId === 'technohmsit'
    const isVip = Boolean(profile?.is_vip || profile?.vip_access || profile?.free_privilege)
    const isEnterpriseMember = profile?.enterprise_role === 'member' || plan === 'enterprise' || plan === 'org_pro'
    const isProTier = plan === 'elite' || plan === 'professional' || plan === 'vip'
    const hasActiveExpiration = profile?.plan_expires_at ? new Date(profile.plan_expires_at) > now : false
    const isPro = isSuperUser || isVip || isEnterpriseMember || (isProTier && hasActiveExpiration)

    const quota = await getWeeklyOnDemandQuota(db, userId, isSuperUser, isVip, isEnterpriseMember, plan)

    const latestTask = await db
      .collection('tasks')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray()

    const activeRunningTask = await db.collection('tasks').findOne({ status: 'running' })
    const isGlobalSweepActive = Boolean(activeRunningTask)

    let queuePosition = 0
    let t = latestTask && latestTask.length > 0 ? latestTask[0] : null

    if (t && t.status === 'pending') {
      const aheadCount = await db.collection('tasks').countDocuments({
        status: 'pending',
        created_at: { $lt: t.created_at }
      })
      queuePosition = aheadCount + 1
    }

    return NextResponse.json({
      task: t ? {
        id: t._id.toString(),
        task_id: t.task_id,
        user_id: t.user_id,
        status: t.status,
        created_at: t.created_at,
        started_at: t.started_at,
        completed_at: t.completed_at,
        summary: t.summary || null,
        logs: Array.isArray(t.logs) ? t.logs.slice(-50) : []
      } : null,
      queue_status: {
        queue_position: queuePosition,
        is_global_sweep_active: isGlobalSweepActive,
        active_user_id: activeRunningTask ? activeRunningTask.user_id : null
      },
      weekly_quota: quota,
      is_pro: isPro
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req, { limit: 10, windowSeconds: 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { detail: `Too many on-demand task dispatches. Please wait ${rateCheck.resetSeconds} seconds before requesting again.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { user_id, headless } = body

    if (!user_id) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database connection failed' }, { status: 500 })
    }

    // Auto-heal any stale running tasks for this candidate before evaluating eligibility
    await healStaleUserTasks(db, user_id)

    // 1. Plan Verification: On-Demand runs require Professional/Enterprise subscription or VIP/Admin bypass
    const profile = await db.collection('profiles').findOne({ user_id: user_id }) ||
                    await db.collection('users').findOne({ user_id: user_id })

    const role = profile?.role || 'user'
    const plan = (profile?.plan || 'trial').toLowerCase()
    const now = new Date()

    // 0. Check Naukri platform daily application limit for today
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    const todayIstStr = istNow.toISOString().slice(0, 10)
    if (profile?.naukri_daily_limit_date === todayIstStr) {
      const reason = profile.naukri_daily_limit_reason || 'There was an error while processing your request, please try again later'
      return NextResponse.json({
        detail: `Naukri daily application limit reached for today ("${reason}"). You cannot apply to jobs today anymore. On-demand sweeps are paused and will resume tomorrow.`,
        code: 'NAUKRI_DAILY_LIMIT_REACHED',
        reason
      }, { status: 400 })
    }

    const isSuperUser = role === 'admin' || user_id === 'admin' || user_id === 'technohmsit'
    const isVip = Boolean(profile?.is_vip || profile?.vip_access || profile?.free_privilege)
    const isEnterpriseMember = profile?.enterprise_role === 'member' || Boolean(profile?.enterprise_org_id || profile?.org_id) || ['enterprise', 'org_starter', 'org_pro', 'org_pro_3m'].includes(plan)
    const isProTier = plan === 'elite' || plan === 'professional' || plan === 'vip'
    const hasActiveExpiration = profile?.plan_expires_at ? new Date(profile.plan_expires_at) > now : false
    const isOrgProActive = isEnterpriseMember && (plan === 'org_pro' || plan === 'org_pro_3m' || plan === 'pro') && (hasActiveExpiration || (!profile?.plan_expires_at && isVip))
    const isPro = isSuperUser || (!isEnterpriseMember && isVip) || isOrgProActive || (!isEnterpriseMember && isProTier && hasActiveExpiration)

    if (!isPro) {
      const reason = isEnterpriseMember
        ? (plan === 'org_starter'
            ? 'Org Starter includes scheduled morning sweeps only (0 on-demand sweeps). Upgrade to Org Pro (₹99) to unlock 15 weekly on-demand sweeps.'
            : 'Payment required: Please subscribe to Org Starter (₹79) or Org Pro (₹99) to activate applications.')
        : 'On-Demand real-time job application sweeps are a Professional exclusive feature. Upgrade to trigger on-demand sweeps directly.'
      return NextResponse.json({
        detail: reason,
        code: 'UPGRADE_REQUIRED',
        required_plan: isEnterpriseMember ? 'org_pro' : 'professional'
      }, { status: 403 })
    }

    // 2. Weekly Quota Enforcement (15 org_pro, 10 enterprise, 5 pro)
    const quota = await getWeeklyOnDemandQuota(db, user_id, isSuperUser, isVip, isEnterpriseMember, plan)
    if (!quota.is_unlimited && quota.used >= quota.limit) {
      return NextResponse.json({
        detail: `Weekly on-demand sweep limit reached (${quota.limit}/${quota.limit}). Daily automated sweeps continue running every day. Quota resets on a rolling 7-day basis.`,
        code: 'WEEKLY_QUOTA_EXCEEDED',
        quota: quota
      }, { status: 429 })
    }

    // 2b. Daily Quota Enforcement (max 3 on-demand runs per day per user)
    if (!quota.is_unlimited) {
      const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
      const todayIstStr = istNow.toISOString().slice(0, 10)
      const todayStart = new Date(new Date(todayIstStr + 'T00:00:00+05:30').getTime())
      const todayEnd = new Date(new Date(todayIstStr + 'T23:59:59+05:30').getTime())
      const usedToday = await db.collection('tasks').countDocuments({
        user_id: user_id,
        source: { $in: ['web_dashboard_on_demand', 'enterprise_admin_on_demand'] },
        created_at: { $gte: todayStart, $lte: todayEnd }
      })
      if (usedToday >= 3) {
        return NextResponse.json({
          detail: `Daily on-demand limit reached (3/3 used today). Resets at midnight IST — your automated morning sweeps continue every day regardless.`,
          code: 'DAILY_QUOTA_EXCEEDED',
          quota: { ...quota, used_today: usedToday, remaining_today: 0 }
        }, { status: 429 })
      }
    }

    // 3. Prevent duplicate active tasks for the same user
    const existingTask = await db.collection('tasks').findOne({
      user_id: user_id,
      status: { $in: ['pending', 'running'] }
    })

    if (existingTask) {
      let position = 1
      if (existingTask.status === 'pending') {
        const aheadCount = await db.collection('tasks').countDocuments({
          status: 'pending',
          created_at: { $lt: existingTask.created_at }
        })
        position = aheadCount + 1
      }
      return NextResponse.json({
        success: true,
        already_active: true,
        task_id: existingTask.task_id,
        status: existingTask.status,
        queue_position: position,
        message: existingTask.status === 'running'
          ? 'An application sweep is currently active and running for your profile.'
          : `Your application sweep is enqueued at position #${position} in line.`
      })
    }

    // 4. Calculate queue position for new task
    const aheadPendingCount = await db.collection('tasks').countDocuments({ status: 'pending' })
    const queuePosition = aheadPendingCount + 1

    const taskId = `task_${user_id}_${Date.now()}`
    const newTask = {
      task_id: taskId,
      user_id: user_id,
      status: 'pending',
      headless: headless !== undefined ? headless : true,
      source: 'web_dashboard_on_demand',
      created_at: now,
      logs: [
        `[${now.toISOString().split('T')[1].slice(0, 8)}] 🚀 On-demand job sweep enqueued via Web Dashboard.`,
        queuePosition > 1
          ? `[${now.toISOString().split('T')[1].slice(0, 8)}] ⏳ Queued at position #${queuePosition} in line (worker processes tasks sequentially one by one).`
          : `[${now.toISOString().split('T')[1].slice(0, 8)}] ⏳ Ready in queue. Awaiting worker pickup...`
      ]
    }

    await db.collection('tasks').insertOne(newTask)

    // Log on-demand scout task run activity
    const { ip, userAgent } = getClientInfo(req)
    await logUserActivity(db, {
      userId: user_id,
      eventType: 'task_run',
      description: `Dispatched on-demand application sweep (${taskId})`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        task_id: taskId,
        headless: newTask.headless,
        source: newTask.source,
        queue_position: queuePosition
      }
    })

    return NextResponse.json({
      success: true,
      task_id: taskId,
      status: 'pending',
      queue_position: queuePosition,
      quota: {
        limit: quota.limit,
        used: quota.used + 1,
        remaining: quota.is_unlimited ? 999 : Math.max(0, quota.limit - (quota.used + 1))
      },
      message: queuePosition > 1
        ? `On-demand sweep enqueued at position #${queuePosition} in line. Queue worker processes tasks sequentially one by one.`
        : 'On-demand job sweep enqueued successfully. Starting momentarily...'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

