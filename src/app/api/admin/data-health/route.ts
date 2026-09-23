import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const COMPARE_KEYS = [
  'email', 'plan', 'role', 'enterprise_role', 'enterprise_org_id',
  'enabled_for_daily_run', 'plan_expires_at', 'trial_expires_at'
]

function norm(v: any): string {
  if (v === undefined || v === null) return ''
  if (v instanceof Date) return v.toISOString()
  return String(v)
}

/**
 * GET /api/admin/data-health — drift monitor for the users/profiles dual-write.
 * Reports membership gaps and field-level divergence so silent data skew is
 * caught within a day instead of during an incident. Direction: `profiles`
 * is canonical; `users` is the legacy mirror.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const [userDocs, profileDocs] = await Promise.all([
      db.collection('users').find({}, { projection: { user_id: 1, email: 1, plan: 1, role: 1, enterprise_role: 1, enterprise_org_id: 1, enabled_for_daily_run: 1, plan_expires_at: 1, trial_expires_at: 1 } }).toArray(),
      db.collection('profiles').find({}, { projection: { user_id: 1, email: 1, plan: 1, role: 1, enterprise_role: 1, enterprise_org_id: 1, enabled_for_daily_run: 1, plan_expires_at: 1, trial_expires_at: 1 } }).toArray()
    ])

    const users = new Map(userDocs.filter(d => d.user_id).map(d => [d.user_id, d]))
    const profs = new Map(profileDocs.filter(d => d.user_id).map(d => [d.user_id, d]))

    const onlyInUsers = [...users.keys()].filter(u => !profs.has(u))
    const onlyInProfiles = [...profs.keys()].filter(u => !users.has(u))

    const drifts: { user_id: string; field: string; users: string; profiles: string }[] = []
    for (const uid of users.keys()) {
      if (!profs.has(uid)) continue
      const u = users.get(uid)!
      const p = profs.get(uid)!
      for (const k of COMPARE_KEYS) {
        if (norm((u as any)[k]) !== norm((p as any)[k])) {
          drifts.push({ user_id: uid, field: k, users: norm((u as any)[k]).slice(0, 60), profiles: norm((p as any)[k]).slice(0, 60) })
          if (drifts.length >= 50) break
        }
      }
      if (drifts.length >= 50) break
    }

    return NextResponse.json({
      status: 'success',
      checked_at: new Date().toISOString(),
      users_count: users.size,
      profiles_count: profs.size,
      only_in_users: onlyInUsers,
      only_in_profiles: onlyInProfiles,
      drift_count: drifts.length,
      drifts,
      healthy: onlyInUsers.length === 0 && onlyInProfiles.length === 0 && drifts.length === 0
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Data health check failed.' }, { status: 500 })
  }
}
