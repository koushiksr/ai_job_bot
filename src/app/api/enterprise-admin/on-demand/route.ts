import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyEnterpriseAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * POST: Enterprise Admin dispatches an on-demand application sweep for a member
 * Body: { user_id: string }
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const auth = await verifyEnterpriseAdminRequest(req, db)
    if (!auth.authorized) {
      return NextResponse.json({ detail: 'Unauthorized. Enterprise Admin privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    const targetUserId = (body.user_id || '').trim()

    if (!targetUserId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    // Verify target candidate belongs to this enterprise organization or is Super Admin
    const targetProfile = await db.collection('profiles').findOne({ user_id: targetUserId })
    if (!targetProfile) {
      return NextResponse.json({ detail: 'Candidate profile not found' }, { status: 404 })
    }

    if (
      !auth.isSuperAdmin &&
      targetProfile.enterprise_org_id !== auth.orgId &&
      targetProfile.email !== 'technohmsit@gmail.com'
    ) {
      return NextResponse.json({ detail: 'Forbidden. Target candidate does not belong to your organization.' }, { status: 403 })
    }

    // Check if user is currently disabled
    if (targetProfile.enabled_for_daily_run === false || targetProfile.enterprise_status === 'disabled') {
      return NextResponse.json({ detail: 'Cannot run on-demand sweep for a disabled member. Please enable the member first.' }, { status: 400 })
    }

    // Check if task is already running
    const existingTask = await db.collection('tasks').findOne({
      user_id: targetUserId,
      status: { $in: ['pending', 'running'] }
    })

    if (existingTask) {
      return NextResponse.json({
        status: 'active',
        message: 'A live application sweep is already currently processing or queued for this candidate.',
        task_id: existingTask.task_id
      })
    }

    const now = new Date()
    const taskId = `task_${Date.now()}_${Math.floor(Math.random() * 1000)}`

    // Count pending tasks ahead in queue
    const aheadCount = await db.collection('tasks').countDocuments({ status: 'pending' })
    const queuePosition = aheadCount + 1

    const newTask = {
      task_id: taskId,
      user_id: targetUserId,
      status: 'pending',
      source: 'enterprise_admin_on_demand',
      triggered_by: auth.email,
      created_at: now,
      updated_at: now,
      logs: [
        `[${now.toLocaleTimeString()}] 🏢 On-demand enterprise sweep initiated by Administrator (${auth.email}).`,
        `[${now.toLocaleTimeString()}] 📋 Enqueued at position #${queuePosition} in cloud dispatch pipeline.`
      ]
    }

    await db.collection('tasks').insertOne(newTask)

    // Update member profile last_scout_run_at
    await db.collection('profiles').updateOne(
      { user_id: targetUserId },
      {
        $set: { last_scout_run_at: now },
        $inc: { on_demand_run_count: 1 }
      }
    )

    return NextResponse.json({
      status: 'success',
      message: `On-demand sweep enqueued for ${targetProfile.name || targetUserId} at position #${queuePosition} in line.`,
      task_id: taskId,
      queue_position: queuePosition,
      candidate_name: targetProfile.name || targetUserId
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Error triggering on-demand task' }, { status: 500 })
  }
}
