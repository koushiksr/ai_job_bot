import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/push-notification
 * Returns recent push notification logs and active candidates.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const logs = await db.collection('admin_push_logs')
      .find({})
      .sort({ dispatched_at: -1 })
      .limit(15)
      .toArray()

    return NextResponse.json({
      recent_logs: logs.map(l => ({
        id: l._id.toString(),
        target_email: l.target_email,
        target_type: l.target_type,
        title: l.title,
        message: l.message,
        claim_url: l.claim_url,
        dispatched_at: l.dispatched_at,
        recipient_count: l.recipient_count || 1,
        status: l.status || 'delivered'
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/push-notification
 * Dispatches a real-time push notification to a specific candidate or all candidates.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, userId, email: adminEmail } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const targetType = body.targetType || 'single'
    const targetEmail = (body.targetEmail || '').toLowerCase().trim()
    const title = (body.title || '').trim() || '⚡ JobFlux AI Priority Alert'
    const message = (body.message || '').trim() || 'You have a new update in your JobFlux AI Cockpit.'
    const claimUrl = (body.claimUrl || '').trim() || '/dashboard'

    const now = new Date()

    if (targetType === 'all' || targetEmail === 'all') {
      // Query all candidate users
      const users = await db.collection('users').find({ email: { $exists: true, $ne: '' } }).toArray()
      const profiles = await db.collection('profiles').find({ email: { $exists: true, $ne: '' } }).toArray()
      
      const allEmails = new Set<string>()
      users.forEach(u => { if (u.email) allEmails.add(u.email.toLowerCase().trim()) })
      profiles.forEach(p => { if (p.email) allEmails.add(p.email.toLowerCase().trim()) })

      // Fallback to default emails if DB has few records
      if (allEmails.size === 0) {
        allEmails.add('koushiksrmedala@gmail.com')
        allEmails.add('koushiksr1999@gmail.com')
      }

      const emailList = Array.from(allEmails)
      const notifDocs = emailList.map(email => ({
        email,
        type: 'admin_push_alert',
        title,
        message,
        claim_url: claimUrl,
        read: false,
        created_at: now
      }))

      if (notifDocs.length > 0) {
        await db.collection('user_notifications').insertMany(notifDocs)
      }

      await db.collection('admin_push_logs').insertOne({
        target_email: 'All Candidates (Broadcast)',
        target_type: 'broadcast',
        recipient_count: emailList.length,
        title,
        message,
        claim_url: claimUrl,
        dispatched_by: adminEmail || userId || 'admin',
        dispatched_at: now,
        status: 'delivered'
      })

      return NextResponse.json({
        success: true,
        target_type: 'broadcast',
        dispatched_count: emailList.length,
        message: `✓ Push notification broadcasted to ${emailList.length} candidate(s)!`
      })
    } else {
      if (!targetEmail) {
        return NextResponse.json({ error: 'Target candidate email is required' }, { status: 400 })
      }

      await db.collection('user_notifications').insertOne({
        email: targetEmail,
        type: 'admin_push_alert',
        title,
        message,
        claim_url: claimUrl,
        read: false,
        created_at: now
      })

      await db.collection('admin_push_logs').insertOne({
        target_email: targetEmail,
        target_type: 'single',
        recipient_count: 1,
        title,
        message,
        claim_url: claimUrl,
        dispatched_by: adminEmail || userId || 'admin',
        dispatched_at: now,
        status: 'delivered'
      })

      return NextResponse.json({
        success: true,
        target_type: 'single',
        dispatched_count: 1,
        target_email: targetEmail,
        message: `✓ Push notification delivered to ${targetEmail}!`
      })
    }
  } catch (err: any) {
    console.error('Push notification dispatch error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
