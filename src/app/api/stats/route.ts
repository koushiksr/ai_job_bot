import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ today: 0, this_week: 0, this_month: 0, total_applied: 0 })
    }

    const statsDoc = await db.collection('user_stats').findOne({ user_id: userId })
    if (statsDoc) {
      const now = new Date()
      const todayStr = now.toISOString().split('T')[0]
      const todayCount = statsDoc?.last_date === todayStr ? (statsDoc?.today || 0) : 0

      return NextResponse.json({
        today: todayCount,
        this_week: statsDoc?.this_week || 0,
        this_month: statsDoc?.this_month || 0,
        total_applied: statsDoc?.total_applied || 0
      })
    }

    return NextResponse.json({ today: 0, this_week: 0, this_month: 0, total_applied: 0 })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
