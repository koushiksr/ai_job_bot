import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getWeeklyOnDemandLimit } from '@/config/plans'

export const dynamic = 'force-dynamic'

export interface UserAlert {
  type: 'error' | 'warning' | 'info'
  code: string
  title: string
  message: string
  actionLabel?: string
  actionHref?: string
}

/**
 * GET /api/user/alerts?user_id=...&email=...
 * Candidate-facing action items: wrong Naukri credentials, paused runs,
 * exhausted on-demand quotas, inactive plans. Plain language, with fix links.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = (searchParams.get('user_id') || '').trim()
    const email = (searchParams.get('email') || '').trim().toLowerCase()

    const db = await getDb()
    if (!db) return NextResponse.json({ alerts: [] })

    const profile = (userId ? await db.collection('profiles').findOne({ user_id: userId }) : null)
      || (email ? await db.collection('profiles').findOne({ email: { $regex: `^${email}$`, $options: 'i' } }) : null)
      || (userId ? await db.collection('users').findOne({ user_id: userId }) : null)
    if (!profile) return NextResponse.json({ alerts: [] })

    const alerts: UserAlert[] = []
    const now = new Date()
    const plan = (profile.plan || 'trial').toLowerCase()
    const isEnterpriseMember = profile.enterprise_role === 'member' || plan === 'enterprise' || plan === 'org_pro'
    const failCount = Number(profile.naukri_login_fail_count || 0)
    const enabled = profile.enabled_for_daily_run !== false

    // 1. Daily runs paused
    if (!enabled) {
      alerts.push({
        type: 'error',
        code: 'DAILY_PAUSED',
        title: 'Daily auto-apply is paused',
        message: failCount >= 3
          ? `Your daily runs were auto-paused after ${failCount} consecutive Naukri login failures — your saved Naukri Email/Password combination is wrong. Fix it in Profile to resume.`
          : 'Your daily auto-apply is paused. Re-enable it in Profile settings to resume morning sweeps.',
        actionLabel: 'Fix in Profile',
        actionHref: '/profile'
      })
    } else if (failCount >= 1) {
      // 2. Credentials failing but not yet paused
      alerts.push({
        type: 'warning',
        code: 'NAUKRI_CREDS',
        title: 'Naukri login failed — check credentials',
        message: `Your last run could not log in to Naukri (${failCount}/3 failed attempts). Verify your Naukri Email ID + Password in Profile before daily runs auto-pause at 3 failures.`,
        actionLabel: 'Verify Credentials',
        actionHref: '/profile'
      })
    }

    // 3. On-demand quotas (3/day for everyone with permission; weekly by plan)
    const istNow = new Date(now.getTime() + 5.5 * 60 * 60 * 1000)
    const todayIst = istNow.toISOString().slice(0, 10)
    const dayStart = new Date(new Date(`${todayIst}T00:00:00+05:30`).getTime())
    const dayEnd = new Date(new Date(`${todayIst}T23:59:59+05:30`).getTime())
    const usedToday = await db.collection('tasks').countDocuments({
      user_id: profile.user_id,
      source: { $in: ['web_dashboard_on_demand', 'enterprise_admin_on_demand'] },
      created_at: { $gte: dayStart, $lte: dayEnd }
    })
    if (usedToday >= 3) {
      alerts.push({
        type: 'info',
        code: 'ONDEMAND_DAILY',
        title: 'On-demand limit reached for today (3/3)',
        message: 'You have used all 3 on-demand sweeps for today. Resets at midnight IST — your automatic morning sweep still runs as usual.',
      })
    }
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const usedWeek = await db.collection('tasks').countDocuments({
      user_id: profile.user_id,
      source: 'web_dashboard_on_demand',
      created_at: { $gte: weekAgo }
    })
    const weeklyLimit = getWeeklyOnDemandLimit(plan, isEnterpriseMember)
    if (usedWeek >= weeklyLimit) {
      alerts.push({
        type: 'info',
        code: 'ONDEMAND_WEEKLY',
        title: `Weekly on-demand limit reached (${weeklyLimit}/${weeklyLimit})`,
        message: `Your plan allows ${weeklyLimit} on-demand sweeps per week. Resets on a rolling 7-day basis — daily morning sweeps continue regardless.${plan === 'enterprise' ? ' Upgrade to Org Pro (₹99/mo) for 15/week.' : ''}`,
        actionLabel: plan === 'enterprise' ? 'See Org Pro' : undefined,
        actionHref: plan === 'enterprise' ? '/dashboard' : undefined
      })
    }

    // 4. Inactive / expired plan (non-members only — members keep org base)
    if (!isEnterpriseMember) {
      let planOk = true
      if (plan === 'none' || plan === 'no_plan') planOk = false
      else if (plan !== 'trial' && plan !== 'vip') {
        const exp = profile.plan_expires_at ? new Date(profile.plan_expires_at) : null
        if (exp && exp <= now) planOk = false
      } else if (plan === 'trial') {
        const tExp = profile.trial_expires_at ? new Date(profile.trial_expires_at) : null
        if (tExp && tExp <= now) planOk = false
      }
      if (!planOk) {
        alerts.push({
          type: 'warning',
          code: 'PLAN_INACTIVE',
          title: 'No active plan — daily sweeps stopped',
          message: 'Your plan expired (or is inactive). Renew to resume automatic morning applications.',
          actionLabel: 'View Plans',
          actionHref: '/pricing'
        })
      }
    }

    return NextResponse.json({ status: 'success', alerts })
  } catch (err: any) {
    return NextResponse.json({ alerts: [] })
  }
}
