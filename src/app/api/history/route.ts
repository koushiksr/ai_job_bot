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
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      query.applied_at = { $gte: start }
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

    const jobs = rawJobs.map(doc => ({
      id: String(doc._id),
      date: doc.applied_at ? new Date(doc.applied_at).toISOString().replace('T', ' ').substring(0, 19) : '',
      title: doc.job_title || 'Unknown Title',
      company: doc.company || 'Unknown Company',
      location: doc.location || 'India',
      url: doc.job_url || '',
      status: doc.status || 'applied',
      score: doc.match_score || 0
    }))

    const pages = Math.max(1, Math.ceil(total / limit))
    return NextResponse.json({ jobs, total, page, limit, pages })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
