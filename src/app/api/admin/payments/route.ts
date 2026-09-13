import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ payments: [] })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json(
        { detail: 'Forbidden: Administrator privileges required.' },
        { status: 403 }
      )
    }

    const payments = await db
      .collection('payments')
      .find({})
      .sort({ verified_at: -1, created_at: -1 })
      .limit(100)
      .toArray()

    return NextResponse.json({
      payments: payments.map(p => ({
        id: p._id.toString(),
        order_id: p.order_id,
        payment_id: p.payment_id,
        user_id: p.user_id || 'guest',
        email: p.email || 'N/A',
        plan_id: p.plan_id,
        amount: p.amount || (p.plan_id === 'elite' || p.plan_id === 'professional' ? '₹199' : '₹99'),
        verified_at: p.verified_at || p.created_at || new Date(),
        expires_at: p.expires_at || null,
        status: p.status || 'captured'
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
