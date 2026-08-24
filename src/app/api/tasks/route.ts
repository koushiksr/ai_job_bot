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
      logs: [`[${now.toTimeString().split(' ')[0]}] 🚀 Task registered in MongoDB Atlas queue. Waiting for background worker...`],
      created_at: now,
      started_at: null,
      completed_at: null,
      heartbeat_at: now,
      stats: { applied: 0, external: 0, skipped: 0, errors: 0 },
      summary: null,
      error: null
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'MongoDB cluster is unreachable' }, { status: 503 })
    }

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

    return NextResponse.json({
      status: 'success',
      job_id: taskId,
      task_id: taskId,
      message: 'Bot application task enqueued successfully into MongoDB Atlas.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to enqueue task' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10))

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ tasks: [] })
    }

    const query: any = {}
    if (userId) query.user_id = userId

    const tasks = await db
      .collection('tasks')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    const activeTask = tasks.find((t: any) => t.status === 'pending' || t.status === 'running')

    return NextResponse.json({
      active: !!activeTask,
      job_id: activeTask?._id || null,
      status: activeTask?.status || 'idle',
      data: activeTask || null,
      tasks
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
