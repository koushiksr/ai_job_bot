import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { escapeRegExp } from '@/lib/query'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/notifications — what users actually received.
 * Merges dispatch audit (admin_push_logs), push/in-app (user_notifications)
 * and mail log (emails). Filter by recipient email + channel.
 * Params: ?email= &channel=email|push|alert|all &limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const emailQ = (searchParams.get('email') || '').trim()
    const channel = (searchParams.get('channel') || 'all').toLowerCase()
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 200)
    const emailRx = emailQ ? new RegExp(escapeRegExp(emailQ), 'i') : null

    const out: any[] = []

    if (channel === 'all' || channel === 'push' || channel === 'alert') {
      const q: any = {}
      if (emailRx) q.target_email = emailRx
      if (channel === 'push') q.channel = { $in: ['both', 'push'] }
      if (channel === 'alert') q.channel = 'admin_alert'
      const docs = await db.collection('admin_push_logs')
        .find(q, { projection: { target_email: 1, user_id: 1, title: 1, message: 1, channel: 1, type: 1, status: 1, dispatched_at: 1, created_at: 1 } })
        .sort({ dispatched_at: -1, created_at: -1 })
        .limit(limit)
        .toArray()
      for (const d of docs) {
        out.push({
          id: d._id.toString(),
          kind: d.channel === 'admin_alert' ? 'admin_alert' : 'dispatch',
          channel: d.channel || 'both',
          email: d.target_email || '',
          user_id: d.user_id || '',
          title: d.title || d.type || 'Notification',
          message: d.message || d.error || '',
          status: d.status || '',
          at: d.dispatched_at || d.created_at || null
        })
      }
    }

    if (channel === 'all' || channel === 'push') {
      const q: any = {}
      if (emailRx) q.$or = [{ user_email: emailRx }, { email: emailRx }]
      const docs = await db.collection('user_notifications')
        .find(q, { projection: { user_email: 1, email: 1, user_id: 1, title: 1, message: 1, url: 1, type: 1, read: 1, created_at: 1 } })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray()
      for (const d of docs) {
        out.push({
          id: d._id.toString(),
          kind: 'push',
          channel: 'push',
          email: d.user_email || d.email || '',
          user_id: d.user_id || '',
          title: d.title || 'Push notification',
          message: d.message || '',
          status: d.read ? 'read' : 'sent',
          at: d.created_at || null
        })
      }
    }

    if (channel === 'all' || channel === 'email') {
      const q: any = {}
      if (emailRx) q.to = emailRx
      const docs = await db.collection('emails')
        .find(q, { projection: { to: 1, from: 1, subject: 1, html_preview: 1, status: 1, provider: 1, created_at: 1 } })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray()
      for (const d of docs) {
        out.push({
          id: d._id.toString(),
          kind: 'email',
          channel: 'email',
          email: Array.isArray(d.to) ? d.to.join(', ') : (d.to || ''),
          user_id: '',
          title: d.subject || '(no subject)',
          message: (d.html_preview || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220),
          status: d.status || '',
          at: d.created_at || null
        })
      }
    }

    out.sort((a, b) => {
      const ta = a.at ? new Date(a.at).getTime() : 0
      const tb = b.at ? new Date(b.at).getTime() : 0
      return tb - ta
    })

    return NextResponse.json({ status: 'success', total: out.length, notifications: out.slice(0, limit) })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to load notifications.' }, { status: 500 })
  }
}
