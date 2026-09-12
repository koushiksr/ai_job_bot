import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { getClientInfo, logUserActivity } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ tickets: [] })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100)

    const tickets = await db
      .collection('support_requests')
      .find({})
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    return NextResponse.json({
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        ticket_id: t.ticket_id,
        user_id: t.user_id || null,
        name: t.name || 'Candidate',
        email: t.email,
        category: t.category || 'general',
        subject: t.subject || 'Support Inquiry',
        message: t.message,
        target_email: t.target_email || 'technohmsit@gmail.com',
        status: t.status || 'open',
        created_at: t.created_at
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const category = (body.category || 'general').trim()
    const subject = (body.subject || '').trim()
    const message = (body.message || '').trim()
    const userId = (body.user_id || '').trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ detail: 'A valid email address is required.' }, { status: 400 })
    }

    if (!message || message.length < 5) {
      return NextResponse.json({ detail: 'Please provide a clear message describing your inquiry or issue.' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { ip, userAgent } = getClientInfo(req)
    const ticketId = `TICK_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const now = new Date()

    const ticketDoc = {
      ticket_id: ticketId,
      user_id: userId || null,
      name: name || (email.split('@')[0]),
      email: email,
      category: category,
      subject: subject || `Inquiry from ${name || email}`,
      message: message,
      target_email: 'technohmsit@gmail.com',
      status: 'open',
      ip_address: ip,
      user_agent: userAgent,
      created_at: now
    }

    await db.collection('support_requests').insertOne(ticketDoc)

    // If candidate is logged in, log support inquiry to their activity feed
    if (userId) {
      await logUserActivity(db, {
        userId: userId,
        email: email,
        eventType: 'plan_update', // generic engagement event
        description: `Submitted support ticket #${ticketId} to technohmsit@gmail.com`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: {
          ticket_id: ticketId,
          category: category,
          subject: subject
        }
      })
    }

    return NextResponse.json({
      success: true,
      ticket_id: ticketId,
      target_email: 'technohmsit@gmail.com',
      message: 'Your inquiry has been delivered directly to our support queue. A representative will contact you at your email from technohmsit@gmail.com.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
