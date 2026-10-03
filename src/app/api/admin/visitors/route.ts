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
    const viewMode = searchParams.get('view_mode') || searchParams.get('mode') || 'unique_visitors' // 'unique_visitors' | 'events'
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

    // Identity: identified (linked email) vs anonymous lurkers vs tagged by name
    if (identity === 'known') {
      andClauses.push({ email: { $exists: true, $nin: [null, ''] } })
    } else if (identity === 'anonymous') {
      andClauses.push({ $or: [{ email: { $exists: false } }, { email: null }, { email: '' }] })
    } else if (identity === 'tagged') {
      try {
        const taggedDocs = await db.collection('visitors_summary')
          .find(
            { $or: [{ tag_name: { $exists: true, $nin: [null, ''] } }, { alias: { $exists: true, $nin: [null, ''] } }, { manual_tag: true }] },
            { projection: { visitor_id: 1 } }
          )
          .limit(1000)
          .toArray()
        const taggedVids = taggedDocs.map((d: any) => d.visitor_id).filter(Boolean)
        andClauses.push({ visitor_id: { $in: taggedVids } })
      } catch {}
    }

    // Country (matches full name or code)
    if (country && country !== 'all') {
      andClauses.push({ $or: [{ country_name: country }, { country: country }] })
    }

    // Persistent per-admin ignore list: your other accounts, devices and
    // browsers. $nin also matches docs where the field is missing, so
    // anonymous rows survive an email-ignore and vice versa.
    let xEmails: string[] = []
    let xVids: string[] = []
    let xIps: string[] = []
    try {
      const prefDoc = await db.collection('admin_preferences').findOne({ user_id: adminUid })
      const ig = prefDoc?.prefs || {}
      const cleanList = (v: any): string[] =>
        Array.isArray(v)
          ? v.filter((e: any) => typeof e === 'string' && e.trim()).map((e: string) => e.trim()).slice(0, 50)
          : []
      xEmails = cleanList(ig.x_emails).map((e) => e.toLowerCase())
      xVids = cleanList(ig.x_vids)
      xIps = cleanList(ig.x_ips)
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

    // Search query across email, IP, path, visitor_id, user_id, tag_name
    if (search) {
      const regex = new RegExp(escapeRegExp(search), 'i')
      let matchingVids: string[] = []
      try {
        const matchingSummaries = await db.collection('visitors_summary').find(
          { $or: [{ tag_name: regex }, { alias: regex }, { identified_email: regex }] },
          { projection: { visitor_id: 1 } }
        ).limit(100).toArray()
        matchingVids = matchingSummaries.map((s: any) => s.visitor_id).filter(Boolean)
      } catch {}

      query.$or = [
        { email: regex },
        { ip_address: regex },
        { user_id: regex },
        { visitor_id: regex },
        ...(matchingVids.length > 0 ? [{ visitor_id: { $in: matchingVids } }] : []),
        { path: regex },
        { referrer: regex },
        { city: regex },
        { country_name: regex },
        { 'metadata.plan_name': regex },
        { 'metadata.button_label': regex }
      ]
    }

    let formattedEvents: any[] = []
    let formattedVisitors: any[] = []
    let totalCount = 0

    if (viewMode === 'unique_visitors') {
      const summaryQuery: any = {}
      const summaryAnd: any[] = []

      if (excludeAdmin) {
        if (adminEmail) summaryAnd.push({ $nor: [{ identified_email: { $regex: `^${escapeRegExp(adminEmail)}$`, $options: 'i' } }] })
        if (adminUid) summaryAnd.push({ identified_user_id: { $ne: adminUid } })
        summaryAnd.push({ identified_user_id: { $nin: ['technohmsit', 'admin'] } })
      }
      if (excludeVisitorId) {
        summaryAnd.push({ visitor_id: { $ne: excludeVisitorId } })
      }

      if (visitorId && visitorId.trim()) {
        summaryAnd.push({ visitor_id: visitorId.trim() })
      }

      if (identity === 'known') {
        summaryAnd.push({ identified_email: { $exists: true, $nin: [null, ''] } })
      } else if (identity === 'anonymous') {
        summaryAnd.push({ $or: [{ identified_email: { $exists: false } }, { identified_email: null }, { identified_email: '' }] })
      } else if (identity === 'tagged') {
        summaryAnd.push({ $or: [{ tag_name: { $exists: true, $nin: [null, ''] } }, { alias: { $exists: true, $nin: [null, ''] } }, { manual_tag: true }] })
      }

      if (country && country !== 'all') {
        summaryAnd.push({ $or: [{ last_country: country }, { country: country }] })
      }

      if (deviceType && deviceType !== 'all') {
        summaryAnd.push({ last_device: deviceType })
      }

      if (xEmails.length > 0) {
        summaryAnd.push({ $nor: xEmails.map((e) => ({ identified_email: { $regex: `^${escapeRegExp(e)}$`, $options: 'i' } })) })
      }
      if (xVids.length > 0) summaryAnd.push({ visitor_id: { $nin: xVids } })
      if (xIps.length > 0) summaryAnd.push({ last_ip: { $nin: xIps } })

      if (hasPaymentIntent === 'true' || eventType === 'payment_click' || eventType === 'payment_success') {
        summaryAnd.push({ $or: [{ has_payment_intent: true }, { total_payment_clicks: { $gt: 0 } }] })
      }

      if (timeRange === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        summaryAnd.push({ last_seen_at: { $gte: startOfDay } })
      } else if (timeRange === '24h') {
        summaryAnd.push({ last_seen_at: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } })
      } else if (timeRange === '7d') {
        summaryAnd.push({ last_seen_at: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } })
      } else if (timeRange === '30d') {
        summaryAnd.push({ last_seen_at: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } })
      }

      if (search) {
        const regex = new RegExp(escapeRegExp(search), 'i')
        summaryAnd.push({
          $or: [
            { visitor_id: regex },
            { identified_email: regex },
            { identified_user_id: regex },
            { tag_name: regex },
            { alias: regex },
            { last_ip: regex },
            { last_city: regex },
            { last_country: regex },
            { last_path: regex },
            { first_referrer: regex }
          ]
        })
      }

      if (summaryAnd.length > 0) summaryQuery.$and = summaryAnd

      const [rawSummaries, totalSummaries] = await Promise.all([
        db.collection('visitors_summary')
          .find(summaryQuery)
          .sort({ last_seen_at: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('visitors_summary').countDocuments(summaryQuery)
      ])

      totalCount = totalSummaries
      formattedVisitors = rawSummaries.map((s: any) => ({
        id: s._id.toString(),
        visitor_id: s.visitor_id,
        email: s.identified_email || null,
        user_id: s.identified_user_id || null,
        tag_name: s.tag_name || s.alias || null,
        manual: Boolean(s.manual_tag),
        total_page_views: s.total_page_views || 1,
        total_events: s.total_events || 1,
        total_payment_clicks: s.total_payment_clicks || (s.has_payment_intent ? 1 : 0),
        has_payment_intent: Boolean(s.has_payment_intent),
        first_seen_at: s.first_seen_at ? s.first_seen_at.toISOString() : (s.last_seen_at ? s.last_seen_at.toISOString() : new Date().toISOString()),
        last_seen_at: s.last_seen_at ? s.last_seen_at.toISOString() : (s.first_seen_at ? s.first_seen_at.toISOString() : new Date().toISOString()),
        last_ip: s.last_ip || 'unknown',
        last_city: s.last_city || null,
        last_country: s.last_country || 'Unknown',
        last_device: s.last_device || 'desktop',
        last_os: s.last_os || 'Unknown',
        last_browser: s.last_browser || 'Unknown',
        last_path: s.last_path || '/',
        first_referrer: s.first_referrer || 'Direct',
        known_emails: Array.isArray(s.known_emails) ? s.known_emails : (s.identified_email ? [s.identified_email] : []),
        known_ips: Array.isArray(s.known_ips) ? s.known_ips : (s.last_ip ? [s.last_ip] : []),
        known_countries: Array.isArray(s.known_countries) ? s.known_countries : (s.last_country ? [s.last_country] : [])
      }))
    } else {
      const [rawEvents, rawTotal] = await Promise.all([
        db.collection('visitor_events')
          .find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        db.collection('visitor_events').countDocuments(query)
      ])

      totalCount = rawTotal

      // Resolve all visitor IDs to known tags and identities
      let identityMap = new Map<string, { email: string | null; user_id: string | null; manual: boolean; tag_name?: string | null; known_emails?: string[]; known_ips?: string[]; known_countries?: string[] }>()
      try {
        const { getIdentityMap } = await import('@/lib/visitorIdentity')
        const allVids = [...new Set(
          rawEvents.map((e: any) => e.visitor_id).filter(Boolean)
        )]
        identityMap = await getIdentityMap(db, allVids)
      } catch {}

      formattedEvents = rawEvents.map((evt) => {
        const hit = identityMap.get(evt.visitor_id)
        return {
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
          tag_name: hit?.tag_name || null,
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
          linked: hit ? {
            email: hit.email || evt.email || null,
            user_id: hit.user_id || evt.user_id || null,
            tag_name: hit.tag_name || null,
            manual: hit.manual,
            known_emails: hit.known_emails || (hit.email ? [hit.email] : (evt.email ? [evt.email] : [])),
            known_ips: hit.known_ips || (evt.ip_address ? [evt.ip_address] : []),
            known_countries: hit.known_countries || (evt.country_name ? [evt.country_name] : [])
          } : null
        }
      })
    }

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
      db.collection('visitors_summary').countDocuments({ identified_email: { $exists: true, $nin: [null, ''] } }),
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
      view_mode: viewMode,
      visitors: formattedVisitors,
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
