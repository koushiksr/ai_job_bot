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

    const { authorized, userId: adminUid, email: adminEmail } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200)
    const search = (searchParams.get('search') || '').trim()
    const eventType = searchParams.get('event_type')
    const deviceType = searchParams.get('device_type')
    const hasPaymentIntent = searchParams.get('has_payment_intent')
    const visitorId = searchParams.get('visitor_id')
    const timeRange = searchParams.get('time_range') || 'all'
    // Advanced tracking filters
    const excludeAdmin = searchParams.get('exclude_admin') === '1'
    const excludeVisitorId = (searchParams.get('exclude_visitor_id') || '').trim()
    const identity = searchParams.get('identity') // known | anonymous
    const country = (searchParams.get('country') || '').trim()

    // Build MongoDB query
    const query: any = {}
    const andClauses: any[] = []

    // "Hide my trail": drop the admin's own traffic (identified rows by
    // session email/uid, plus same-browser anonymous rows via visitor cookie).
    // $ne also matches docs where the field is missing — anonymous rows survive.
    if (excludeAdmin) {
      if (adminEmail) andClauses.push({ $nor: [{ email: { $regex: `^${escapeRegExp(adminEmail)}$`, $options: 'i' } }] })
      if (adminUid) andClauses.push({ user_id: { $ne: adminUid } })
      andClauses.push({ user_id: { $nin: ['technohmsit', 'admin'] } })
    }
    if (excludeVisitorId) {
      andClauses.push({ visitor_id: { $ne: excludeVisitorId } })
    }

    // Identity: identified (linked email) vs anonymous lurkers
    if (identity === 'known') {
      andClauses.push({ email: { $exists: true, $nin: [null, ''] } })
    } else if (identity === 'anonymous') {
      andClauses.push({ $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] })
    }

    // Country (matches full name or code)
    if (country && country !== 'all') {
      andClauses.push({ $or: [{ country_name: country }, { country: country }] })
    }

    // Persistent per-admin ignore list: your other accounts, devices and
    // browsers. $nin also matches docs where the field is missing, so
    // anonymous rows survive an email-ignore and vice versa.
    try {
      const prefDoc = await db.collection('admin_preferences').findOne({ user_id: adminUid })
      const ig = prefDoc?.prefs || {}
      const cleanList = (v: any): string[] =>
        Array.isArray(v)
          ? v.filter((e: any) => typeof e === 'string' && e.trim()).map((e: string) => e.trim()).slice(0, 50)
          : []
      const xEmails = cleanList(ig.x_emails).map((e) => e.toLowerCase())
      const xVids = cleanList(ig.x_vids)
      const xIps = cleanList(ig.x_ips)
      // Case-insensitive exact email match ($nin would miss differently-cased rows)
      if (xEmails.length > 0) {
        andClauses.push({ $nor: xEmails.map((e) => ({ email: { $regex: `^${escapeRegExp(e)}$`, $options: 'i' } })) })
      }
      if (xVids.length > 0) andClauses.push({ visitor_id: { $nin: xVids } })
      if (xIps.length > 0) andClauses.push({ ip_address: { $nin: xIps } })
    } catch {}

    if (andClauses.length > 0) query.$and = andClauses

    if (visitorId && visitorId.trim()) {
      query.visitor_id = visitorId.trim()
    }

    if (eventType && eventType !== 'all') {
      query.event_type = eventType
    }

    if (deviceType && deviceType !== 'all') {
      query.device_type = deviceType
    }

    if (hasPaymentIntent === 'true') {
      query.event_type = 'payment_click'
    }

    // Time filter
    const now = new Date()
    if (timeRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      query.created_at = { $gte: startOfDay }
    } else if (timeRange === '24h') {
      const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      query.created_at = { $gte: past24h }
    } else if (timeRange === '7d') {
      const past7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      query.created_at = { $gte: past7d }
    } else if (timeRange === '30d') {
      const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      query.created_at = { $gte: past30d }
    }

    // Search query across email, IP, path, visitor_id, user_id
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i')
      query.$or = [
        { email: regex },
        { ip_address: regex },
        { user_id: regex },
        { visitor_id: regex },
        { path: regex },
        { referrer: regex },
        { city: regex },
        { country_name: regex },
        { 'metadata.plan_name': regex },
        { 'metadata.button_label': regex }
      ]
    }

    const skip = (page - 1) * limit

    const [rawEvents, totalCount] = await Promise.all([
      db.collection('visitor_events')
        .find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection('visitor_events').countDocuments(query)
    ])

    // Resolve stored-email-less rows to known browsers (auto-learned at login
    // or manually tagged) so they don't read as anonymous strangers.
    let identityMap = new Map<string, { email: string | null; user_id: string | null; manual: boolean }>()
    try {
      const { getIdentityMap } = await import('@/lib/visitorIdentity')
      const anonVids = [...new Set(
        rawEvents.filter((e: any) => !e.email).map((e: any) => e.visitor_id).filter(Boolean)
      )]
      identityMap = await getIdentityMap(db, anonVids)
    } catch {}

    const formattedEvents = rawEvents.map((evt) => ({
      id: evt._id.toString(),
      visitor_id: evt.visitor_id,
      session_id: evt.session_id,
      event_type: evt.event_type,
      path: evt.path,
      full_url: evt.full_url,
      referrer: evt.referrer,
      title: evt.title,
      email: evt.email,
      user_id: evt.user_id,
      user_name: evt.user_name,
      is_authenticated: Boolean(evt.email || evt.user_id),
      ip_address: evt.ip_address,
      country: evt.country,
      country_name: evt.country_name,
      city: evt.city,
      region: evt.region,
      user_agent: evt.user_agent,
      device_type: evt.device_type,
      os: evt.os,
      browser: evt.browser,
      screen_resolution: evt.screen_resolution,
      language: evt.language,
      metadata: evt.metadata || {},
      created_at: evt.created_at,
      linked: (() => {
        if (evt.email) return null
        const hit = identityMap.get(evt.visitor_id)
        return hit ? { email: hit.email, user_id: hit.user_id, manual: hit.manual } : null
      })()
    }))

    // Calculate system-wide telemetry metrics
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      summaryCount,
      distinctVisitorIds,
      totalPageViews,
      totalPaymentClicks,
      identifiedLeadsCount,
      todayPageViews,
      todayPaymentClicks,
      todayUniqueVisitorsArray,
      topPagesAgg,
      devicesAgg,
      countryList
    ] = await Promise.all([
      db.collection('visitors_summary').countDocuments({}),
      db.collection('visitor_events').distinct('visitor_id'),
      db.collection('visitor_events').countDocuments({ event_type: 'page_view' }),
      db.collection('visitor_events').countDocuments({ event_type: 'payment_click' }),
      db.collection('visitors_summary').countDocuments({ identified_email: { $exists: true, $ne: null } }),
      db.collection('visitor_events').countDocuments({
        event_type: 'page_view',
        created_at: { $gte: startOfToday }
      }),
      db.collection('visitor_events').countDocuments({
        event_type: 'payment_click',
        created_at: { $gte: startOfToday }
      }),
      db.collection('visitor_events').distinct('visitor_id', {
        created_at: { $gte: startOfToday }
      }),
      db.collection('visitor_events').aggregate([
        { $match: { event_type: 'page_view' } },
        { $group: { _id: '$path', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ]).toArray(),
      db.collection('visitor_events').aggregate([
        { $group: { _id: '$device_type', count: { $sum: 1 } } }
      ]).toArray(),
      db.collection('visitor_events').distinct('country_name')
    ])

    const totalUniqueVisitors = Math.max(summaryCount, distinctVisitorIds.length)

    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 }
    devicesAgg.forEach((d: any) => {
      if (d._id) deviceCounts[d._id] = d.count
    })

    const topPages = topPagesAgg.map((p: any) => ({
      path: p._id || '/',
      count: p.count
    }))

    return NextResponse.json({
      events: formattedEvents,
      countries: (countryList || []).filter(Boolean).sort().slice(0, 100),
      metrics: {
        total_unique_visitors: totalUniqueVisitors,
        total_page_views: totalPageViews,
        total_payment_intents: totalPaymentClicks,
        identified_visitors_count: identifiedLeadsCount,
        today_visitors: todayUniqueVisitorsArray.length,
        today_page_views: todayPageViews,
        today_payment_clicks: todayPaymentClicks,
        top_pages: topPages,
        devices_breakdown: deviceCounts
      },
      pagination: {
        page,
        limit,
        total: totalCount,
        total_pages: Math.ceil(totalCount / limit) || 1
      }
    })
  } catch (err: any) {
    console.error('[Admin Visitors API] Error:', err)
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
