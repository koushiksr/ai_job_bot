import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { clearSession, readSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Bump the account's session version so any copied token dies server-side
  // too (stateless JWTs can't otherwise be revoked before expiry).
  try {
    const sess = await readSession(req)
    if (sess?.uid) {
      const db = await getDb()
      if (db) {
        await db.collection('profiles').updateMany(
          { user_id: sess.uid },
          { $inc: { session_v: 1 } }
        )
        await db.collection('users').updateMany(
          { user_id: sess.uid },
          { $inc: { session_v: 1 } }
        )
      }
    }
  } catch {
    // Logout must always succeed client-side regardless
  }
  return clearSession(NextResponse.json({ status: 'success', message: 'Signed out.' }))
}
