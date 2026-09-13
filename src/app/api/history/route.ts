import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

/**
 * Extracts the company name from a Naukri job-listings URL slug.
 * Naukri slugs follow the pattern:
 *   /job-listings-<role-slug>-<company-slug>-<location-slug>-<exp>-<jobid>
 *
 * Examples:
 *   /job-listings-python-developer-gen-ai-infosys-pune-3-to-5-years-040826033708
 *   → strips ID, exp, location → role slug "python-developer-gen-ai" + company "infosys"
 *   → returns "Infosys"
 *
 * Returns null when the company cannot be reliably extracted.
 */
function extractCompanyFromNaukriUrl(url: string, jobTitle: string = ''): string | null {
  if (!url || !url.includes('/job-listings-')) return null

  const match = url.match(/\/job-listings-([a-z0-9-]+?)(?:\?|$)/i)
  if (!match) return null

  let slug = match[1].toLowerCase()

  // Strip trailing numeric job ID (8-16 digit number)
  slug = slug.replace(/-\d{8,16}$/, '')

  // Strip experience suffix: -3-to-5-years, -0-to-1-years, etc.
  slug = slug.replace(/-\d+(?:-to-\d+)?-years?$/, '')

  // List of Indian cities to strip from the end of the slug
  const locations = [
    'hyderabad-secunderabad', 'hyderabad', 'secunderabad',
    'bengaluru-bangalore', 'bengaluru', 'bangalore',
    'pune', 'mumbai', 'navi-mumbai', 'thane',
    'delhi-ncr', 'new-delhi', 'noida', 'greater-noida',
    'gurgaon-gurugram', 'gurgaon', 'gurugram',
    'chennai', 'kolkata', 'ahmedabad', 'surat', 'jaipur',
    'kochi', 'coimbatore', 'indore', 'bhubaneswar',
    'remote', 'hybrid', 'anywhere-in-india', 'pan-india', 'work-from-home'
  ]
  for (const loc of locations) {
    if (slug.endsWith('-' + loc)) {
      slug = slug.slice(0, -(loc.length + 1))
      break
    }
  }

  // Strip multiple locations (Naukri sometimes lists 2-3 cities):
  // run a second pass
  for (const loc of locations) {
    if (slug.endsWith('-' + loc)) {
      slug = slug.slice(0, -(loc.length + 1))
      break
    }
  }

  // Normalise job title to a slug for stripping from the start
  if (jobTitle) {
    const titleSlug = jobTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    // Try progressively shorter title prefix matches
    const titleTokens = titleSlug.split('-').filter(Boolean)
    for (let len = titleTokens.length; len >= 2; len--) {
      const prefix = titleTokens.slice(0, len).join('-')
      if (slug.startsWith(prefix + '-')) {
        const remaining = slug.slice(prefix.length + 1)
        if (remaining && remaining.length >= 2) {
          return toTitleCase(remaining)
        }
        break
      }
    }
  }

  // Heuristic: last 1-3 hyphenated tokens are likely the company
  const tokens = slug.split('-').filter(Boolean)
  if (tokens.length >= 2) {
    // Take last 1-4 tokens as company (handles "Tiger Analytics", "Infosys BPM", etc.)
    // Avoid returning long strings that are actually part of the role slug
    const companyTokens = tokens.slice(-Math.min(4, Math.ceil(tokens.length / 2)))
    return toTitleCase(companyTokens.join('-'))
  }

  return null
}

function toTitleCase(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b[a-z]/g, c => c.toUpperCase()).trim()
}

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

    // Resolve whether this user holds a Professional (or higher) plan — only pro users receive job URLs
    let isProfessional = false
    try {
      const profile = await db.collection('profiles').findOne(
        { user_id: userId },
        { projection: { plan: 1, role: 1, is_vip: 1, vip_access: 1, plan_expires_at: 1 } }
      )
      const user = await db.collection('users').findOne(
        { $or: [{ user_id: userId }, { email: userId }] },
        { projection: { plan: 1, role: 1, is_vip: 1, vip_access: 1, plan_expires_at: 1 } }
      )

      const activeDoc = profile || user
      const plan = (activeDoc?.plan || user?.plan || '').toLowerCase()
      const role = activeDoc?.role || user?.role || 'user'
      const isVip = Boolean(activeDoc?.is_vip || activeDoc?.vip_access || user?.is_vip || user?.vip_access)
      const now = new Date()
      const expires = activeDoc?.plan_expires_at ? new Date(activeDoc.plan_expires_at) : null
      const isPlanActive = plan === 'vip' || isVip || (expires ? expires > now : true)

      isProfessional = (
        isVip ||
        plan === 'vip' ||
        plan === 'elite' ||
        plan === 'professional' ||
        plan === 'enterprise' ||
        role === 'admin'
      ) && isPlanActive
    } catch {
      // If lookup fails, default to non-pro (fail safe)
      isProfessional = false
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

      // Resolve company: use stored value; if it is a placeholder, try to extract from URL
      const storedCompany = doc.company || ''
      const isUnknownCompany = !storedCompany ||
        storedCompany === 'Unknown Company' ||
        storedCompany === 'Unknown' ||
        storedCompany === 'Confidential'

      let resolvedCompany = storedCompany
      if (isUnknownCompany && doc.job_url) {
        const extracted = extractCompanyFromNaukriUrl(doc.job_url, doc.job_title || '')
        if (extracted) resolvedCompany = extracted
      }
      if (!resolvedCompany) resolvedCompany = 'Unknown Company'

      return {
        id: String(doc._id),
        date: formattedDate || rawIso || '',
        raw_date: rawIso,
        title: doc.job_title || 'Unknown Title',
        company: resolvedCompany,
        // Job redirect URLs are a Professional-plan exclusive feature.
        // For non-pro users, never return a raw URL or string literal that could be treated as a relative link.
        url: isProfessional && doc.job_url && doc.job_url !== '__locked__' ? doc.job_url : '',
        is_url_locked: !isProfessional && Boolean(doc.job_url && doc.job_url !== '__locked__'),
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
