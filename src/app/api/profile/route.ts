import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { SEED_CANDIDATES, ensureDbSeeded } from '@/lib/seedData'
import crypto from 'crypto'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }

    const ifNoneMatch = req.headers.get('if-none-match')
    let profile: any = null

    const db = await getDb()
    if (db) {
      await ensureDbSeeded(db)
      profile = await db.collection('profiles').findOne({ user_id: userId })
    }

    // Fallback to seed if not in database
    if (!profile) {
      const seed = SEED_CANDIDATES[userId]
      if (seed) {
        profile = {
          user_id: seed.user_id,
          name: seed.name,
          email: seed.email,
          password: seed.password,
          experience: seed.experience,
          current_ctc: seed.current_ctc,
          expected_ctc: seed.expected_ctc,
          search_url: seed.search_url,
          job_filters: seed.job_filters,
          predefined_answers: seed.predefined_answers || {},
          resume_filename: seed.resume_filename
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ detail: 'Profile not found' }, { status: 404 })
    }

    const versionHash = profile.version_hash || crypto.createHash('sha256').update(JSON.stringify(profile)).digest('hex').substring(0, 16)

    // 304 Not Modified Caching
    if (ifNoneMatch && ifNoneMatch === `"${versionHash}"`) {
      return new NextResponse(null, { status: 304 })
    }

    const responseData = {
      user_id: profile.user_id,
      name: profile.name || '',
      email: profile.email || '',
      experience: profile.experience || 0,
      current_ctc: profile.current_ctc || 0,
      expected_ctc: profile.expected_ctc || 0,
      search_url: profile.search_url || '',
      job_filters: profile.job_filters || {},
      predefined_answers: profile.predefined_answers || {},
      resume_filename: profile.resume_filename || `${userId}_Resume.pdf`,
      raw_json: JSON.stringify(profile, null, 2),
      version_hash: versionHash
    }

    const res = NextResponse.json(responseData)
    res.headers.set('ETag', `"${versionHash}"`)
    res.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    return res
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const userId = body.user_id
    if (!userId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()

    let existing: any = null
    if (db) {
      existing = await db.collection('profiles').findOne({ user_id: userId })
    }

    // If raw_json was provided directly, parse and merge
    let parsedRaw: any = {}
    if (body.raw_json && typeof body.raw_json === 'string') {
      try {
        parsedRaw = JSON.parse(body.raw_json)
      } catch {}
    }

    const updateDoc: any = {
      user_id: userId,
      name: body.name !== undefined ? body.name : (parsedRaw.name || existing?.name || ''),
      email: body.email !== undefined ? body.email : (parsedRaw.email || existing?.email || ''),
      experience: body.experience !== undefined ? Number(body.experience) : (parsedRaw.experience !== undefined ? Number(parsedRaw.experience) : (existing?.experience || 0)),
      current_ctc: body.current_ctc !== undefined ? Number(body.current_ctc) : (parsedRaw.current_ctc !== undefined ? Number(parsedRaw.current_ctc) : (existing?.current_ctc || 0)),
      expected_ctc: body.expected_ctc !== undefined ? Number(body.expected_ctc) : (parsedRaw.expected_ctc !== undefined ? Number(parsedRaw.expected_ctc) : (existing?.expected_ctc || 0)),
      search_url: body.search_url !== undefined ? body.search_url : (parsedRaw.search_url || existing?.search_url || ''),
      job_filters: body.job_filters !== undefined ? body.job_filters : (parsedRaw.job_filters || existing?.job_filters || {}),
      predefined_answers: body.predefined_answers !== undefined ? body.predefined_answers : (parsedRaw.predefined_answers || existing?.predefined_answers || {}),
      skills: body.skills !== undefined ? body.skills : (parsedRaw.skills || existing?.skills || []),
      resume_filename: body.resume_filename || parsedRaw.resume_filename || existing?.resume_filename || `${userId}_Resume.pdf`,
      updated_at: now
    }

    if (body.password || parsedRaw.password) {
      updateDoc.password = body.password || parsedRaw.password
    } else if (existing?.password) {
      updateDoc.password = existing.password
    }

    if (body.enabled_for_daily_run !== undefined) {
      updateDoc.enabled_for_daily_run = Boolean(body.enabled_for_daily_run)
    } else if (existing?.enabled_for_daily_run !== undefined) {
      updateDoc.enabled_for_daily_run = existing.enabled_for_daily_run
    }

    const versionHash = crypto.createHash('sha256').update(JSON.stringify(updateDoc)).digest('hex').substring(0, 16)
    updateDoc.version_hash = versionHash

    if (db) {
      await db.collection('profiles').updateOne(
        { user_id: userId },
        { 
          $set: updateDoc,
          $unset: { resume_file: "" }
        },
        { upsert: true }
      )
    }

    return NextResponse.json({
      status: 'success',
      profile: updateDoc,
      version_hash: versionHash
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }

    const db = await getDb()
    if (db) {
      await db.collection('profiles').deleteOne({ user_id: userId })
      await db.collection('user_stats').deleteOne({ user_id: userId })
    }

    return NextResponse.json({ status: 'success', deleted: userId })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
