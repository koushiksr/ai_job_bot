import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import crypto from 'crypto'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { readSession } from '@/lib/session'
import { isSessionRevoked } from '@/lib/sessionRegistry'

/**
 * Ownership gate: the caller must be the profile owner (session uid matches)
 * or a super-admin. Everything in this file returns or mutates sensitive
 * data (including Naukri credentials), so anonymous access is forbidden.
 */
async function isSelfOrAdmin(req: NextRequest, userId: string): Promise<boolean> {
  const sess = readSession(req)
  if (!sess) return false
  if (await isSessionRevoked(sess)) return false
  if (sess.uid === userId) return true
  if (sess.role === 'admin') return true
  return false
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }
    if (!(await isSelfOrAdmin(req, userId))) {
      return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })
    }

    const ifNoneMatch = req.headers.get('if-none-match')

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const profile = await db.collection('profiles').findOne({ user_id: userId })
    if (!profile) {
      return NextResponse.json({ detail: 'Profile not found' }, { status: 404 })
    }

    const versionHash = profile.version_hash || crypto.createHash('sha256').update(JSON.stringify(profile)).digest('hex').substring(0, 16)

    // 304 Not Modified Caching
    if (ifNoneMatch && ifNoneMatch === `"${versionHash}"`) {
      return new NextResponse(null, { status: 304 })
    }

    if (!profile.job_filters) {
      profile.job_filters = {}
    }
    if (!profile.job_filters.avoid_companies) {
      profile.job_filters.avoid_companies = []
    }

    const rawPlan = (profile.plan || 'trial').toLowerCase()
    const now = new Date()
    let verifiedPlan = 'trial'
    let verifiedPlanName = 'JobFlux 3-Day Free Access'
    let isPlanActive = true

    const isOrgMember = Boolean(
      profile.enterprise_role === 'member' ||
      profile.enterprise_org_id ||
      profile.org_id ||
      ['enterprise', 'org_starter', 'org_pro', 'org_pro_3m'].includes(rawPlan)
    )

    if (isOrgMember) {
      // Organization members NEVER have free trial.
      // If they have not paid anything, they cannot apply to even one job (0 applies/day).
      const orgExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      const isExpired = orgExpires ? orgExpires <= now : false
      const isPlanValid = orgExpires ? orgExpires > now : false
      const isOrgVip = Boolean(profile.is_vip || profile.vip_access || profile.free_privilege || rawPlan === 'vip' || profile.granted_by_super_admin)

      if (isExpired) {
        // Expired after 30/90 days
        verifiedPlan = 'unpaid'
        verifiedPlanName = 'Plan Expired (Org Member)'
        isPlanActive = false
      } else if (isOrgVip && (isPlanValid || !orgExpires)) {
        verifiedPlan = 'org_pro'
        verifiedPlanName = profile.plan_name || 'JobFlux Org Pro (Privilege)'
        isPlanActive = true
      } else if (isPlanValid) {
        if (rawPlan === 'org_starter' || rawPlan === 'starter') {
          verifiedPlan = 'org_starter'
          verifiedPlanName = 'JobFlux Org Starter (20/d)'
          isPlanActive = true
        } else if (rawPlan === 'org_pro_3m') {
          verifiedPlan = 'org_pro_3m'
          verifiedPlanName = 'JobFlux Org Pro (3 Months · 55/d)'
          isPlanActive = true
        } else {
          verifiedPlan = 'org_pro'
          verifiedPlanName = 'JobFlux Org Pro (55/d)'
          isPlanActive = true
        }
      } else {
        // Unpaid or expired org member -> payment required, 0 applications allowed
        verifiedPlan = 'unpaid'
        verifiedPlanName = 'Payment Required (Org Member)'
        isPlanActive = false
      }
    } else if (rawPlan === 'none' || rawPlan === 'no_plan') {
      verifiedPlan = 'none'
      verifiedPlanName = 'No Active Plan'
      isPlanActive = false
    } else if (rawPlan === 'vip') {
      verifiedPlan = 'vip'
      verifiedPlanName = 'JobFlux VIP Elite'
      isPlanActive = true
    } else if (rawPlan !== 'trial') {
      const planExpires = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
      if (planExpires && planExpires > now) {
        verifiedPlan = rawPlan
        verifiedPlanName = profile.plan_name || `JobFlux ${rawPlan.toUpperCase()}`
        isPlanActive = true
      } else {
        // Expired or unverified paid plan
        verifiedPlan = 'none'
        verifiedPlanName = 'Plan Expired (No Active Plan)'
        isPlanActive = false
      }
    } else {
      const trialExpires = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null
      isPlanActive = trialExpires ? trialExpires > now : true
      if (!isPlanActive) {
        verifiedPlan = 'none'
        verifiedPlanName = 'Free Trial Expired (No Active Plan)'
      }
    }

    const calculatedDailyLimit = isOrgMember
      ? (!isPlanActive ? 0 : verifiedPlan === 'org_starter' ? 20 : 55)
      : (!isPlanActive ? 0 : verifiedPlan === 'trial' ? 10 : verifiedPlan === 'starter' ? 20 : 55)

    const responseData = {
      user_id: profile.user_id,
      name: profile.name || '',
      email: profile.email || '',
      password: profile.password || '',
      role: profile.role || 'user',
      plan: verifiedPlan,
      plan_name: verifiedPlanName,
      raw_plan: rawPlan,
      is_plan_active: isPlanActive,
      enterprise_org_id: profile.enterprise_org_id || null,
      enterprise_role: profile.enterprise_role || null,
      enterprise_status: profile.enterprise_status || 'active',
      plan_activated_at: profile.plan_activated_at || null,
      plan_expires_at: profile.plan_expires_at || null,
      trial_started_at: isOrgMember ? null : (profile.trial_started_at || null),
      trial_expires_at: isOrgMember ? null : (profile.trial_expires_at || null),
      is_vip: Boolean(profile.is_vip || profile.vip_access),
      last_payment_id: profile.last_payment_id || null,
      experience: profile.experience || 0,
      current_ctc: profile.current_ctc || 0,
      expected_ctc: profile.expected_ctc || 0,
      search_url: profile.search_url || '',
      skills: profile.skills || [],
      current_company: profile.current_company || '',
      current_location: profile.current_location || '',
      employment_history: profile.employment_history || [],
      job_filters: profile.job_filters,
      predefined_answers: profile.predefined_answers || {},
      resume_filename: profile.resume_filename || `${userId}_Resume.pdf`,
      picture: profile.picture || profile.avatar_url || '',
      has_resume: Boolean(profile.has_resume || profile.last_resume_updated_at || (profile.resume_upload_count && profile.resume_upload_count > 0)),
      enabled_for_daily_run: isOrgMember ? (isPlanActive && profile.enabled_for_daily_run !== false) : (profile.enabled_for_daily_run !== false),
      daily_application_limit: calculatedDailyLimit,
      last_login_at: profile.last_login_at || null,
      last_login_ip: profile.last_login_ip || null,
      login_count: profile.login_count || 0,
      last_profile_updated_at: profile.last_profile_updated_at || profile.updated_at || null,
      profile_update_count: profile.profile_update_count || 0,
      last_resume_updated_at: profile.last_resume_updated_at || null,
      resume_upload_count: profile.resume_upload_count || 0,
      last_scout_run_at: profile.last_scout_run_at || null,
      on_demand_run_count: profile.on_demand_run_count || 0,
      raw_json: JSON.stringify(profile, null, 2),
      version_hash: versionHash
    }

    // Pool state for today (exhausted = 2 fruitless runs, capped = limit hit)
    try {
      const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
      const todayIstStr = istNow.toISOString().slice(0, 10)
      const ds = await db.collection<any>('dispatch_state').findOne({ _id: `ds_${userId}_${todayIstStr}` })
      if (ds?.pool_state) (responseData as any).match_status = ds.pool_state
      else (responseData as any).match_status = 'matching'
    } catch {
      (responseData as any).match_status = 'matching'
    }

    const res = NextResponse.json(responseData)
    res.headers.set('ETag', `"${versionHash}"`)
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return res
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = body.user_id
    if (!userId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }
    if (!(await isSelfOrAdmin(req, userId))) {
      return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const now = new Date()
    const existing = await db.collection('profiles').findOne({ user_id: userId })

    // If raw_json was provided directly, parse and merge
    let parsedRaw: any = {}
    if (body.raw_json && typeof body.raw_json === 'string') {
      try {
        parsedRaw = JSON.parse(body.raw_json)
      } catch {}
    }

    const updateDoc: any = {
      user_id: userId,
      name: body.name !== undefined ? body.name : (parsedRaw.name || existing?.name || ''),
      email: body.email !== undefined ? body.email : (parsedRaw.email || existing?.email || ''),
      experience: body.experience !== undefined ? Number(body.experience) : (parsedRaw.experience !== undefined ? Number(parsedRaw.experience) : (existing?.experience || 0)),
      current_ctc: body.current_ctc !== undefined ? Number(body.current_ctc) : (parsedRaw.current_ctc !== undefined ? Number(parsedRaw.current_ctc) : (existing?.current_ctc || 0)),
      expected_ctc: body.expected_ctc !== undefined ? Number(body.expected_ctc) : (parsedRaw.expected_ctc !== undefined ? Number(parsedRaw.expected_ctc) : (existing?.expected_ctc || 0)),
      search_url: body.search_url !== undefined ? body.search_url : (parsedRaw.search_url || existing?.search_url || ''),
      job_filters: body.job_filters !== undefined ? body.job_filters : (parsedRaw.job_filters || existing?.job_filters || {}),
      predefined_answers: body.predefined_answers !== undefined ? body.predefined_answers : (parsedRaw.predefined_answers || existing?.predefined_answers || {}),
      skills: body.skills !== undefined ? body.skills : (parsedRaw.skills || existing?.skills || []),
      current_company: body.current_company !== undefined ? body.current_company : (parsedRaw.current_company || existing?.current_company || ''),
      current_location: body.current_location !== undefined ? body.current_location : (parsedRaw.current_location || existing?.current_location || ''),
      employment_history: body.employment_history !== undefined ? body.employment_history : (parsedRaw.employment_history || existing?.employment_history || []),
      resume_filename: body.resume_filename || parsedRaw.resume_filename || existing?.resume_filename || `${userId}_Resume.pdf`,
      picture: body.picture !== undefined ? body.picture : (parsedRaw.picture !== undefined ? parsedRaw.picture : (existing?.picture || '')),
      updated_at: now
    }

    if (body.password || parsedRaw.password) {
      updateDoc.password = body.password || parsedRaw.password
    } else if (existing?.password) {
      updateDoc.password = existing.password
    }

    if (body.enabled_for_daily_run !== undefined) {
      updateDoc.enabled_for_daily_run = Boolean(body.enabled_for_daily_run)
    } else if (existing?.enabled_for_daily_run !== undefined) {
      updateDoc.enabled_for_daily_run = existing.enabled_for_daily_run
    }

    // Daily limit is admin-managed: only admin sessions may set it.
    // Candidate saves (visual form + raw JSON) can never raise it.
    const sess = await readSession(req)
    const isAdminCaller = sess?.role === 'admin'
    if (isAdminCaller && body.daily_application_limit !== undefined) {
      updateDoc.daily_application_limit = Math.min(150, Math.max(1, Number(body.daily_application_limit)))
    } else if (isAdminCaller && parsedRaw.daily_application_limit !== undefined) {
      updateDoc.daily_application_limit = Math.min(150, Math.max(1, Number(parsedRaw.daily_application_limit)))
    } else if (existing?.daily_application_limit !== undefined) {
      updateDoc.daily_application_limit = existing.daily_application_limit
    }

    // Security: Preserve immutable plan, subscription, and role metadata
    if (existing) {
      updateDoc.plan = existing.plan || 'trial'
      updateDoc.plan_name = existing.plan_name || 'JobFlux 3-Day Free Access'
      updateDoc.role = existing.role || 'user'
      if (existing.plan_activated_at) updateDoc.plan_activated_at = existing.plan_activated_at
      if (existing.plan_expires_at) updateDoc.plan_expires_at = existing.plan_expires_at
      if (existing.trial_started_at) updateDoc.trial_started_at = existing.trial_started_at
      if (existing.trial_expires_at) updateDoc.trial_expires_at = existing.trial_expires_at
      if (existing.last_payment_id) updateDoc.last_payment_id = existing.last_payment_id
      if (existing.last_order_id) updateDoc.last_order_id = existing.last_order_id
      if (existing.is_vip !== undefined) updateDoc.is_vip = existing.is_vip
    }

    const versionHash = crypto.createHash('sha256').update(JSON.stringify(updateDoc)).digest('hex').substring(0, 16)
    updateDoc.version_hash = versionHash

    await db.collection('profiles').updateOne(
      { user_id: userId },
      { $set: updateDoc },
      { upsert: true }
    )
    await db.collection('users').updateOne(
      { user_id: userId },
      { $set: updateDoc },
      { upsert: true }
    )

    // Password changed → kill all other sessions for this account
    if (updateDoc.password && updateDoc.password !== existing?.password) {
      await db.collection('profiles').updateMany({ user_id: userId }, { $inc: { session_v: 1 } })
      await db.collection('users').updateMany({ user_id: userId }, { $inc: { session_v: 1 } })
    }

    // Log profile update activity
    const { ip, userAgent } = getClientInfo(req)
    await logUserActivity(db, {
      userId: userId,
      email: updateDoc.email,
      eventType: 'profile_update',
      description: 'Candidate profile criteria and preferences updated',
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        skills_count: Array.isArray(updateDoc.skills) ? updateDoc.skills.length : 0,
        experience: updateDoc.experience,
        daily_run_enabled: updateDoc.enabled_for_daily_run,
        current_location: updateDoc.current_location
      }
    })

    return NextResponse.json({
      status: 'success',
      profile: updateDoc,
      version_hash: versionHash
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }
    if (!(await isSelfOrAdmin(req, userId))) {
      return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })
    }

    const db = await getDb()
    if (db) {
      await db.collection('profiles').deleteOne({ user_id: userId })
      await db.collection('users').deleteOne({ user_id: userId })
      await db.collection('user_stats').deleteOne({ user_id: userId })
      await db.collection('resumes').deleteOne({ user_id: userId })
    }

    return NextResponse.json({ status: 'success', deleted: userId })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
