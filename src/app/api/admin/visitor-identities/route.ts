import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { tagVisitorManually, untagVisitor } from '@/lib/visitorIdentity'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * Super-admin manual browser↔identity tags.
 * POST { visitor_id, email } — this browser IS this person (wins over auto-learning).
 * DELETE ?visitor_id= — remove the manual tag.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized, userId } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const body = await req.json().catch(() => ({}))
    const visitorId = (body.visitor_id || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    if (!visitorId || !email || !email.includes('@')) {
      return NextResponse.json({ detail: 'visitor_id and a valid email are required.' }, { status: 400 })
    }

    const userDoc = await db.collection('profiles').findOne(
      { email: exactMatchCI(email) },
      { projection: { user_id: 1 } }
    ) || await db.collection('users').findOne(
      { email: exactMatchCI(email) },
      { projection: { user_id: 1 } }
    )

    const ok = await tagVisitorManually(db, {
      visitor_id: visitorId,
      email,
      user_id: userDoc?.user_id || null,
      taggedBy: userId
    })
    if (!ok) return NextResponse.json({ detail: 'Failed to tag visitor.' }, { status: 500 })
    return NextResponse.json({ status: 'success', visitor_id: visitorId, email, user_id: userDoc?.user_id || null })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to tag visitor.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const visitorId = (req.nextUrl.searchParams.get('visitor_id') || '').trim()
    if (!visitorId) return NextResponse.json({ detail: 'visitor_id is required.' }, { status: 400 })

    const ok = await untagVisitor(db, visitorId)
    return NextResponse.json({ status: ok ? 'success' : 'not_found', visitor_id: visitorId })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to untag visitor.' }, { status: 500 })
  }
}
