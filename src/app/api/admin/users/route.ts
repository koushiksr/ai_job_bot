import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { SEED_CANDIDATES, ensureDbSeeded } from '@/lib/seedData'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (db) {
      await ensureDbSeeded(db)
      const profiles = await db.collection('profiles').find({}).toArray()
      const statsList = await db.collection('user_stats').find({}).toArray()

      if (profiles && profiles.length > 0) {
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
            total_applied: s.total_applied || 0,
            applied_today: s.today || 0,
            applied_this_week: s.this_week || 0,
            applied_this_month: s.this_month || 0,
            last_active: s.last_applied_at || p.updated_at || null
          }
        })

        return NextResponse.json({ users })
      }
    }

    // Default Seed Fallback if database collection is initializing
    const defaultUsers = Object.values(SEED_CANDIDATES).map(c => ({
      id: c.user_id,
      user_id: c.user_id,
      name: c.name,
      email: c.email,
      experience: c.experience,
      current_ctc: c.current_ctc,
      expected_ctc: c.expected_ctc,
      total_applied: c.stats.total_applied,
      applied_today: c.stats.today,
      applied_this_week: c.stats.this_week,
      applied_this_month: c.stats.this_month,
      last_active: c.stats.last_applied_at
    }))

    return NextResponse.json({ users: defaultUsers })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
