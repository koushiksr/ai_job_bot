import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import {
  getEligibleDripSubscriptions,
  dispatchDripPush,
  DRIP_CAMPAIGNS
} from '@/lib/webPushReengagement'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/push-notification/drip
 * Returns audience metrics (anonymous, unpaid, excluded paid) and available drip campaigns.
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

    const { stats } = await getEligibleDripSubscriptions(db)

    const recentDrips = await db.collection('admin_push_logs')
      .find({ target_type: 'reengagement_drip' })
      .sort({ dispatched_at: -1 })
      .limit(10)
      .toArray()

    return NextResponse.json({
      success: true,
      stats,
      campaigns: DRIP_CAMPAIGNS,
      recent_dispatches: recentDrips.map(d => ({
        id: d._id.toString(),
        campaign_id: d.campaign_id,
        campaign_title: d.campaign_title,
        recipient_count: d.recipient_count,
        web_push_delivered: d.web_push_delivered,
        web_push_failed: d.web_push_failed,
        dispatched_at: d.dispatched_at,
        dispatched_by: d.dispatched_by
      }))
    })
  } catch (err: any) {
    console.error('Error fetching drip stats:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/push-notification/drip
 * Dispatches an engaging offer push notification to all eligible anonymous & unpaid browsers.
 */
export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, caller } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const campaignId = body.campaign_id || body.campaignId
    const forceAll = Boolean(body.force_all || body.forceAll)

    const result = await dispatchDripPush(db, {
      campaignId,
      adminUser: caller || 'admin',
      forceAll
    })

    return NextResponse.json({
      success: true,
      message: `✓ Push notification delivered to ${result.delivered} device(s) (${result.failed} failed/uninstalled)!`,
      result
    })
  } catch (err: any) {
    console.error('Error dispatching drip push:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
