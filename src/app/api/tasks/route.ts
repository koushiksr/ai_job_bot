import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import crypto from 'crypto'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ task: null })
    }

    const latestTask = await db
      .collection('tasks')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray()

    if (!latestTask || latestTask.length === 0) {
      return NextResponse.json({ task: null })
    }

    const t = latestTask[0]
    return NextResponse.json({
      task: {
        id: t._id.toString(),
        task_id: t.task_id,
        user_id: t.user_id,
        status: t.status,
        created_at: t.created_at,
        started_at: t.started_at,
        completed_at: t.completed_at,
        summary: t.summary || null,
        logs: Array.isArray(t.logs) ? t.logs.slice(-5) : []
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateCheck = checkRateLimit(req, { limit: 10, windowSeconds: 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { detail: `Too many on-demand task dispatches. Please wait ${rateCheck.resetSeconds} seconds before requesting again.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { user_id, headless } = body

    if (!user_id) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database connection failed' }, { status: 500 })
    }

    // 1. Plan Verification: On-Demand runs are strictly reserved for Professional subscribers
    const profile = await db.collection('profiles').findOne({ user_id: user_id }) ||
                    await db.collection('users').findOne({ user_id: user_id })

    const role = profile?.role || 'user'
    const plan = (profile?.plan || 'trial').toLowerCase()
    const isPro = role === 'admin' || user_id === 'admin' || user_id === 'technohmsit' || plan === 'elite' || plan === 'professional' || plan === 'enterprise'

    if (!isPro) {
      return NextResponse.json({
        detail: 'Instant On-Demand Turbo Scout is exclusively reserved for Professional Tier members. Your automated applications execute during the scheduled daily 06:00 & 08:00 AM IST runs. Upgrade to Professional to trigger instant runs anytime.',
        code: 'PLAN_UPGRADE_REQUIRED',
        required_plan: 'professional'
      }, { status: 403 })
    }

    // Check if there is already an active/pending task for this user
    const existingTask = await db.collection('tasks').findOne({
      user_id: user_id,
      status: { $in: ['pending', 'running'] }
    })

    if (existingTask) {
      return NextResponse.json({
        success: true,
        already_active: true,
        task_id: existingTask.task_id,
        status: existingTask.status,
        message: 'An automation run is already queued or active.'
      })
    }

    const taskId = `task_${user_id}_${Date.now()}`
    const now = new Date()

    const newTask = {
      task_id: taskId,
      user_id: user_id,
      status: 'pending',
      headless: headless !== undefined ? headless : false,
      source: 'web_dashboard_on_demand',
      created_at: now,
      logs: [`[${now.toISOString().split('T')[1].slice(0, 8)}] 🚀 On-demand application request enqueued via Web Dashboard.`]
    }

    await db.collection('tasks').insertOne(newTask)

    // Log on-demand scout task run activity
    const { ip, userAgent } = getClientInfo(req)
    await logUserActivity(db, {
      userId: user_id,
      eventType: 'task_run',
      description: `Dispatched on-demand application scout (${taskId})`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        task_id: taskId,
        headless: newTask.headless,
        source: newTask.source
      }
    })

    return NextResponse.json({
      success: true,
      task_id: taskId,
      status: 'pending',
      message: 'On-demand job scout task enqueued successfully. Queue worker will pick it up.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

