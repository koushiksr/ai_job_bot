import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const eventType = searchParams.get('event_type')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200)

    const query: any = {}
    if (userId && userId.trim()) {
      query.user_id = userId.trim()
    }
    if (eventType && eventType.trim() && eventType !== 'all') {
      query.event_type = eventType.trim()
    }

    const rawLogs = await db
      .collection('user_activity_logs')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    const formattedLogs = rawLogs.map(log => ({
      id: log._id.toString(),
      user_id: log.user_id,
      email: log.email || '',
      event_type: log.event_type,
      description: log.description,
      metadata: log.metadata || {},
      ip_address: log.ip_address || '',
      user_agent: log.user_agent || '',
      created_at: log.created_at
    }))

    // Calculate aggregated activity counts across the system
    const [loginCount, profileCount, resumeCount, taskCount] = await Promise.all([
      db.collection('user_activity_logs').countDocuments({ event_type: 'login' }),
      db.collection('user_activity_logs').countDocuments({ event_type: 'profile_update' }),
      db.collection('user_activity_logs').countDocuments({ event_type: 'resume_upload' }),
      db.collection('user_activity_logs').countDocuments({ event_type: 'task_run' })
    ])

    return NextResponse.json({
      logs: formattedLogs,
      stats: {
        total_logins: loginCount,
        total_profile_updates: profileCount,
        total_resume_uploads: resumeCount,
        total_task_runs: taskCount,
        total_logged_events: loginCount + profileCount + resumeCount + taskCount
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

