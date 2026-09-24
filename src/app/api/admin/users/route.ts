import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { evaluateOfferEligibility } from '@/lib/offerEligibility'
import { isAdminUser } from '@/config/appConfig'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ users: [] })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const [userDocs, profileDocs, statsList, assignedOffersList, remindersList, activeTasks, orgDocs] = await Promise.all([
      db.collection('users').find({}).toArray(),
      db.collection('profiles').find({}).toArray(),
      db.collection('user_stats').find({}).toArray(),
      db.collection('assigned_offers').find({}).toArray(),
      db.collection('expiry_reminders_sent').find({}).toArray(),
      db.collection('tasks').find({ status: { $in: ['pending', 'running'] } }).sort({ created_at: -1 }).toArray(),
      db.collection('enterprise_orgs').find({}).toArray()
    ])

    const orgMapById = new Map<string, any>()
    const orgMapByAdminEmail = new Map<string, any>()
    orgDocs.forEach((o: any) => {
      if (o.org_id) orgMapById.set(o.org_id, o)
      if (o.admin_email) orgMapByAdminEmail.set(o.admin_email.toLowerCase().trim(), o)
    })

    // Build unified map of candidate profiles (merging users and profiles collections)
    const profileMap = new Map<string, any>()
    profileDocs.forEach(p => {
      if (p.user_id) profileMap.set(p.user_id, p)
    })
    const userMap = new Map<string, any>()
    userDocs.forEach(u => {
      if (u.user_id) userMap.set(u.user_id, u)
    })

    const allUserIds = Array.from(new Set([...Array.from(profileMap.keys()), ...Array.from(userMap.keys())]))
    const profiles = allUserIds.map(uid => {
      const uDoc = userMap.get(uid) || {}
      const pDoc = profileMap.get(uid) || {}
      // Never ship credentials to the admin table — support flows use /api/profile (owner/admin gated)
      delete uDoc.password
      delete pDoc.password
      return {
        ...uDoc,
        ...pDoc,
        current_execution: pDoc.current_execution || uDoc.current_execution || null,
        last_execution: pDoc.last_execution || uDoc.last_execution || null,
        last_automated_run_date: pDoc.last_automated_run_date || uDoc.last_automated_run_date || null,
        last_automated_run_at: pDoc.last_automated_run_at || uDoc.last_automated_run_at || null,
        daily_status: pDoc.daily_status || uDoc.daily_status || null,
        enabled_for_daily_run: pDoc.enabled_for_daily_run !== undefined ? pDoc.enabled_for_daily_run : (uDoc.enabled_for_daily_run !== undefined ? uDoc.enabled_for_daily_run : true)
      }
    })

    const activeTasksByUser: Record<string, any> = {}
    activeTasks.forEach(t => {
      if (t.user_id && !activeTasksByUser[t.user_id]) {
        activeTasksByUser[t.user_id] = t
      }
    })

    const now = new Date()
    // Current IST date (UTC + 5:30)
    const istOffsetMs = 5.5 * 60 * 60 * 1000
    const istNow = new Date(now.getTime() + istOffsetMs)
    const todayIst = istNow.toISOString().slice(0, 10)

    const statsMap: Record<string, any> = {}
    statsList.forEach(s => {
      statsMap[s.user_id] = s
    })

    const offersByEmail: Record<string, any[]> = {}
    assignedOffersList.forEach(o => {
      const em = (o.candidate_email || '').toLowerCase().trim()
      if (!offersByEmail[em]) offersByEmail[em] = []
      const exp = o.expires_at ? new Date(o.expires_at) : null
      const isExp = exp ? now > exp : false
      offersByEmail[em].push({
        id: o._id.toString(),
        promo_code: o.promo_code,
        offer_title: o.offer_title,
        discount_badge: o.discount_badge,
        discounted_price: o.discounted_price,
        claimed: Boolean(o.claimed),
        expires_at: o.expires_at || null,
        is_expired: isExp,
        hours_left: exp && !isExp ? Math.round((exp.getTime() - now.getTime()) / 3600000) : 0,
        revoked: Boolean(o.revoked)
      })
    })

    const remindersByEmail: Record<string, any[]> = {}
    remindersList.forEach(r => {
      const em = (r.email || '').toLowerCase().trim()
      if (!remindersByEmail[em]) remindersByEmail[em] = []
      remindersByEmail[em].push({
        type: r.reminder_type,
        title: r.title,
        created_at: r.created_at,
        channels: r.channels
      })
    })

    const users = profiles.map(p => {
      const s = statsMap[p.user_id] || {}
      const emailClean = (p.email || '').toLowerCase().trim()
      const isAdminAccount = isAdminUser(p.email) || isAdminUser(p.user_id) || p.role === 'admin' || emailClean === 'technohmsit@gmail.com' || p.user_id === 'technohmsit'
      const assignedOrg = orgMapByAdminEmail.get(emailClean) || (p.enterprise_org_id ? orgMapById.get(p.enterprise_org_id) : null)
      const isOrgAdmin = Boolean(
        !isAdminAccount && (
          p.role === 'enterprise_admin' ||
          p.enterprise_role === 'admin' ||
          p.is_org_admin_only ||
          assignedOrg?.admin_email?.toLowerCase() === emailClean ||
          emailClean === 'ranganathat32@gmail.com' ||
          emailClean === 'koushiksrmedala@gmail.com'
        )
      )
      const rawExp = p.plan_expires_at || p.trial_expires_at || null
      const isVip = Boolean(isAdminAccount || p.is_vip || p.vip_access || p.free_privilege || p.plan === 'vip')
      const planClean = (p.plan || 'trial').toLowerCase()
      const isNoPlan = planClean === 'none' || planClean === 'no_plan'

      let planExpiryStatus: 'active' | 'expiring_soon_2d' | 'expiring_soon_1d' | 'expired' | 'no_expiry' | 'vip_lifetime' | 'no_plan' | 'admin' | 'org_admin' = 'no_expiry'
      let planHoursLeft: number | null = null

      if (isAdminAccount) {
        planExpiryStatus = 'admin'
      } else if (isOrgAdmin) {
        planExpiryStatus = 'org_admin'
      } else if (isVip) {
        planExpiryStatus = 'vip_lifetime'
      } else if (isNoPlan) {
        planExpiryStatus = 'no_plan'
      } else if (rawExp) {
        const expDate = new Date(rawExp)
        planHoursLeft = Math.round((expDate.getTime() - now.getTime()) / 3600000)
        if (planHoursLeft <= 0) {
          planExpiryStatus = 'expired'
        } else if (planHoursLeft <= 24) {
          planExpiryStatus = 'expiring_soon_1d'
        } else if (planHoursLeft <= 48) {
          planExpiryStatus = 'expiring_soon_2d'
        } else {
          planExpiryStatus = 'active'
        }
      } else {
        planExpiryStatus = 'no_expiry'
      }

      const userOffers = offersByEmail[emailClean] || []
      const userReminders = remindersByEmail[emailClean] || []

      // Multi-Server Execution & Device Identity Resolution
      const curExec = p.current_execution || {}
      const lastExec = p.last_execution || {}
      const activeTask = activeTasksByUser[p.user_id] || null

      let isApplying = false
      let executionDevice = curExec.hostname || curExec.worker_id || null
      let executionWorkerId = curExec.worker_id || null
      let executionPlatform = curExec.platform || null
      let taskId = curExec.task_id || activeTask?.task_id || null

      if (curExec.status === 'applying') {
        const hb = curExec.heartbeat_at || curExec.locked_at
        if (hb) {
          const hbDate = new Date(hb)
          const diffMinutes = (now.getTime() - hbDate.getTime()) / 60000
          if (diffMinutes < 15) {
            isApplying = true
          }
        } else {
          isApplying = true
        }
      }

      if (activeTask && activeTask.status === 'running') {
        isApplying = true
        if (!executionDevice && (activeTask.worker_host || activeTask.worker_id)) {
          executionDevice = activeTask.worker_host || activeTask.worker_id
          executionWorkerId = activeTask.worker_id
        }
      }

      // Strict IST Today Data Isolation: Only count applications if the run or stats occurred TODAY in IST
      const isRunToday = p.last_automated_run_date === todayIst || p.daily_status === `completed_${todayIst}`
      const isStatsToday = s.last_date === todayIst
      const realTodayApplied = isStatsToday ? (s.today || 0) : 0
      const isAppliedToday = !isApplying && (isRunToday || (isStatsToday && realTodayApplied > 0))

      if (isAppliedToday && !executionDevice) {
        executionDevice = lastExec.hostname || curExec.last_hostname || lastExec.worker_id || curExec.last_worker_id || null
        executionWorkerId = lastExec.worker_id || curExec.last_worker_id || null
        executionPlatform = lastExec.platform || curExec.last_platform || null
      }

      const isInQueue = !isApplying && !isAppliedToday && Boolean(activeTask && activeTask.status === 'pending')

      let executionStatus: 'applying' | 'applied_today' | 'in_queue' | 'not_applied_today' | 'disabled' | 'payment_required' | 'admin' | 'org_admin' = 'not_applied_today'
      if (isAdminAccount) {
        executionStatus = 'admin'
      } else if (isOrgAdmin) {
        executionStatus = 'org_admin'
      } else if (isApplying) {
        executionStatus = 'applying'
      } else if (isInQueue) {
        executionStatus = 'in_queue'
      } else if (isAppliedToday) {
        executionStatus = 'applied_today'
      } else if (p.enabled_for_daily_run === false) {
        executionStatus = 'disabled'
      } else if (planExpiryStatus === 'expired' || planExpiryStatus === 'no_plan') {
        executionStatus = 'payment_required'
      } else {
        executionStatus = 'not_applied_today'
      }

      const deviceBrand = curExec.device_brand || lastExec.device_brand || curExec.last_device_brand || activeTask?.worker_device_brand || (executionPlatform?.includes('Darwin') ? 'Apple Mac' : (executionPlatform?.includes('Windows') ? 'Windows PC' : (executionPlatform ? 'Linux Server' : null)))
      const hardwareModel = curExec.hardware_model || lastExec.hardware_model || curExec.last_hardware_model || activeTask?.worker_hardware_model || deviceBrand || null
      const macAddress = curExec.mac_address || lastExec.mac_address || curExec.last_mac_address || activeTask?.worker_mac_address || null
      const pidVal = curExec.pid || lastExec.pid || curExec.last_pid || activeTask?.worker_pid || null

      const executionSummary = {
        status: executionStatus,
        is_applying: isApplying,
        is_applied_today: isAppliedToday,
        is_in_queue: isInQueue,
        device: executionDevice,
        hostname: curExec.hostname || lastExec.hostname || curExec.last_hostname || activeTask?.worker_host || null,
        device_brand: deviceBrand,
        hardware_model: hardwareModel,
        mac_address: macAddress,
        worker_id: executionWorkerId,
        platform: executionPlatform,
        pid: pidVal,
        last_run_date: p.last_automated_run_date || lastExec.date_ist || null,
        last_completed_at: p.last_automated_run_at || lastExec.completed_at || null,
        locked_at: curExec.locked_at || null,
        task_id: taskId,
        source: curExec.source || lastExec.source || (activeTask ? 'queue' : null)
      }

      const isOrgMemberCandidate = Boolean(assignedOrg?.org_id || p.enterprise_org_id || p.enterprise_role === 'member')
      const effectiveCandidatePlan = (isOrgMemberCandidate && (planClean === 'pro' || planClean === 'org_pro'))
        ? 'org_pro'
        : (isOrgMemberCandidate && planClean === 'enterprise')
        ? 'enterprise'
        : planClean

      // Default daily limit based on plan or custom override (55 min for Org, 150 max for Elite/VIP/Enterprise)
      const defaultLimit = (isVip || ['elite', 'professional', 'enterprise', 'org_pro', 'vip'].includes(effectiveCandidatePlan))
        ? (isOrgMemberCandidate ? 55 : 150)
        : (effectiveCandidatePlan === 'pro' ? 50 : 20)
      const dailyApplicationLimit = (isAdminAccount || isOrgAdmin) 
        ? 0 
        : isOrgMemberCandidate
        ? Math.max(55, Number(p.daily_application_limit) || 55)
        : (p.daily_application_limit ? Math.min(150, Math.max(1, Number(p.daily_application_limit))) : defaultLimit)

      return {
        id: p.user_id,
        user_id: p.user_id,
        name: p.name || p.user_id.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        email: p.email || '',
        is_admin: isAdminAccount,
        is_org_admin: isOrgAdmin,
        is_org_admin_only: Boolean(p.is_org_admin_only || isOrgAdmin),
        org_id: assignedOrg?.org_id || p.enterprise_org_id || null,
        org_name: assignedOrg?.name || (isOrgAdmin ? 'Enterprise Org' : null),
        role: isAdminAccount ? 'admin' : (isOrgAdmin ? 'enterprise_admin' : (p.role || 'user')),
        enterprise_role: isOrgAdmin ? 'admin' : (p.enterprise_role || null),
        enterprise_org_id: assignedOrg?.org_id || p.enterprise_org_id || null,
        experience: p.experience || 0,
        current_ctc: p.current_ctc || 0,
        expected_ctc: p.expected_ctc || 0,
        enabled_for_daily_run: (isAdminAccount || isOrgAdmin) ? false : (p.enabled_for_daily_run !== false),
        plan: isAdminAccount ? 'admin' : (isOrgAdmin ? 'org_admin' : effectiveCandidatePlan),
        plan_name: isAdminAccount
          ? 'Master Administrator (No Plan Required)'
          : isOrgAdmin
          ? `Org Admin • ${assignedOrg?.name || 'Enterprise Org'}`
          : (effectiveCandidatePlan === 'org_pro'
              ? 'JobFlux Org Pro'
              : effectiveCandidatePlan === 'enterprise'
              ? 'Enterprise Member (Org Cover)'
              : (p.plan_name || (p.plan ? `JobFlux ${p.plan.toUpperCase()}` : '3-Day Free Access'))),
        plan_expires_at: (isAdminAccount || isOrgAdmin) ? null : rawExp,
        trial_expires_at: (isAdminAccount || isOrgAdmin) ? null : (p.trial_expires_at || null),
        plan_expiry_status: planExpiryStatus,
        plan_hours_left: (isAdminAccount || isOrgAdmin) ? null : planHoursLeft,
        hours_until_expiry: (isAdminAccount || isOrgAdmin) ? null : planHoursLeft,
        offer_eligibility: (isAdminAccount || isOrgAdmin)
          ? { is_eligible: false, reason: isOrgAdmin ? 'Organization Administrator account' : 'Administrator account' }
          : evaluateOfferEligibility(p),
        assigned_offers: (isAdminAccount || isOrgAdmin) ? [] : userOffers,
        reminders_sent: (isAdminAccount || isOrgAdmin) ? [] : userReminders,
        is_vip: Boolean(p.is_vip || p.vip_access || p.free_privilege),
        total_applied: s.total_applied || 0,
        applied_today: isAppliedToday ? realTodayApplied : 0,
        daily_application_limit: dailyApplicationLimit,
        applied_this_week: s.this_week || 0,
        applied_this_month: s.this_month || 0,
        last_active: s.last_applied_at || p.updated_at || null,
        login_count: p.login_count || 0,
        last_login_at: p.last_login_at || null,
        last_login_ip: p.last_login_ip || null,
        profile_update_count: p.profile_update_count || 0,
        last_profile_updated_at: p.last_profile_updated_at || p.updated_at || null,
        resume_upload_count: p.resume_upload_count || 0,
        last_resume_updated_at: p.last_resume_updated_at || null,
        resume_filename: p.resume_filename || null,
        on_demand_run_count: p.on_demand_run_count || 0,
        last_scout_run_at: p.last_scout_run_at || null,
        last_automated_run_date: p.last_automated_run_date || null,
        daily_status: p.daily_status || null,
        current_execution: p.current_execution || null,
        last_execution: p.last_execution || null,
        execution_summary: executionSummary
      }
    })

    const executionCounts = {
      all: users.length,
      applying: users.filter(u => u.execution_summary?.status === 'applying').length,
      applied_today: users.filter(u => u.execution_summary?.status === 'applied_today').length,
      in_queue: users.filter(u => u.execution_summary?.status === 'in_queue').length,
      not_applied_today: users.filter(u => !u.is_admin && !u.is_org_admin && u.execution_summary?.status === 'not_applied_today').length,
      disabled: users.filter(u => !u.is_admin && !u.is_org_admin && u.execution_summary?.status === 'disabled').length,
      payment_required: users.filter(u => !u.is_admin && !u.is_org_admin && u.execution_summary?.status === 'payment_required').length
    }

    return NextResponse.json({
      users,
      today_ist: todayIst,
      execution_counts: executionCounts
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { user_id, is_vip, plan, enabled_for_daily_run, extend_days, daily_application_limit } = body

    if (!user_id) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const now = new Date()
    const updates: any = { updated_at: now }

    if (daily_application_limit !== undefined && daily_application_limit !== null) {
      updates.daily_application_limit = Math.min(150, Math.max(1, Number(daily_application_limit)))
    }

    if (typeof is_vip === 'boolean') {
      updates.is_vip = is_vip
      updates.vip_access = is_vip
      updates.free_privilege = is_vip
      if (is_vip && updates.daily_application_limit === undefined) {
        updates.daily_application_limit = 150
      }
    }
    if (typeof enabled_for_daily_run === 'boolean') {
      updates.enabled_for_daily_run = enabled_for_daily_run
    }
    if (plan) {
      const existingUser = await db.collection('profiles').findOne({ user_id }) ||
                           await db.collection('users').findOne({ user_id })
      const isOrgUser = Boolean(
        existingUser?.enterprise_org_id ||
        existingUser?.org_id ||
        existingUser?.enterprise_role === 'member' ||
        existingUser?.plan === 'enterprise' ||
        existingUser?.plan === 'org_pro'
      )

      let targetPlan = plan
      if (isOrgUser && (targetPlan === 'pro' || targetPlan === 'starter')) {
        targetPlan = 'org_pro'
      }

      updates.plan = targetPlan
      updates.plan_activated_at = now
      if (targetPlan === 'vip') {
        const days = extend_days || 90
        updates.plan_name = 'JobFlux VIP Professional (90d)'
        updates.is_vip = true
        updates.vip_access = true
        updates.free_privilege = true
        updates.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        if (updates.daily_application_limit === undefined) updates.daily_application_limit = 150
      } else if (targetPlan === 'elite' || targetPlan === 'professional') {
        const days = extend_days || 90
        updates.plan_name = 'JobFlux PROFESSIONAL'
        updates.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        if (updates.daily_application_limit === undefined) updates.daily_application_limit = 150
      } else if (targetPlan === 'org_pro') {
        const days = extend_days || 30
        updates.plan = 'org_pro'
        updates.plan_name = 'JobFlux Org Pro — Member Upgrade (30 Days)'
        updates.enterprise_role = 'member'
        updates.enabled_for_daily_run = true
        updates.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        updates.trial_expires_at = null
        if (updates.daily_application_limit === undefined || updates.daily_application_limit < 55) {
          updates.daily_application_limit = 55
        }
      } else if (targetPlan === 'enterprise') {
        updates.plan = 'enterprise'
        updates.plan_name = 'Enterprise Member (Org Cover)'
        updates.enterprise_role = 'member'
        updates.enabled_for_daily_run = true
        updates.plan_expires_at = null
        updates.trial_expires_at = null
        if (updates.daily_application_limit === undefined || updates.daily_application_limit < 55) {
          updates.daily_application_limit = 55
        }
      } else if (targetPlan === 'pro' || targetPlan === 'starter') {
        const days = extend_days || 30
        updates.plan_name = 'JobFlux PRO'
        updates.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
        if (updates.daily_application_limit === undefined) updates.daily_application_limit = 50
      } else if (targetPlan === 'trial') {
        updates.plan_name = 'JobFlux 3-Day Free Access'
        updates.trial_started_at = now
        updates.trial_expires_at = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        updates.plan_expires_at = null
        updates.is_vip = false
        updates.vip_access = false
        updates.free_privilege = false
        if (updates.daily_application_limit === undefined) updates.daily_application_limit = 20
      } else if (targetPlan === 'none' || targetPlan === 'no_plan') {
        updates.plan = 'none'
        updates.plan_name = 'No Active Plan'
        updates.plan_expires_at = null
        updates.trial_expires_at = null
        updates.enabled_for_daily_run = false
        updates.is_vip = false
        updates.vip_access = false
        updates.free_privilege = false
      }
    }

    await db.collection('profiles').updateOne(
      { user_id },
      { $set: updates }
    )
    await db.collection('users').updateOne(
      { user_id },
      { $set: updates }
    )

    return NextResponse.json({
      success: true,
      message: `Candidate plan updated to ${plan || 'custom'} successfully`,
      updates
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
