import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const sinceLine = Math.max(0, parseInt(searchParams.get('since_line') || '0', 10))

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ logs: [], status: 'unknown' })
    }

    const task = await db.collection<any>('tasks').findOne(
      { _id: id },
      { projection: { logs: 1, status: 1, stop_requested: 1, heartbeat_at: 1, created_at: 1, started_at: 1, completed_at: 1, error: 1 } }
    )

    if (!task) {
      return NextResponse.json({ logs: [], status: 'not_found' }, { status: 404 })
    }

    const allLogs: string[] = task.logs || []
    // Correct delta slice: return only lines after `sinceLine`
    const deltaLogs = sinceLine >= allLogs.length ? [] : allLogs.slice(sinceLine)

    return NextResponse.json({
      status: task.status,
      stop_requested: task.stop_requested || false,
      total_lines: allLogs.length,
      logs: deltaLogs,
      created_at: task.created_at,
      started_at: task.started_at,
      completed_at: task.completed_at,
      error: task.error || null
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
