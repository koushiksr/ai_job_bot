import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { readSession } from '@/lib/session'
import { isSessionRevoked } from '@/lib/sessionRegistry'

export const dynamic = 'force-dynamic'

/**
 * POST /api/profile/naukri-sync { user_id } — enqueue a read-only Naukri
 * profile snapshot (no applications). Self or super-admin only. The worker
 * logs in once, saves profiles.naukri_snapshot tagged by user, and later
 * AI fills reuse it instantly without another browser login.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const userId = (body.user_id || '').trim()
    if (!userId) return NextResponse.json({ detail: 'user_id is required.' }, { status: 400 })

    const sess = readSession(req)
    if (!sess || (await isSessionRevoked(sess))) {
      return NextResponse.json({ detail: 'Sign in again.' }, { status: 401 })
    }
    const isSelf = sess.uid === userId
    const isAdmin = sess.role === 'admin'
    if (!isSelf && !isAdmin) {
      return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })
    }

    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable.' }, { status: 503 })

    const profile = await db.collection('profiles').findOne({ user_id: userId })
    if (!profile) return NextResponse.json({ detail: 'Profile not found.' }, { status: 404 })
    if (!profile.password || !String(profile.password).trim()) {
      return NextResponse.json({ detail: 'Save your Naukri password in the profile first.' }, { status: 400 })
    }

    const existing = await db.collection('tasks').findOne({
      user_id: userId,
      action: 'naukri_snapshot',
      status: { $in: ['pending', 'running'] }
    })
    if (existing) {
      return NextResponse.json({ status: 'active', task_id: existing.task_id, task_status: existing.status })
    }

    const now = new Date()
    const taskId = `task_${userId}_snapshot_${now.getTime()}`
    await db.collection('tasks').insertOne({
      task_id: taskId,
      user_id: userId,
      action: 'naukri_snapshot',
      status: 'pending',
      headless: false,
      source: 'snapshot_request',
      triggered_by: sess.uid,
      date_ist: '',
      created_at: now,
      logs: [`[${now.toLocaleTimeString()}] Snapshot requested — worker will log in once and capture the Naukri profile (read-only).`]
    })
    return NextResponse.json({ status: 'success', task_id: taskId })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to queue snapshot.' }, { status: 500 })
  }
}
