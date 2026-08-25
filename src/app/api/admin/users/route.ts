import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ users: [] })
    }

    const profiles = await db.collection('profiles').find({}).toArray()
    const statsList = await db.collection('user_stats').find({}).toArray()

    const statsMap: Record<string, any> = {}
    statsList.forEach(s => {
      statsMap[s.user_id] = s
    })

    const users = profiles.map(p => {
      const s = statsMap[p.user_id] || {}
      return {
        id: p.user_id,
        user_id: p.user_id,
        name: p.name || p.user_id.replace('_', ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
        email: p.email || '',
        experience: p.experience || 0,
        current_ctc: p.current_ctc || 0,
        expected_ctc: p.expected_ctc || 0,
        enabled_for_daily_run: p.enabled_for_daily_run !== false,
        total_applied: s.total_applied || 0,
        applied_today: s.today || 0,
        applied_this_week: s.this_week || 0,
        applied_this_month: s.this_month || 0,
        last_active: s.last_applied_at || p.updated_at || null
      }
    })

    return NextResponse.json({ users })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
