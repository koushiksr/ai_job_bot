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

    // Gather hardware info from recent tasks to enrich heartbeats if needed
    const recentTasks = await db.collection('tasks')
      .find({
        $or: [
          { worker_device_brand: { $exists: true } },
          { worker_hardware_model: { $exists: true } },
          { device_brand: { $exists: true } },
          { hardware_model: { $exists: true } }
        ]
      })
      .sort({ created_at: -1 })
      .limit(30)
      .toArray()
    
    const hostHardwareMap = new Map<string, { brand?: string; model?: string }>()
    for (const t of recentTasks) {
      const h = t.worker_host || t.worker_hostname || t.hostname
      if (h && !hostHardwareMap.has(h)) {
        hostHardwareMap.set(h, {
          brand: t.worker_device_brand || t.device_brand,
          model: t.worker_hardware_model || t.hardware_model
        })
      }
    }

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

      const hostHw = hostHardwareMap.get(w.hostname)
      const rawBrand = w.device_brand || hostHw?.brand
      const rawModel = w.hardware_model || hostHw?.model

      const deviceBrand = rawBrand || (
        w.platform?.includes('Darwin') ? 'Apple Mac' :
        (w.platform?.includes('Windows') ? (w.hostname?.toLowerCase().includes('dell') ? 'Dell PC' : w.hostname?.toLowerCase().includes('hp') ? 'HP PC' : 'Windows PC') :
        (w.platform ? 'Linux Server' : 'Cloud Worker'))
      )
      const hardwareModel = rawModel || (
        w.platform?.includes('Darwin') ? 'Apple Mac' :
        (w.platform?.includes('Windows') ? 'Windows PC' : 'Generic Machine')
      )

      workers.push({
        worker_id: w.worker_id,
        hostname: w.hostname || '',
        platform: w.platform || '',
        pid: w.pid ?? null,
        pool_slot: w.pool_slot || 'solo',
        started_at: w.started_at || null,
        heartbeat_age_s: ageS,
        online: true,
        device_brand: deviceBrand,
        hardware_model: hardwareModel,
        current_task_id: w.current_task_id || null,
        current_task_user: task?.user_id || null,
        current_task_status: task?.status || null
      })
    }

    // Group workers into server machines
    const serversMap = new Map<string, any>()
    for (const w of workers) {
      const host = w.hostname || 'unknown-host'
      if (!serversMap.has(host)) {
        serversMap.set(host, {
          hostname: host,
          device_brand: w.device_brand,
          hardware_model: w.hardware_model,
          platform: w.platform,
          active_count: 0,
          workers: []
        })
      }
      const s = serversMap.get(host)
      s.workers.push(w)
      if (w.current_task_id) {
        s.active_count++
      }
      if (w.hardware_model && !s.hardware_model?.includes('(') && w.hardware_model.includes('(')) {
        s.hardware_model = w.hardware_model
      }
      if (w.device_brand && s.device_brand === 'Windows PC' && w.device_brand !== 'Windows PC') {
        s.device_brand = w.device_brand
      }
    }
    const servers = Array.from(serversMap.values())

    const pendingCount = liveTasks.filter(t => t.status === 'pending').length

    return NextResponse.json({
      status: 'success',
      checked_at: new Date().toISOString(),
      online_count: workers.length,
      total_seen: workers.length,
      pending_tasks: pendingCount,
      servers_count: servers.length,
      servers,
      workers
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to load fleet.' }, { status: 500 })
  }
}
