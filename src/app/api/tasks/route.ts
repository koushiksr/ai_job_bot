import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = body.user_id || body.profile_path || 'candidate1_koushiksr'
    const headless = Boolean(body.headless)
    const action = body.action || 'run_bot'

    const taskId = `task_${crypto.randomBytes(6).toString('hex')}`
    const now = new Date()

    const taskDoc = {
      _id: taskId,
      task_id: taskId,
      user_id: userId,
      action: action,
      headless: headless,
      status: 'pending',
      stop_requested: false,
      logs: [`[${now.toTimeString().split(' ')[0]}] Task queued in MongoDB Atlas broker.`],
      created_at: now,
      started_at: null,
      completed_at: null,
      heartbeat_at: now,
      stats: { applied: 0, external: 0, skipped: 0, errors: 0 },
      summary: null,
      error: null
    }

    const db = await getDb()
    if (db) {
      // Check if user already has an active pending/running task
      const existing = await db.collection<any>('tasks').findOne({
        user_id: userId,
        status: { $in: ['pending', 'running'] }
      })
      if (existing) {
        return NextResponse.json({
          job_id: existing._id,
          status: existing.status,
          message: 'An application task is already running or pending for this profile.'
        })
      }

      await db.collection<any>('tasks').insertOne(taskDoc)
    }

    return NextResponse.json({
      status: 'success',
      job_id: taskId,
      task_id: taskId,
      message: 'Bot application task enqueued successfully.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to enqueue task' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id query param required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ active: false, task: null })
    }

    const activeTask = await db.collection('tasks').findOne(
      { user_id: userId, status: { $in: ['pending', 'running'] } },
      { sort: { created_at: -1 } }
    )

    if (activeTask) {
      return NextResponse.json({
        active: true,
        job_id: activeTask._id,
        status: activeTask.status,
        data: activeTask
      })
    }

    const latest = await db.collection('tasks').findOne(
      { user_id: userId },
      { sort: { created_at: -1 } }
    )

    return NextResponse.json({
      active: false,
      job_id: latest?._id || null,
      status: latest?.status || 'idle',
      data: latest || null
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
