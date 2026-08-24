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
      await db.collection<any>('tasks').updateOne(
        { _id: id },
        {
          $set: { stop_requested: true },
          $push: { logs: `[${new Date().toTimeString().split(' ')[0]}] 🛑 Stop requested from user dashboard.` } as any
        }
      )
      return NextResponse.json({ status: 'stopping', message: 'Stop signal sent to bot worker.' })
    }

    return NextResponse.json({ message: 'No action taken' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
