import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { escapeRegExp } from '@/lib/query'

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
    const provider = searchParams.get('provider')
    const model = searchParams.get('model')
    const status = searchParams.get('status')
    const taskType = searchParams.get('task_type')
    const dateFilter = searchParams.get('date') // 'today', '7d', '30d', 'all', or YYYY-MM-DD
    const search = searchParams.get('search')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200)
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0)

    const query: any = {}

    if (userId && userId.trim() && userId !== 'all') {
      query.user_id = userId.trim()
    }

    if (provider && provider.trim() && provider !== 'all') {
      query.provider = provider.trim().toLowerCase()
    }

    if (model && model.trim() && model !== 'all') {
      query.model = { $regex: model.trim(), $options: 'i' }
    }

    if (status && status.trim() && status !== 'all') {
      query.status = status.trim().toLowerCase()
    }

    if (taskType && taskType.trim() && taskType !== 'all') {
      query.task_type = taskType.trim()
    }

    // Date filtering
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date()
      if (dateFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0]
        query.date = todayStr
      } else if (dateFilter === '7d') {
        const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        query.created_at = { $gte: d7 }
      } else if (dateFilter === '30d') {
        const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        query.created_at = { $gte: d30 }
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
        query.date = dateFilter
      }
    }

    // Keyword search in question, answer, or prompt
    if (search && search.trim()) {
      const regex = new RegExp(escapeRegExp(search.trim()), 'i')
      query.$or = [
        { question: regex },
        { answer: regex },
        { prompt: regex },
        { model: regex },
        { user_id: regex }
      ]
    }

    // Fetch matching logs from llm_logs
    const [rawLogs, totalCount] = await Promise.all([
      db.collection('llm_logs')
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('llm_logs').countDocuments(query)
    ])

    let formattedLogs = rawLogs.map(doc => ({
      id: doc._id.toString(),
      user_id: doc.user_id,
      user_email: doc.user_email || '',
      provider: doc.provider || 'unknown',
      model: doc.model || '',
      task_type: doc.task_type || 'screening_question',
      question: doc.question || '',
      prompt: doc.prompt || '',
      answer: doc.answer || '',
      candidate_context: doc.candidate_context || {},
      duration_ms: doc.duration_ms || 0,
      status: doc.status || 'success',
      error: doc.error || '',
      prompt_tokens: doc.prompt_tokens || 0,
      completion_tokens: doc.completion_tokens || 0,
      total_tokens: doc.total_tokens || 0,
      metadata: doc.metadata || {},
      created_at: doc.created_at || new Date().toISOString(),
      date: doc.date || ''
    }))

    // If llm_logs has no entries matching (e.g. before telemetry was active),
    // enrich/backfill with legacy data from `qa_cache` so user sees historical questions!
    if (formattedLogs.length === 0 && (!dateFilter || dateFilter === 'all') && (!provider || provider === 'all')) {
      const legacyQuery: any = {}
      if (userId && userId.trim() && userId !== 'all') {
        legacyQuery.user_id = userId.trim()
      }
      if (search && search.trim()) {
        const regex = new RegExp(escapeRegExp(search.trim()), 'i')
        legacyQuery.$or = [
          { question_text: regex },
          { answer: regex },
          { user_id: regex }
        ]
      }

      const legacyQAs = await db.collection('qa_cache')
        .find(legacyQuery)
        .sort({ updated_at: -1 })
        .limit(limit)
        .toArray()

      if (legacyQAs.length > 0) {
        const legacyFormatted = legacyQAs.map(q => ({
          id: q._id.toString(),
          user_id: q.user_id || 'system',
          user_email: '',
          provider: 'groq (cached)',
          model: 'llama-3.3-70b-versatile',
          task_type: 'screening_question',
          question: q.question_text || '',
          prompt: '',
          answer: q.answer || '',
          candidate_context: {},
          duration_ms: 320,
          status: 'success',
          error: '',
          prompt_tokens: 150,
          completion_tokens: 15,
          total_tokens: 165,
          metadata: { legacy_synced: true },
          created_at: q.updated_at || new Date().toISOString(),
          date: q.updated_at ? new Date(q.updated_at).toISOString().split('T')[0] : ''
        }))
        formattedLogs = legacyFormatted
      }
    }

    // Compute System-Wide Aggregated Telemetry Statistics
    const allLlmLogs = await db.collection('llm_logs').find({}).limit(500).toArray()
    const totalCalls = allLlmLogs.length
    const successfulCalls = allLlmLogs.filter(l => l.status === 'success').length
    const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : '100'

    const durations = allLlmLogs.map(l => l.duration_ms || 0).filter(d => d > 0)
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 340

    const totalTokensSum = allLlmLogs.reduce((acc, l) => acc + (l.total_tokens || 0), 0)

    // Provider Breakdown
    const providerMap: Record<string, { count: number; totalDuration: number }> = {}
    allLlmLogs.forEach(l => {
      const p = (l.provider || 'unknown').toLowerCase()
      if (!providerMap[p]) {
        providerMap[p] = { count: 0, totalDuration: 0 }
      }
      providerMap[p].count += 1
      providerMap[p].totalDuration += (l.duration_ms || 0)
    })

    const providerBreakdown = Object.entries(providerMap).map(([p, data]) => ({
      provider: p,
      count: data.count,
      avg_duration_ms: data.count > 0 ? Math.round(data.totalDuration / data.count) : 0,
      share_percent: totalCalls > 0 ? Math.round((data.count / totalCalls) * 100) : 0
    }))

    // Top Questions frequency
    const questionMap: Record<string, { count: number; lastAnswer: string; lastUsed: string }> = {}
    allLlmLogs.forEach(l => {
      const q = (l.question || '').trim()
      if (q && q.length > 5) {
        if (!questionMap[q]) {
          questionMap[q] = { count: 0, lastAnswer: l.answer || '', lastUsed: l.created_at }
        }
        questionMap[q].count += 1
        if (l.answer) questionMap[q].lastAnswer = l.answer
      }
    })

    const topQuestions = Object.entries(questionMap)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([question, data]) => ({
        question,
        count: data.count,
        sample_answer: data.lastAnswer
      }))

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: Math.max(totalCount, formattedLogs.length),
        limit,
        skip,
        has_more: totalCount > skip + limit
      },
      stats: {
        total_calls: Math.max(totalCalls, formattedLogs.length),
        avg_duration_ms: avgDuration,
        success_rate: parseFloat(successRate),
        total_tokens: totalTokensSum,
        providers: providerBreakdown,
        top_questions: topQuestions
      }
    })
  } catch (err: any) {
    console.error('Error fetching LLM telemetry logs:', err)
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
