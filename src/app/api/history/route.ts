import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const search = (searchParams.get('search') || '').trim()
    const statusFilter = searchParams.get('status') || 'all'
    const dateFilter = searchParams.get('date') || 'all'

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ jobs: [], total: 0, page, limit, pages: 1 })
    }

    const query: any = { user_id: userId }

    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter
    }

    if (search) {
      query.$or = [
        { job_title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ]
    }

    const now = new Date()
    if (dateFilter === 'today') {
      const istOffsetMs = 5.5 * 60 * 60 * 1000
      const istNow = new Date(now.getTime() + istOffsetMs)
      const startIst = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0) - istOffsetMs)
      query.applied_at = { $gte: startIst }
    } else if (dateFilter === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      query.applied_at = { $gte: start }
    } else if (dateFilter === 'month') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      query.applied_at = { $gte: start }
    }

    const total = await db.collection('applied_jobs').countDocuments(query)
    const skip = (page - 1) * limit

    const rawJobs = await db
      .collection('applied_jobs')
      .find(query)
      .sort({ applied_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const jobs = rawJobs.map(doc => {
      let formattedDate = ''
      let rawIso = ''
      if (doc.applied_at) {
        const d = new Date(doc.applied_at)
        if (!isNaN(d.getTime())) {
          rawIso = d.toISOString()
          try {
            const istFormatter = new Intl.DateTimeFormat('en-CA', {
              timeZone: 'Asia/Kolkata',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })
            formattedDate = istFormatter.format(d).replace(', ', ' ')
          } catch {
            const istMs = d.getTime() + 5.5 * 3600 * 1000
            const istD = new Date(istMs)
            const pad = (n: number) => n.toString().padStart(2, '0')
            formattedDate = `${istD.getUTCFullYear()}-${pad(istD.getUTCMonth() + 1)}-${pad(istD.getUTCDate())} ${pad(istD.getUTCHours())}:${pad(istD.getUTCMinutes())}:${pad(istD.getUTCSeconds())}`
          }
        }
      }

      return {
        id: String(doc._id),
        date: formattedDate || rawIso || '',
        raw_date: rawIso,
        title: doc.job_title || 'Unknown Title',
        company: doc.company || 'Unknown Company',
        url: doc.job_url || '',
        status: doc.status || 'applied',
        score: doc.match_score || 0
      }
    })

    const pages = Math.max(1, Math.ceil(total / limit))
    return NextResponse.json({ jobs, total, page, limit, pages })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
