import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

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

    const userDocs = await db.collection('users').find({}).toArray()
    const profiles = userDocs.length > 0 ? userDocs : await db.collection('profiles').find({}).toArray()
    const statsList = await db.collection('user_stats').find({}).toArray()

    const statsMap: Record<string, any> = {}
    statsList.forEach(s => {
      statsMap[s.user_id] = s
    })

    const users = profiles.map(p => {
      const s = statsMap[p.user_id] || {}
      return {
        id: p.user_id,
        user_id: p.user_id,
        name: p.name || p.user_id.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        email: p.email || '',
        experience: p.experience || 0,
        current_ctc: p.current_ctc || 0,
        expected_ctc: p.expected_ctc || 0,
        enabled_for_daily_run: p.enabled_for_daily_run !== false,
        plan: p.plan || 'trial',
        plan_name: p.plan_name || (p.plan ? `JobFlux ${p.plan.toUpperCase()}` : '1-Day Free Trial'),
        plan_expires_at: p.plan_expires_at || p.trial_expires_at || null,
        trial_expires_at: p.trial_expires_at || null,
        is_vip: Boolean(p.is_vip || p.vip_access || p.free_privilege),
        total_applied: s.total_applied || 0,
        applied_today: s.today || 0,
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
        last_scout_run_at: p.last_scout_run_at || null
      }
    })

    return NextResponse.json({ users })
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
    const { user_id, is_vip, plan, enabled_for_daily_run, extend_days } = body

    if (!user_id) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const now = new Date()
    const updates: any = { updated_at: now }
    if (typeof is_vip === 'boolean') {
      updates.is_vip = is_vip
      updates.vip_access = is_vip
      updates.free_privilege = is_vip
    }
    if (typeof enabled_for_daily_run === 'boolean') {
      updates.enabled_for_daily_run = enabled_for_daily_run
    }
    if (plan) {
      updates.plan = plan
      updates.plan_activated_at = now
      if (plan === 'vip') {
        updates.plan_name = 'JobFlux VIP Elite'
        updates.is_vip = true
        updates.vip_access = true
        updates.free_privilege = true
        updates.plan_expires_at = new Date(now.getTime() + 3650 * 24 * 60 * 60 * 1000)
      } else if (plan === 'elite' || plan === 'professional') {
        const days = extend_days || 90
        updates.plan_name = 'JobFlux PROFESSIONAL'
        updates.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      } else if (plan === 'pro' || plan === 'starter') {
        const days = extend_days || 30
        updates.plan_name = 'JobFlux PRO'
        updates.plan_expires_at = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      } else if (plan === 'trial') {
        updates.plan_name = 'JobFlux 1-Day Free Trial'
        updates.trial_started_at = now
        updates.trial_expires_at = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        updates.plan_expires_at = null
        updates.is_vip = false
        updates.vip_access = false
        updates.free_privilege = false
      } else if (plan === 'none' || plan === 'no_plan') {
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
