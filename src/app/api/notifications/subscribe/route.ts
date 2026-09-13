import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications/subscribe?email=...
 * Check if the candidate has active background push subscriptions.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = (searchParams.get('email') || '').toLowerCase().trim()

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ subscribed: false, count: 0 })
    }

    const query = email ? { email } : {}
    const count = await db.collection('push_subscriptions').countDocuments(query)

    return NextResponse.json({
      subscribed: count > 0,
      count
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/notifications/subscribe
 * Register a browser device subscription for background push notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { subscription, email, userId } = body

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'Invalid push subscription payload. Missing endpoint or encryption keys.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const cleanEmail = (email || '').toLowerCase().trim()
    const now = new Date()

    // Upsert subscription into MongoDB push_subscriptions collection
    await db.collection('push_subscriptions').updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          },
          email: cleanEmail,
          user_id: userId || null,
          user_agent: req.headers.get('user-agent') || '',
          updated_at: now
        },
        $setOnInsert: {
          created_at: now
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      message: 'Device successfully registered for background push notifications.'
    })
  } catch (err: any) {
    console.error('Push subscription registration error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications/subscribe
 * Unregister a device endpoint when notifications are disabled.
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required to unsubscribe' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    await db.collection('push_subscriptions').deleteOne({ endpoint })

    return NextResponse.json({ success: true, message: 'Unsubscribed successfully.' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
