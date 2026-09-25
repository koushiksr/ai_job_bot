import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, caller } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const referrals = await db.collection('referrals')
      .find({})
      .sort({ created_at: -1 })
      .toArray()

    // Enrich with latest referrer profile info (payout_type, upi_id, bank_details) if updated recently
    const referrerIds = Array.from(new Set(referrals.map(r => r.referrer_id).filter(Boolean)))
    const referrerProfiles = await db.collection('profiles')
      .find({ user_id: { $in: referrerIds } })
      .toArray()

    const profileMap = new Map(referrerProfiles.map(p => [p.user_id, p]))

    const enrichedPayouts = referrals.map(r => {
      const p = profileMap.get(r.referrer_id)
      return {
        ...r,
        referrer_name: p?.name || r.referrer_name || r.referrer_id,
        referrer_email: p?.email || r.referrer_email,
        payout_type: p?.payout_type || r.payout_type || 'upi',
        upi_id: p?.upi_id || r.upi_id || '',
        bank_details: p?.bank_details || r.bank_details || null
      }
    })

    const pending = enrichedPayouts.filter(r => r.status === 'pending_payout')
    const paid = enrichedPayouts.filter(r => r.status === 'paid')

    return NextResponse.json({
      payouts: enrichedPayouts,
      stats: {
        total_referrals: enrichedPayouts.length,
        pending_count: pending.length,
        pending_amount: pending.reduce((sum, r) => sum + (r.reward_amount || 200), 0),
        paid_count: paid.length,
        paid_amount: paid.reduce((sum, r) => sum + (r.reward_amount || 200), 0)
      }
    })
  } catch (err: any) {
    console.error('Error fetching admin payouts:', err)
    return NextResponse.json({ detail: err.message || 'Error fetching payouts' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const { authorized, caller } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator privileges required.' }, { status: 403 })
    }

    const body = await req.json()
    const referralId = (body.referral_id || '').trim()
    const transactionRef = (body.transaction_ref || '').trim()
    const notes = (body.notes || '').trim()

    if (!referralId) {
      return NextResponse.json({ detail: 'referral_id is required' }, { status: 400 })
    }

    const now = new Date()
    const res = await db.collection('referrals').updateOne(
      {
        $or: [
          { referral_id: referralId },
          { _id: (await import('mongodb')).ObjectId.isValid(referralId) ? new (await import('mongodb')).ObjectId(referralId) : null }
        ].filter(Boolean)
      },
      {
        $set: {
          status: 'paid',
          paid_at: now,
          transaction_ref: transactionRef || `DISBURSED_${Date.now()}`,
          disbursed_by: caller || 'admin',
          admin_notes: notes || undefined,
          updated_at: now
        }
      }
    )

    if (res.matchedCount === 0) {
      return NextResponse.json({ detail: 'Referral record not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payout marked as successfully disbursed!',
      referral_id: referralId,
      paid_at: now
    })
  } catch (err: any) {
    console.error('Error disbursing payout:', err)
    return NextResponse.json({ detail: err.message || 'Error updating payout' }, { status: 500 })
  }
}
