import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { readSession } from '@/lib/session'
import { isSessionRevoked } from '@/lib/sessionRegistry'
import { exactMatchCI } from '@/lib/query'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export interface AutomationIssue {
  code: 'CREDS_MISSING' | 'CREDS_INVALID' | 'RESUME_MISSING' | 'CIRCUIT_BREAKER_PAUSED' | 'DAILY_RUN_DISABLED' | 'NAUKRI_LIMIT_REACHED'
  severity: 'critical' | 'warning' | 'info'
  title: string
  message: string
  description: string
  quick_fix_type: 'credentials' | 'resume' | 'enable_daily_run' | 'credentials_and_re_enable' | 'info'
  occurred_at?: string | null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = (searchParams.get('user_id') || '').trim()
    const email = (searchParams.get('email') || '').trim().toLowerCase()

    if (!userId && !email) {
      return NextResponse.json({ detail: 'user_id or email is required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const profile = (userId ? await db.collection('profiles').findOne({ user_id: userId }) : null)
      || (email ? await db.collection('profiles').findOne({ email: exactMatchCI(email) }) : null)
      || (userId ? await db.collection('users').findOne({ user_id: userId }) : null)

    if (!profile) {
      return NextResponse.json({ detail: 'Candidate profile not found' }, { status: 404 })
    }

    // Ownership or admin check
    const sess = await readSession(req)
    if (sess && (await isSessionRevoked(sess))) {
      return NextResponse.json({ detail: 'Session revoked. Please sign in again.' }, { status: 401 })
    }
    const isOwner = sess && (sess.uid === profile.user_id || sess.uid === userId)
    if (!isOwner && sess?.role !== 'admin') {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    const todayIst = istNow.toISOString().slice(0, 10)

    const rawPassword = profile.password || ''
    const hasPassword = Boolean(rawPassword && rawPassword.trim().length > 0)
    const hasResume = Boolean(profile.has_resume || profile.last_resume_updated_at || (profile.resume_upload_count && profile.resume_upload_count > 0))
    const failCount = Number(profile.naukri_login_fail_count || 0)
    const enabledForDailyRun = profile.enabled_for_daily_run !== false
    const lastIssue = profile.last_automation_issue || null
    const limitReached = Boolean(profile.naukri_daily_limit_reached && profile.naukri_daily_limit_date === todayIst)

    const issues: AutomationIssue[] = []

    // 1. Missing Naukri Password / Credentials
    if (!hasPassword) {
      issues.push({
        code: 'CREDS_MISSING',
        severity: 'critical',
        title: 'Naukri Password Missing',
        message: 'Your automation cannot run because your Naukri account password is not configured in JobFlux.',
        description: 'Autonomous sweeps log into Naukri to search matching openings and submit applications. Save your Naukri password below to start applying.',
        quick_fix_type: 'credentials',
        occurred_at: lastIssue?.code === 'CREDS_MISSING' ? (lastIssue.occurred_at ? new Date(lastIssue.occurred_at).toISOString() : null) : null
      })
    }

    // 2. Circuit Breaker Paused (3 consecutive login failures)
    const isCircuitBreaker = (!enabledForDailyRun && failCount >= 3) || lastIssue?.code === 'CIRCUIT_BREAKER_PAUSED'
    if (isCircuitBreaker) {
      issues.push({
        code: 'CIRCUIT_BREAKER_PAUSED',
        severity: 'critical',
        title: 'Automation Paused: Circuit Breaker Tripped',
        message: `Daily sweeps were auto-paused after ${failCount || 3} consecutive login failures to protect your Naukri account.`,
        description: 'Your saved Naukri Email or Password was rejected by Naukri. Update your credentials below and 1-click re-enable daily runs.',
        quick_fix_type: 'credentials_and_re_enable',
        occurred_at: lastIssue?.occurred_at ? new Date(lastIssue.occurred_at).toISOString() : null
      })
    } else if (hasPassword && (failCount > 0 || lastIssue?.code === 'CREDS_INVALID')) {
      // 3. Credentials Failing (1 or 2 failures)
      issues.push({
        code: 'CREDS_INVALID',
        severity: 'critical',
        title: 'Naukri Login Failed (Invalid Credentials)',
        message: `Naukri rejected your saved credentials (${failCount > 0 ? `${failCount}/3 failed attempts` : 'login authentication failed'}).`,
        description: 'Please verify your Naukri Email ID and Password below. If your Naukri account requires an OTP or Captcha, logging in once on naukri.com may also help.',
        quick_fix_type: 'credentials',
        occurred_at: lastIssue?.occurred_at ? new Date(lastIssue.occurred_at).toISOString() : null
      })
    }

    // 4. Missing Resume PDF
    if (!hasResume) {
      issues.push({
        code: 'RESUME_MISSING',
        severity: 'critical',
        title: 'ATS Resume PDF Missing',
        message: 'No resume PDF found on your JobFlux account.',
        description: 'Autonomous job applications require an ATS-formatted resume PDF to attach to job applications. Upload your resume below to activate applications.',
        quick_fix_type: 'resume',
        occurred_at: lastIssue?.code === 'RESUME_MISSING' ? (lastIssue.occurred_at ? new Date(lastIssue.occurred_at).toISOString() : null) : null
      })
    }

    // 5. Daily Runs Paused Manually (and not circuit breaker)
    if (!enabledForDailyRun && !isCircuitBreaker) {
      issues.push({
        code: 'DAILY_RUN_DISABLED',
        severity: 'warning',
        title: 'Daily Auto-Apply is Paused',
        message: 'Daily morning application sweeps are currently paused in your settings.',
        description: 'Your bot is on standby. Re-enable daily runs below whenever you want morning sweeps to resume.',
        quick_fix_type: 'enable_daily_run',
        occurred_at: null
      })
    }

    // 6. Naukri Platform 50 Daily Limit
    if (limitReached) {
      issues.push({
        code: 'NAUKRI_LIMIT_REACHED',
        severity: 'info',
        title: 'Naukri 50-Application Daily Platform Cap Reached',
        message: profile.naukri_daily_limit_reason || 'Naukri limits each account to 50 applies/day. Resets tonight at midnight IST.',
        description: 'Your profile and credentials are fully valid. Morning sweeps will automatically resume tomorrow.',
        quick_fix_type: 'info',
        occurred_at: profile.naukri_daily_limit_date || null
      })
    }

    const hasCriticalBlocker = issues.some(i => i.severity === 'critical')
    const needsAttention = issues.length > 0 && issues.some(i => i.severity === 'critical' || i.severity === 'warning')
    const overallSeverity = hasCriticalBlocker ? 'critical' : issues.some(i => i.severity === 'warning') ? 'warning' : issues.length > 0 ? 'info' : 'healthy'
    const primaryIssue = issues.find(i => i.severity === 'critical') || issues[0] || null

    return NextResponse.json({
      status: 'success',
      needs_attention: needsAttention,
      has_critical_blocker: hasCriticalBlocker,
      severity: overallSeverity,
      primary_issue: primaryIssue,
      issues,
      profile_status: {
        user_id: profile.user_id,
        has_credentials: hasPassword,
        naukri_email: profile.email || '',
        has_resume: hasResume,
        resume_filename: profile.resume_filename || '',
        enabled_for_daily_run: enabledForDailyRun,
        naukri_login_fail_count: failCount,
        automation_status: profile.automation_status || 'ready',
        naukri_daily_limit_reached: limitReached,
        naukri_daily_limit_date: profile.naukri_daily_limit_date || null
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, user_id, email, password, enabled_for_daily_run } = body

    if (!user_id) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    // Ownership or admin check
    const sess = await readSession(req)
    if (sess && (await isSessionRevoked(sess))) {
      return NextResponse.json({ detail: 'Session revoked. Please sign in again.' }, { status: 401 })
    }
    const isOwner = sess && (sess.uid === user_id)
    if (!isOwner && sess?.role !== 'admin') {
      return NextResponse.json({ detail: 'Forbidden' }, { status: 403 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const now = new Date()
    const existing = await db.collection('profiles').findOne({ user_id })
    const { ip, userAgent } = getClientInfo(req)

    if (action === 'update_credentials') {
      if (!password || typeof password !== 'string' || password.trim().length === 0) {
        return NextResponse.json({ detail: 'Password cannot be blank' }, { status: 400 })
      }

      const updateFields: any = {
        password: password.trim(),
        naukri_login_fail_count: 0,
        last_automation_issue: null,
        automation_status: 'ready',
        updated_at: now
      }

      if (email && typeof email === 'string' && email.trim().length > 0) {
        updateFields.email = email.trim()
      }

      // If daily runs were paused due to circuit breaker, automatically unpause now that credentials are updated
      if (existing?.enabled_for_daily_run === false && (existing?.naukri_login_fail_count >= 3 || existing?.last_automation_issue?.code === 'CIRCUIT_BREAKER_PAUSED')) {
        updateFields.enabled_for_daily_run = true
      }

      await db.collection('profiles').updateOne({ user_id }, { $set: updateFields })
      await db.collection('users').updateOne({ user_id }, { $set: updateFields })

      // Invalidate sessions on password change
      if (password !== existing?.password) {
        await db.collection('profiles').updateMany({ user_id }, { $inc: { session_v: 1 } })
        await db.collection('users').updateMany({ user_id }, { $inc: { session_v: 1 } })
      }

      // Queue background snapshot task to verify login and cache profile fields
      let snapshotQueued = false
      try {
        const pending = await db.collection('tasks').findOne({
          user_id,
          action: 'naukri_snapshot',
          status: { $in: ['pending', 'running'] }
        })
        if (!pending) {
          await db.collection('tasks').insertOne({
            task_id: `task_${user_id}_snapshot_${now.getTime()}`,
            user_id,
            action: 'naukri_snapshot',
            status: 'pending',
            headless: false,
            source: 'snapshot_request',
            triggered_by: 'automation_modal_fix',
            date_ist: '',
            created_at: now,
            logs: [`[${now.toLocaleTimeString()}] Snapshot queued after updating credentials in diagnostic modal.`]
          })
          snapshotQueued = true
        }
      } catch {}

      await logUserActivity(db, {
        userId: user_id,
        email: updateFields.email || existing?.email,
        eventType: 'profile_update',
        description: 'Candidate updated Naukri credentials via Automation Diagnostic Modal',
        ipAddress: ip,
        userAgent: userAgent
      })

      return NextResponse.json({
        status: 'success',
        message: 'Naukri credentials updated and automation blockers cleared.',
        snapshot_queued: snapshotQueued
      })
    }

    if (action === 're_enable_daily_run') {
      const updateFields = {
        enabled_for_daily_run: true,
        naukri_login_fail_count: 0,
        last_automation_issue: null,
        automation_status: 'ready',
        updated_at: now
      }

      await db.collection('profiles').updateOne({ user_id }, { $set: updateFields })
      await db.collection('users').updateOne({ user_id }, { $set: updateFields })

      await logUserActivity(db, {
        userId: user_id,
        email: existing?.email,
        eventType: 'profile_update',
        description: 'Candidate re-enabled daily automated runs via Automation Diagnostic Modal',
        ipAddress: ip,
        userAgent: userAgent
      })

      return NextResponse.json({
        status: 'success',
        message: 'Daily automated applications re-enabled.'
      })
    }

    if (action === 'clear_issue') {
      const updateFields = {
        naukri_login_fail_count: 0,
        last_automation_issue: null,
        automation_status: 'ready',
        updated_at: now
      }

      await db.collection('profiles').updateOne({ user_id }, { $set: updateFields })
      await db.collection('users').updateOne({ user_id }, { $set: updateFields })

      return NextResponse.json({
        status: 'success',
        message: 'Automation issue cleared.'
      })
    }

    return NextResponse.json({ detail: `Unknown action '${action}'` }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
