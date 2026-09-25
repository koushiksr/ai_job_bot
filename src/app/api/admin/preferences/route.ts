import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * Super-admin UI preferences, persisted per admin in MongoDB
 * (collection `admin_preferences`, one doc per user_id) so filters,
 * tabs and selections survive logins and follow the admin across devices.
 * localStorage remains as an instant client-side cache; this is the source of truth.
 *
 * PUT merges keys (dot-notation $set) so independent tabs can save their
 * own slice concurrently without clobbering each other.
 */
const ALLOWED_KEYS = [
  // Shell (admin/page.tsx)
  'active_tab',
  'candidate_search',
  'candidate_status_filter',
  'selected_candidate_id',
  'assigned_offer_filter',
  'logs_sub_tab',
  // Candidates tab
  'c_exec',
  'c_acct',
  'c_sort',
  'c_order',
  'c_page',
  // Visitors tab
  'v_event',
  'v_device',
  'v_time',
  'v_identity',
  'v_country',
  'v_hide',
  'v_limit'
] as const

type Prefs = Partial<Record<(typeof ALLOWED_KEYS)[number], string>>

// Persistent ignore lists (multi-device / multi-account coverage).
// Stored as arrays under the same per-admin doc; capped to stay tiny.
const ARRAY_KEYS = ['x_emails', 'x_vids', 'x_ips'] as const
type ArrayKey = (typeof ARRAY_KEYS)[number]

function sanitizeArrays(input: any): Record<ArrayKey, string[]> {
  const out: Record<ArrayKey, string[]> = { x_emails: [], x_vids: [], x_ips: [] }
  if (!input || typeof input !== 'object') return out
  for (const k of ARRAY_KEYS) {
    const v = input[k]
    if (!Array.isArray(v)) continue
    out[k] = v
      .filter((e: any) => typeof e === 'string')
      .map((e: string) => (k === 'x_emails' ? e.toLowerCase() : e).trim())
      .filter((e: string) => e.length > 0 && e.length <= 120)
      .slice(0, 50)
  }
  return out
}

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
    return NextResponse.json({ status: 'success', prefs: sanitize(doc?.prefs || {}), ignore: sanitizeArrays(doc?.prefs || {}) })
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

    const body = await req.json().catch(() => ({}))
    const prefs = sanitize(body)
    const arrays = sanitizeArrays(body)
    await db.collection('admin_preferences').createIndex({ user_id: 1 }, { unique: true })
    // Merge (not replace) so tabs saving concurrently never wipe each other.
    const setOps: Record<string, any> = { user_id: userId, updated_at: new Date() }
    for (const [k, v] of Object.entries(prefs)) setOps[`prefs.${k}`] = v
    for (const k of ARRAY_KEYS) {
      if (Array.isArray(body?.[k])) setOps[`prefs.${k}`] = arrays[k]
    }
    if (Object.keys(setOps).length <= 2) {
      return NextResponse.json({ status: 'success', prefs: {} })
    }
    await db.collection('admin_preferences').updateOne(
      { user_id: userId },
      { $set: setOps },
      { upsert: true }
    )
    return NextResponse.json({ status: 'success', prefs })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to save preferences.' }, { status: 500 })
  }
}
