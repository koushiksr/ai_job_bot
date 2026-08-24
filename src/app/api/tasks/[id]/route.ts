import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const task = await db.collection<any>('tasks').findOne({ _id: id })
    if (!task) {
      return NextResponse.json({ detail: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    if (body.action === 'stop') {
      const now = new Date()
      await db.collection<any>('tasks').updateOne(
        { _id: id },
        {
          $set: {
            status: 'stopped',
            stop_requested: true,
            completed_at: now
          },
          $push: { logs: `[${now.toTimeString().split(' ')[0]}] 🛑 Application run stopped by user.` } as any
        }
      )
      return NextResponse.json({ status: 'stopped', message: 'Bot task stopped successfully.' })
    }

    return NextResponse.json({ message: 'No action taken' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
