import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * Super-admin UI preferences, persisted per admin in MongoDB
 * (collection `admin_preferences`, one doc per user_id) so filters,
 * tabs and selections survive logins and follow the admin across devices.
 * localStorage remains as an instant client-side cache; this is the source of truth.
 */
const ALLOWED_KEYS = [
  'active_tab',
  'candidate_search',
  'candidate_status_filter',
  'selected_candidate_id',
  'assigned_offer_filter',
  'logs_sub_tab'
] as const

type Prefs = Partial<Record<(typeof ALLOWED_KEYS)[number], string>>

function sanitize(input: any): Prefs {
  const out: Prefs = {}
  if (!input || typeof input !== 'object') return out
  for (const k of ALLOWED_KEYS) {
    const v = input[k]
    if (typeof v === 'string' && v.length <= 200) out[k] = v
  }
  return out
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized, userId } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    await db.collection('admin_preferences').createIndex({ user_id: 1 }, { unique: true })
    const doc = await db.collection('admin_preferences').findOne({ user_id: userId })
    return NextResponse.json({ status: 'success', prefs: sanitize(doc?.prefs || {}) })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to load preferences.' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized, userId } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const prefs = sanitize(await req.json().catch(() => ({})))
    await db.collection('admin_preferences').createIndex({ user_id: 1 }, { unique: true })
    await db.collection('admin_preferences').updateOne(
      { user_id: userId },
      { $set: { user_id: userId, prefs, updated_at: new Date() } },
      { upsert: true }
    )
    return NextResponse.json({ status: 'success', prefs })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to save preferences.' }, { status: 500 })
  }
}
