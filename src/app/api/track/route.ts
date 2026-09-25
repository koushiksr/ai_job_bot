import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

const COUNTRY_NAMES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  NL: 'Netherlands',
  JP: 'Japan',
  BR: 'Brazil'
}

function parseUserAgentDetails(ua: string) {
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
  let os = 'Other'
  let browser = 'Other'

  // Device & OS detection
  if (/iPad|tablet/i.test(ua)) {
    deviceType = 'tablet'
    os = 'iPadOS'
  } else if (/iPhone|iPod/i.test(ua)) {
    deviceType = 'mobile'
    os = 'iOS'
  } else if (/Android/i.test(ua)) {
    deviceType = /Mobile/i.test(ua) ? 'mobile' : 'tablet'
    os = 'Android'
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    deviceType = 'desktop'
    os = 'macOS'
  } else if (/Windows NT/i.test(ua)) {
    deviceType = 'desktop'
    os = 'Windows'
  } else if (/Linux/i.test(ua)) {
    deviceType = 'desktop'
    os = 'Linux'
  }

  // Browser detection
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge'
  } else if (/Chrome\//i.test(ua) || /CriOS\//i.test(ua)) {
    browser = 'Google Chrome'
  } else if (/Safari\//i.test(ua) && !/Chrome|CriOS|Edg/i.test(ua)) {
    browser = 'Apple Safari'
  } else if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) {
    browser = 'Mozilla Firefox'
  } else if (/OPR\//i.test(ua)) {
    browser = 'Opera'
  }

  return { deviceType, os, browser }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    try {
      const text = await req.text()
      if (text && text.trim()) {
        body = JSON.parse(text)
      }
    } catch {
      try {
        body = await req.json()
      } catch {
        body = {}
      }
    }

    const { ip, userAgent } = getClientInfo(req)
    const { deviceType, os, browser } = parseUserAgentDetails(userAgent)

    // Extract geo-location headers from Cloudflare / Vercel
    const headers = req.headers
    const countryCode = (
      headers.get('cf-ipcountry') ||
      headers.get('x-vercel-ip-country') ||
      headers.get('x-country') ||
      ''
    ).toUpperCase()

    const city =
      headers.get('x-vercel-ip-city') ||
      headers.get('cf-ipcity') ||
      headers.get('x-city') ||
      ''

    const region =
      headers.get('x-vercel-ip-country-region') ||
      headers.get('cf-region') ||
      ''

    const countryName = COUNTRY_NAMES[countryCode] || countryCode || (ip === '127.0.0.1' ? 'Local Development' : 'Unknown')

    const visitorId = (body.visitor_id || '').trim() || 'anon_' + Math.random().toString(36).slice(2, 10)
    const sessionId = (body.session_id || '').trim() || 'sess_' + Math.random().toString(36).slice(2, 10)
    const eventType = body.event_type || 'page_view'
    const path = (body.path || '/').split('?')[0]
    const fullUrl = body.full_url || ''
    const referrer = body.referrer || 'Direct'
    const title = body.title || ''
    const email = (body.email || '').trim().toLowerCase()
    const userId = (body.user_id || '').trim()
    const userName = (body.user_name || '').trim()
    const screenResolution = body.screen_resolution || ''
    const language = body.language || ''
    const metadata = body.metadata && typeof body.metadata === 'object' ? body.metadata : {}
    const now = new Date()

    const eventDoc = {
      visitor_id: visitorId,
      session_id: sessionId,
      event_type: eventType,
      path,
      full_url: fullUrl,
      referrer,
      title,
      email: email || null,
      user_id: userId || null,
      user_name: userName || null,
      is_authenticated: Boolean(email || userId),
      ip_address: ip,
      country: countryCode || null,
      country_name: countryName,
      city: city ? decodeURIComponent(city) : null,
      region: region || null,
      user_agent: userAgent,
      device_type: deviceType,
      os,
      browser,
      screen_resolution: screenResolution,
      language,
      metadata,
      created_at: now
    }

    const db = await getDb()
    if (db) {
      // 1. Insert into visitor_events audit collection
      await db.collection('visitor_events').insertOne(eventDoc)

      // 2. Upsert into visitors_summary
      const summaryUpdate: any = {
        $set: {
          last_seen_at: now,
          last_ip: ip,
          last_path: path,
          last_device: deviceType,
          last_os: os,
          last_browser: browser,
          last_country: countryName,
          last_city: city ? decodeURIComponent(city) : null
        },
        $setOnInsert: {
          visitor_id: visitorId,
          first_seen_at: now,
          first_referrer: referrer
        },
        $inc: {
          total_events: 1,
          ...(eventType === 'page_view' ? { total_page_views: 1 } : {}),
          ...(eventType === 'payment_click' ? { total_payment_clicks: 1 } : {})
        }
      }

      // NOTE: identified_email/user_id are maintained by linkVisitorToUser()
      // below (manual-tag aware) — never $set them here, or a later login on
      // the same browser would silently clobber a super-admin manual tag.
      if (eventType === 'payment_click') {
        summaryUpdate.$set.has_payment_intent = true
        summaryUpdate.$set.last_payment_intent_at = now
      }

      await db.collection('visitors_summary').updateOne(
        { visitor_id: visitorId },
        summaryUpdate,
        { upsert: true }
      )

      // Bind this browser to the identity (auto-learned). Never overwrites a
      // different manual super-admin tag — see lib/visitorIdentity.
      if (email) {
        try {
          const { linkVisitorToUser } = await import('@/lib/visitorIdentity')
          await linkVisitorToUser(db, { visitor_id: visitorId, email, user_id: userId || null })
        } catch {}
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err: any) {
    console.error('[Track Route] Telemetry error:', err)
    return NextResponse.json({ status: 'error', detail: err.message }, { status: 500 })
  }
}
