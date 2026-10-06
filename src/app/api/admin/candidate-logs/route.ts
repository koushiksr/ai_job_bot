import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/candidate-logs
 * Comprehensive candidate audit endpoint for Superadmin:
 * - Diagnostic assessment (Naukri limit, daily cap, zero-matches, circuit breaker)
 * - Infinite-scrollable job application records from `applied_jobs`
 * - Full execution console logs from `tasks` collection with per-run inspection
 * 
 * PATCH /api/admin/candidate-logs
 * Superadmin controls to 1-click reset Naukri daily limit flag, reset circuit breaker, etc.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const userIdParam = (searchParams.get('user_id') || '').trim()
    if (!userIdParam) {
      return NextResponse.json({ detail: 'user_id query parameter is required.' }, { status: 400 })
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50', 10)))
    const statusFilter = (searchParams.get('status') || 'all').trim()
    const searchFilter = (searchParams.get('search') || '').trim()
    const taskIdParam = (searchParams.get('task_id') || '').trim()

    // 1. Fetch Candidate Profile
    const profile = await db.collection('profiles').findOne({ user_id: userIdParam }, { projection: { picture: 0 } }) ||
                    await db.collection('users').findOne({ user_id: userIdParam }, { projection: { picture: 0 } }) ||
                    await db.collection('profiles').findOne({ email: userIdParam.toLowerCase() }, { projection: { picture: 0 } }) ||
                    await db.collection('users').findOne({ email: userIdParam.toLowerCase() }, { projection: { picture: 0 } })

    if (!profile) {
      return NextResponse.json({ detail: `Candidate '${userIdParam}' not found.` }, { status: 404 })
    }

    const resolvedUserId = profile.user_id || userIdParam
    const email = (profile.email || '').toLowerCase()

    // 2. Date Boundaries (IST)
    const now = new Date()
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffsetMs)
    const todayIstStr = istNow.toISOString().slice(0, 10)
    const todayStartUtc = new Date(new Date(todayIstStr + 'T00:00:00+05:30').getTime())

    // 3. Count Today's Applications (Count ONLY verified applied/success, NEVER external redirects)
    const [todayCountFromRows, totalStatsDoc] = await Promise.all([
      db.collection('applied_jobs').countDocuments({
        $or: [{ user_id: resolvedUserId }, ...(email ? [{ user_email: email }, { email }] : [])],
        $and: [
          {
            $or: [
              { applied_date: todayIstStr },
              { applied_at: { $gte: todayStartUtc } }
            ]
          },
          { status: { $in: ['applied', 'success'] } }
        ]
      }),
      db.collection('user_stats').findOne({ user_id: resolvedUserId })
    ])

    const todayApplied = (totalStatsDoc?.last_date === todayIstStr && typeof totalStatsDoc?.today === 'number')
      ? totalStatsDoc.today
      : todayCountFromRows

    const totalAppliedCount = totalStatsDoc?.total_applied || profile.total_applied || (
      await db.collection('applied_jobs').countDocuments({
        $or: [{ user_id: resolvedUserId }, ...(email ? [{ user_email: email }, { email }] : [])]
      })
    )

    // 4. Fetch Paginated Job Application Records
    const jobQuery: any = {
      $or: [{ user_id: resolvedUserId }, ...(email ? [{ user_email: email }, { email }] : [])]
    }

    if (statusFilter && statusFilter !== 'all') {
      jobQuery.status = statusFilter
    }

    if (searchFilter) {
      jobQuery.$and = [
        {
          $or: [
            { job_title: { $regex: searchFilter, $options: 'i' } },
            { company: { $regex: searchFilter, $options: 'i' } },
            { location: { $regex: searchFilter, $options: 'i' } }
          ]
        }
      ]
    }

    const skip = (page - 1) * limit
    const [totalMatchingJobs, rawJobs] = await Promise.all([
      db.collection('applied_jobs').countDocuments(jobQuery),
      db.collection('applied_jobs')
        .find(jobQuery)
        .sort({ applied_at: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
    ])

    // Format jobs with IST timestamp
    const formattedJobs = rawJobs.map((doc: any) => {
      let formattedDate = ''
      let rawIso = ''
      if (doc.applied_at) {
        const d = new Date(doc.applied_at)
        if (!isNaN(d.getTime())) {
          rawIso = d.toISOString()
          try {
            const istFormatter = new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              dateStyle: 'medium',
              timeStyle: 'short'
            })
            formattedDate = istFormatter.format(d)
          } catch {
            formattedDate = rawIso
          }
        }
      }

      return {
        id: String(doc._id),
        job_title: doc.job_title || 'Unknown Role',
        company: doc.company || 'Confidential Hiring Partner',
        location: doc.location || 'Not Specified',
        job_url: doc.job_url || '',
        status: doc.status || 'applied',
        match_score: typeof doc.match_score === 'number' ? doc.match_score : 90,
        applied_at: formattedDate || rawIso || doc.applied_date || 'Recently',
        raw_applied_at: rawIso || doc.applied_at,
        task_id: doc.task_id || null
      }
    })

    // 5. Fetch Recent Automation Runs (Tasks)
    const recentTasks = await db.collection('tasks')
      .find({ user_id: resolvedUserId })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray()

    // Determine target task for full console logs
    let selectedTaskDoc = taskIdParam
      ? recentTasks.find((t: any) => t.task_id === taskIdParam)
      : recentTasks[0]

    // If specific task not found in top 20, fetch directly
    if (taskIdParam && !selectedTaskDoc) {
      selectedTaskDoc = await db.collection('tasks').findOne({ task_id: taskIdParam, user_id: resolvedUserId })
    }

    // Map tasks metadata for task selector
    const tasksMetadata = recentTasks.map((t: any) => ({
      task_id: t.task_id,
      source: t.source || 'daily_scheduled',
      status: t.status || 'completed',
      created_at: t.created_at || null,
      started_at: t.started_at || null,
      completed_at: t.completed_at || null,
      stats: t.stats || {},
      summary: t.summary || '',
      worker_host: t.worker_host || null,
      worker_device_brand: t.worker_device_brand || null,
      worker_hardware_model: t.worker_hardware_model || null,
      worker_id: t.worker_id || null,
      worker_pid: t.worker_pid || null,
      log_count: Array.isArray(t.logs) ? t.logs.length : 0
    }))

    // Extract logs from selected task
    const selectedTaskLogs = selectedTaskDoc && Array.isArray(selectedTaskDoc.logs)
      ? selectedTaskDoc.logs
      : []

    // 6. Intelligent Diagnostic Assessment
    const dailyLimit = Number(profile.daily_application_limit || 50)
    const isNaukriLimitHitToday = Boolean(
      (profile.naukri_daily_limit_reached && profile.naukri_daily_limit_date === todayIstStr) ||
      (selectedTaskDoc?.summary && selectedTaskDoc.summary.toLowerCase().includes('naukri platform daily'))
    )
    const naukriLimitReason = profile.naukri_daily_limit_reason ||
      'There was an error while processing your request, please try again later'

    const isCappedToday = todayApplied >= dailyLimit && dailyLimit > 0
    const isCircuitBreaker = Number(profile.naukri_login_fail_count || 0) >= 3 ||
      profile.last_automation_issue?.code === 'CIRCUIT_BREAKER_PAUSED'
    const isRunningNow = profile.current_execution?.status === 'running' ||
      recentTasks.some((t: any) => t.status === 'running')

    let diagnosticStatus: 'naukri_limit' | 'capped' | 'no_match' | 'circuit_breaker' | 'running' | 'paused' | 'ready' = 'ready'
    let headline = 'Automation In Standby / Scheduled'
    let explanation = `Candidate is scheduled for automated morning sweeps. Today applied: ${todayApplied}/${dailyLimit} jobs.`
    let remedy = 'Next scheduled sweep will trigger according to fleet schedule.'

    if (isRunningNow) {
      diagnosticStatus = 'running'
      headline = 'Automation Bot Is Currently Running'
      explanation = `Active Chromium worker (${profile.current_execution?.hostname || 'Fleet worker'}) is currently scanning listings and applying.`
      remedy = 'Real-time logs will update as the worker completes each application.'
    } else if (isCircuitBreaker) {
      diagnosticStatus = 'circuit_breaker'
      headline = 'Circuit Breaker Tripped (Login Failed)'
      explanation = `Automation auto-paused after ${profile.naukri_login_fail_count || 3} consecutive Naukri login errors to protect the account.`
      remedy = 'Verify Naukri credentials with candidate, then click "Reset Circuit Breaker" to re-enable sweeps.'
    } else if (isNaukriLimitHitToday) {
      diagnosticStatus = 'naukri_limit'
      headline = `Naukri Platform Daily Limit Hit (${todayApplied}/${dailyLimit} jobs applied)`
      explanation = `Naukri returned platform error toast ("${naukriLimitReason}") during application. Naukri enforces an account-level daily quota (typically 50 applies/day including manual applies). Bot paused sweeps to prevent account penalties.`
      remedy = 'Naukri resets quotas automatically at midnight (00:00 IST). Sweeps will resume tomorrow morning, or you can click "Reset Limit Flag" to retry now.'
    } else if (isCappedToday) {
      diagnosticStatus = 'capped'
      headline = `Daily Application Limit Reached (${todayApplied}/${dailyLimit} jobs applied)`
      explanation = `The candidate has reached their configured JobFlux AI daily limit (${dailyLimit} jobs) for today (${todayIstStr}).`
      remedy = 'Daily limit resets tonight at midnight IST. You can increase their daily limit if higher volume is desired.'
    } else if (profile.enabled_for_daily_run === false) {
      diagnosticStatus = 'paused'
      headline = 'Daily Automation Manually Disabled'
      explanation = 'Automated runs have been switched off for this candidate by administrator or user request.'
      remedy = 'Toggle "Auto-Apply" ON in Candidates tab to resume automated sweeps.'
    } else if (selectedTaskDoc && selectedTaskDoc.status === 'completed' && (selectedTaskDoc.stats?.applied === 0 || selectedTaskDoc.summary?.includes('0 matched'))) {
      diagnosticStatus = 'no_match'
      headline = `Zero Matching Jobs Found Today (${todayApplied}/${dailyLimit} applied)`
      explanation = 'The automation searched Naukri with candidate target roles and filters, but all scanned listings were filtered out (experience mismatch, excluded location, or blacklisted titles).'
      remedy = 'Review candidate experience settings, preferred locations, and target keywords to expand match pool.'
    }

    // 7. Fetch Candidate Screening Q&A Records
    const qaRecords = await db.collection('screening_qa_logs')
      .find({ user_id: resolvedUserId })
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()

    const formattedQa = qaRecords.map((q: any) => {
      let dateStr = ''
      if (q.created_at_ist) {
        dateStr = q.created_at_ist
      } else if (q.created_at) {
        try {
          dateStr = new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short'
          }).format(new Date(q.created_at))
        } catch {
          dateStr = String(q.created_at)
        }
      }
      return {
        id: String(q._id),
        question: q.question || '',
        answer: q.answer || '',
        source: q.source || 'ai',
        q_type: q.q_type || 'text',
        options: Array.isArray(q.options) ? q.options : [],
        job_title: q.job_title || '',
        company: q.company || '',
        confidence: typeof q.confidence === 'number' ? q.confidence : 1.0,
        applied_successfully: q.applied_successfully !== false,
        created_at: dateStr || 'Recently'
      }
    })

    const candidateObj = {
      user_id: resolvedUserId,
      name: profile.name || resolvedUserId,
      email: email || '',
      plan: profile.plan || 'trial',
      plan_name: profile.plan_name || profile.plan || 'Free Trial',
      daily_application_limit: dailyLimit,
      applied_today: todayApplied,
      total_applied: totalAppliedCount,
      enabled_for_daily_run: profile.enabled_for_daily_run !== false,
      naukri_daily_limit_reached: isNaukriLimitHitToday,
      naukri_daily_limit_date: profile.naukri_daily_limit_date || null,
      naukri_daily_limit_reason: profile.naukri_daily_limit_reason || null,
      naukri_login_fail_count: Number(profile.naukri_login_fail_count || 0),
      last_automation_issue: profile.last_automation_issue || null,
      current_execution: profile.current_execution || null
    }

    return NextResponse.json({
      status: 'success',
      candidate: candidateObj,
      profile: candidateObj,
      diagnostic: {
        status: diagnosticStatus,
        headline,
        explanation,
        remedy,
        today_date_ist: todayIstStr,
        today_applied: todayApplied,
        daily_limit: dailyLimit,
        is_naukri_limit_hit: isNaukriLimitHitToday,
        naukri_limit_reason: naukriLimitReason,
        is_capped: isCappedToday,
        is_circuit_breaker: isCircuitBreaker
      },
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total: totalMatchingJobs,
        has_more: skip + formattedJobs.length < totalMatchingJobs
      },
      tasks: tasksMetadata,
      selected_task_id: selectedTaskDoc?.task_id || null,
      selected_task_logs: selectedTaskLogs,
      qa_records: formattedQa
    })
  } catch (err: any) {
    console.error('Error in /api/admin/candidate-logs GET:', err)
    return NextResponse.json({ detail: err.message || 'Internal server error.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const userId = (body.user_id || '').trim()
    if (!userId) {
      return NextResponse.json({ detail: 'user_id is required.' }, { status: 400 })
    }

    const updates: Record<string, any> = {
      updated_at: new Date()
    }

    if (body.reset_naukri_limit === true) {
      updates.naukri_daily_limit_reached = false
      updates.naukri_daily_limit_date = null
      updates.naukri_daily_limit_reason = null
      updates.daily_status = 'ready'
    }

    if (body.reset_circuit_breaker === true) {
      updates.naukri_login_fail_count = 0
      updates.last_automation_issue = null
      updates.automation_status = 'ready'
      updates.enabled_for_daily_run = true
    }

    if (typeof body.daily_application_limit === 'number') {
      updates.daily_application_limit = Math.min(150, Math.max(1, body.daily_application_limit))
    }

    if (body.update_qa && body.update_qa.question && body.update_qa.answer) {
      const qText = String(body.update_qa.question).trim()
      const aText = String(body.update_qa.answer).trim()
      const crypto = await import('crypto')
      const qHash = crypto.createHash('md5').update(qText).digest('hex')
      const now = new Date()

      await db.collection('qa_cache').updateOne(
        { user_id: userId, question_hash: qHash },
        {
          $set: {
            user_id: userId,
            question_hash: qHash,
            question_text: qText,
            answer: aText,
            updated_at: now
          }
        },
        { upsert: true }
      )

      await db.collection('screening_qa_logs').insertOne({
        user_id: userId,
        question: qText,
        question_hash: qHash,
        answer: aText,
        source: 'manual_override',
        q_type: 'text',
        confidence: 1.0,
        applied_successfully: true,
        created_at: now,
        created_at_ist: new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short'
        }).format(now)
      })
    }

    await db.collection('profiles').updateOne({ user_id: userId }, { $set: updates })
    await db.collection('users').updateOne({ user_id: userId }, { $set: updates })

    return NextResponse.json({
      status: 'success',
      message: 'Candidate automation parameters updated successfully.',
      updates
    })
  } catch (err: any) {
    console.error('Error in /api/admin/candidate-logs PATCH:', err)
    return NextResponse.json({ detail: err.message || 'Failed to update candidate parameters.' }, { status: 500 })
  }
}
