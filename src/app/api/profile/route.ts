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
          resume_file: seed.resume_file
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
      resume_file: profile.resume_file || '',
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

    const updateDoc: any = {
      user_id: userId,
      name: body.name || '',
      email: body.email || '',
      experience: Number(body.experience) || 0,
      current_ctc: Number(body.current_ctc) || 0,
      expected_ctc: Number(body.expected_ctc) || 0,
      search_url: body.search_url || '',
      job_filters: body.job_filters || {},
      predefined_answers: body.predefined_answers || {},
      resume_file: body.resume_file || '',
      updated_at: now
    }

    if (body.password) {
      updateDoc.password = body.password
    }

    const versionHash = crypto.createHash('sha256').update(JSON.stringify(updateDoc)).digest('hex').substring(0, 16)
    updateDoc.version_hash = versionHash

    if (db) {
      await db.collection('profiles').updateOne(
        { user_id: userId },
        { $set: updateDoc },
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
