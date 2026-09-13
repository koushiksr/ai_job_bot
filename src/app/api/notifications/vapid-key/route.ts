import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getDynamicVapidCredentials } from '@/config/vapid'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications/vapid-key
 * Returns the public VAPID key needed by the browser's Service Worker PushManager.
 */
export async function GET() {
  try {
    const db = await getDb()
    const { publicKey } = await getDynamicVapidCredentials(db)
    return NextResponse.json({ publicKey })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
