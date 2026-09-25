import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { clearSession, readSession } from '@/lib/session'
import { revokeSession, revokeAllSessions } from '@/lib/sessionRegistry'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Default: revoke ONLY this device's token — other devices stay signed in.
  // Pass ?all=1 for "log out everywhere" (bumps the account epoch too).
  const logoutEverywhere = req.nextUrl.searchParams.get('all') === '1'
  try {
    const sess = readSession(req)
    if (sess?.uid) {
      const db = await getDb()
      if (logoutEverywhere) {
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
        await revokeAllSessions(sess.uid)
      } else if (sess.jti) {
        await revokeSession(sess.uid, sess.jti)
      }
      // Legacy tokens without jti can't be targeted server-side; clearing the
      // cookie below still signs this device out without touching others.
    }
  } catch {
    // Logout must always succeed client-side regardless
  }
  return clearSession(NextResponse.json({ status: 'success', message: 'Signed out.' }))
}
