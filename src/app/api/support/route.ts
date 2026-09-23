import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { getClientInfo, logUserActivity } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'
import { APP_CONFIG } from '@/config/appConfig'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ tickets: [], stats: {} })
    }

    const { searchParams } = new URL(req.url)
    const filterUserId = searchParams.get('user_id')
    const filterStatus = searchParams.get('status')
    const filterCategory = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '100', 10), 1), 200)

    const { authorized } = await verifyAdminRequest(req, db)

    // If not admin, can only view own tickets if user_id is provided
    if (!authorized) {
      if (!filterUserId) {
        return NextResponse.json(
          { detail: 'Forbidden: Administrator privileges or user_id required.' },
          { status: 403 }
        )
      }

      const userTickets = await db
        .collection('support_requests')
        .find({ user_id: filterUserId.trim() })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray()

      return NextResponse.json({
        tickets: userTickets.map(t => ({
          id: t._id.toString(),
          ticket_id: t.ticket_id,
          user_id: t.user_id || null,
          name: t.name || 'Candidate',
          email: t.email,
          category: t.category || 'general',
          priority: t.priority || 'normal',
          subject: t.subject || 'Support Inquiry',
          message: t.message,
          target_email: t.target_email || APP_CONFIG.supportEmail,
          status: t.status || 'open',
          admin_response: t.admin_response || null,
          resolved_at: t.resolved_at || null,
          created_at: t.created_at,
          updated_at: t.updated_at || t.created_at
        }))
      })
    }

    // Admin view: build filter query
    const query: any = {}
    if (filterUserId && filterUserId.trim()) {
      query.user_id = filterUserId.trim()
    }
    if (filterStatus && filterStatus !== 'all') {
      query.status = filterStatus.trim()
    }
    if (filterCategory && filterCategory !== 'all') {
      query.category = filterCategory.trim()
    }
    if (search && search.trim()) {
      const s = search.trim()
      query.$or = [
        { ticket_id: { $regex: s, $options: 'i' } },
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { subject: { $regex: s, $options: 'i' } },
        { message: { $regex: s, $options: 'i' } },
        { user_id: { $regex: s, $options: 'i' } }
      ]
    }

    const tickets = await db
      .collection('support_requests')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray()

    const [totalCount, openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
      db.collection('support_requests').countDocuments({}),
      db.collection('support_requests').countDocuments({ status: 'open' }),
      db.collection('support_requests').countDocuments({ status: 'in_progress' }),
      db.collection('support_requests').countDocuments({ status: 'resolved' }),
      db.collection('support_requests').countDocuments({ status: 'closed' })
    ])

    return NextResponse.json({
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        ticket_id: t.ticket_id,
        user_id: t.user_id || null,
        name: t.name || 'Candidate',
        email: t.email,
        category: t.category || 'general',
        priority: t.priority || 'normal',
        subject: t.subject || 'Support Inquiry',
        message: t.message,
        target_email: t.target_email || APP_CONFIG.supportEmail,
        status: t.status || 'open',
        admin_response: t.admin_response || null,
        resolved_at: t.resolved_at || null,
        created_at: t.created_at,
        updated_at: t.updated_at || t.created_at
      })),
      stats: {
        total: totalCount,
        open: openCount,
        in_progress: inProgressCount,
        resolved: resolvedCount,
        closed: closedCount
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req, { limit: 8, windowSeconds: 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { detail: `Too many requests submitted. Please wait ${rateCheck.resetSeconds} seconds before submitting again.` },
        { status: 429 }
      )
    }

    const body = await req.json()
    const name = (body.name || '').trim()
    const email = (body.email || '').trim().toLowerCase()
    const category = (body.category || 'general').trim()
    const priority = (body.priority || 'normal').trim()
    const subject = (body.subject || '').trim()
    const message = (body.message || '').trim()
    const userId = (body.user_id || '').trim()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ detail: 'A valid email address is required.' }, { status: 400 })
    }

    if (!message || message.length < 5) {
      return NextResponse.json({ detail: 'Please provide a descriptive query or message.' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { ip, userAgent } = getClientInfo(req)
    const ticketId = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    const now = new Date()

    const ticketDoc = {
      ticket_id: ticketId,
      user_id: userId || null,
      name: name || (email.split('@')[0]),
      email: email,
      category: category,
      priority: ['urgent', 'high', 'normal', 'low'].includes(priority) ? priority : 'normal',
      subject: subject || `Query from ${name || email}`,
      message: message,
      target_email: APP_CONFIG.supportEmail,
      status: 'open',
      admin_response: null,
      resolved_at: null,
      ip_address: ip,
      user_agent: userAgent,
      created_at: now,
      updated_at: now
    }

    await db.collection('support_requests').insertOne(ticketDoc)

    // If candidate is logged in, log inquiry to activity feed
    if (userId) {
      await logUserActivity(db, {
        userId: userId,
        email: email,
        eventType: 'plan_update',
        description: `Submitted query #${ticketId} [${priority.toUpperCase()}]: "${subject || category}" to ${APP_CONFIG.supportEmail}`,
        ipAddress: ip,
        userAgent: userAgent,
        metadata: {
          ticket_id: ticketId,
          category: category,
          priority: priority,
          subject: subject
        }
      })
    }

    return NextResponse.json({
      success: true,
      ticket_id: ticketId,
      target_email: APP_CONFIG.supportEmail,
      message: `Your query has been logged in our priority queue. Administrator ${APP_CONFIG.supportEmail} will review and respond directly.`
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, email: adminEmail } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { ticket_id, status, priority, admin_response } = body

    if (!ticket_id) {
      return NextResponse.json({ detail: 'ticket_id is required' }, { status: 400 })
    }

    const updates: any = { updated_at: new Date() }
    if (status) {
      updates.status = status
      if (status === 'resolved' || status === 'closed') {
        updates.resolved_at = new Date()
      }
    }
    if (priority) {
      updates.priority = priority
    }
    if (admin_response !== undefined) {
      updates.admin_response = admin_response
      updates.responded_by = adminEmail || APP_CONFIG.supportEmail
    }

    const result = await db.collection('support_requests').updateOne(
      { ticket_id: ticket_id.trim() },
      { $set: updates }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ detail: 'Ticket not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'User request / query updated successfully.',
      updates
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
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
    const ticketId = searchParams.get('ticket_id')
    if (!ticketId) {
      return NextResponse.json({ detail: 'ticket_id is required' }, { status: 400 })
    }

    await db.collection('support_requests').deleteOne({ ticket_id: ticketId.trim() })

    return NextResponse.json({
      success: true,
      message: `Query #${ticketId} deleted successfully.`
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
