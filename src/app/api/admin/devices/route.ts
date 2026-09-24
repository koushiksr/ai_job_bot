import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { shortDeviceId } from '@/lib/device'

export const dynamic = 'force-dynamic'

/**
 * Super-admin device trust exceptions.
 * GET    → recent login events (who/when/what, short) + known device inventory
 * POST   { device_id, label? } → mark device trusted (your devices)
 * DELETE ?device_id=           → revoke trust
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const limit = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 1), 200)

    const [logins, devices] = await Promise.all([
      db.collection('user_activity_logs')
        .find({ event_type: 'login' })
        .sort({ created_at: -1 })
        .limit(limit)
        .toArray(),
      db.collection('trusted_devices').find({}).sort({ last_seen_at: -1 }).limit(100).toArray()
    ])

    const trustById = new Map(devices.map(d => [d.device_id, d]))

    const items = logins.map(l => {
      const rawId = l.metadata?.device_id || ''
      const rec = rawId ? trustById.get(rawId) : undefined
      return {
        id: l._id.toString(),
        user_id: l.user_id,
        email: l.email || '',
        description: l.description || 'Signed in',
        method: l.metadata?.method || 'password',
        role: l.metadata?.role || 'user',
        ip: l.ip_address || '',
        device_id: rawId ? shortDeviceId(rawId) : '',
        device_full_id: rawId || '',
        device_label: l.metadata?.device_label || rec?.label || '',
        trusted: Boolean(rec?.trusted),
        created_at: l.created_at
      }
    })

    return NextResponse.json({
      status: 'success',
      logins: items,
      devices: devices.map(d => ({
        device_id: shortDeviceId(d.device_id),
        full_id: d.device_id,
        label: d.label || '',
        trusted: Boolean(d.trusted),
        trusted_by: d.trusted_by || '',
        last_ip: d.last_ip || '',
        last_user_id: d.last_user_id || '',
        last_email: d.last_email || '',
        last_seen_at: d.last_seen_at || null
      }))
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to load devices.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const auth = await verifyAdminRequest(req, db)
    if (!auth.authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const body = await req.json()
    const deviceId = (body.device_id || '').trim()
    if (!deviceId) return NextResponse.json({ detail: 'device_id required.' }, { status: 400 })

    const now = new Date()
    const label = (body.label || '').trim()
    const setFields: any = {
      trusted: true,
      trusted_by: auth.userId,
      trusted_at: now
    }
    if (label) setFields.label = label
    const setOnInsert: any = { device_id: deviceId, created_at: now }
    if (!label) setOnInsert.label = 'Trusted device'
    await db.collection('trusted_devices').updateOne(
      { device_id: deviceId },
      { $set: setFields, $setOnInsert: setOnInsert },
      { upsert: true }
    )
    return NextResponse.json({ status: 'success', message: 'Device marked as trusted.' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to trust device.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })

    const { authorized, userId } = await verifyAdminRequest(req, db)
    if (!authorized) return NextResponse.json({ detail: 'Forbidden.' }, { status: 403 })

    const deviceId = (req.nextUrl.searchParams.get('device_id') || '').trim()
    if (!deviceId) return NextResponse.json({ detail: 'device_id required.' }, { status: 400 })

    // Revoke trust but keep the sighting record (still shows as untrusted)
    await db.collection('trusted_devices').updateOne(
      { device_id: deviceId },
      { $set: { trusted: false, trusted_by: '', revoked_by: userId, revoked_at: new Date() } }
    )
    return NextResponse.json({ status: 'success', message: 'Device trust revoked.' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to revoke device.' }, { status: 500 })
  }
}
