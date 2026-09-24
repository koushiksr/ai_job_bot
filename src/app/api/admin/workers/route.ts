import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

const STALE_SECONDS = 120

/**
 * GET /api/admin/workers — live worker fleet for super-admin.
 * Each running worker pulses worker_heartbeats every ~30s; anything older
 * than 120s reads as offline. Enriches online workers with their live task.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const now = Date.now()
    const docs = await db.collection('worker_heartbeats')
      .find({})
      .sort({ heartbeat_at: -1 })
      .limit(20)
      .toArray()

    const liveTasks = await db.collection('tasks').find(
      { status: { $in: ['pending', 'running'] } },
      { projection: { task_id: 1, user_id: 1, status: 1, source: 1 } }
    ).toArray()
    const taskById = new Map(liveTasks.map(t => [t.task_id, t]))

    const seen = new Set<string>()
    const workers = []
    for (const w of docs) {
      const slotKey = `${w.hostname || ''}|${w.pool_slot || 'solo'}`
      if (seen.has(slotKey)) continue // older duplicate of a slot we already have fresher
      seen.add(slotKey)
      const hbTime = w.heartbeat_at ? new Date(w.heartbeat_at).getTime() : 0
      const ageS = hbTime ? Math.max(0, Math.floor((now - hbTime) / 1000)) : 999999
      if (ageS > STALE_SECONDS) continue // dead boots stay out — fleet shows live workers only
      const task = w.current_task_id ? taskById.get(w.current_task_id) : null
      workers.push({
        worker_id: w.worker_id,
        hostname: w.hostname || '',
        platform: w.platform || '',
        pid: w.pid ?? null,
        pool_slot: w.pool_slot || 'solo',
        started_at: w.started_at || null,
        heartbeat_age_s: ageS,
        online: true,
        current_task_id: w.current_task_id || null,
        current_task_user: task?.user_id || null,
        current_task_status: task?.status || null
      })
    }

    const pendingCount = liveTasks.filter(t => t.status === 'pending').length

    return NextResponse.json({
      status: 'success',
      checked_at: new Date().toISOString(),
      online_count: workers.length,
      total_seen: workers.length,
      pending_tasks: pendingCount,
      workers
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to load fleet.' }, { status: 500 })
  }
}
