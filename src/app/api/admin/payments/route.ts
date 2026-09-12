import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ payments: [] })
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
        amount: p.plan_id === 'elite' ? '₹3,499' : p.plan_id === 'pro' ? '₹1,499' : '₹499',
        verified_at: p.verified_at || p.created_at || new Date(),
        expires_at: p.expires_at || null,
        status: p.status || 'captured'
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
