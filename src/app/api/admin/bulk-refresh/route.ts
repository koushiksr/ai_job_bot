import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { POST as analyzePOST } from '@/app/api/profile/analyze/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/admin/bulk-refresh — run the OpenAI-nano 3-way merge
 * (resume + Naukri snapshot + stored JSON) for many candidates at once.
 * Body: { user_ids?: string[], batch_size?: number (default 2), offset?: number }
 * Processes one slice per call (serverless time limits); the caller loops
 * with offset until done. Each profile commits immediately, so stopping
 * halfway loses nothing. Manager/admin accounts are always skipped.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 2, 1), 5)
    const offset = Math.max(Number(body.offset) || 0, 0)
    const onlyIds: string[] = Array.isArray(body.user_ids)
      ? body.user_ids.filter((x: any) => typeof x === 'string')
      : []

    // Candidate pool: real job seekers only (never managers/admins)
    const allProfiles = await db.collection('profiles').find(
      {},
      { projection: { user_id: 1, role: 1, enterprise_role: 1, is_org_admin_only: 1 } }
    ).toArray()
    let pool = allProfiles.filter(p =>
      p.user_id &&
      !p.is_org_admin_only &&
      (p.role || '') !== 'admin' &&
      (p.role || '') !== 'enterprise_admin' &&
      (p.enterprise_role || '') !== 'admin' &&
      (p.enterprise_role || '') !== 'super_admin' &&
      p.user_id !== 'admin' &&
      p.user_id !== 'technohmsit'
    )
    if (onlyIds.length > 0) {
      const keep = new Set(onlyIds)
      pool = pool.filter(p => keep.has(p.user_id))
    }
    pool.sort((a, b) => String(a.user_id).localeCompare(String(b.user_id)))

    const total = pool.length
    const slice = pool.slice(offset, offset + batchSize)
    const results: Array<{ user_id: string; ok: boolean; source?: string; detail?: string }> = []

    for (const p of slice) {
      try {
        const inner = new NextRequest('http://internal/api/profile/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: p.user_id })
        })
        const res: any = await analyzePOST(inner)
        const data = await res.json().catch(() => ({}))
        if (res.ok || res.status === 200) {
          results.push({ user_id: p.user_id, ok: true, source: data.source || 'merged' })
        } else {
          results.push({ user_id: p.user_id, ok: false, detail: data.detail || `HTTP ${res.status}` })
        }
      } catch (e: any) {
        results.push({ user_id: p.user_id, ok: false, detail: e.message || 'merge failed' })
      }
      // Gentle pacing for LLM rate limits
      await new Promise(r => setTimeout(r, 1000))
    }

    const nextOffset = offset + slice.length < total ? offset + slice.length : null
    return NextResponse.json({
      status: 'success',
      total,
      processed: offset + slice.length,
      next_offset: nextOffset,
      done: nextOffset === null,
      results
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Bulk refresh failed.' }, { status: 500 })
  }
}
