import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { readSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/app/download — permission-gated APK download (in-app distribution only).
 * Requires a signed-in session whose profile has apk_access: true
 * (granted by Super Admin in Inspect). No Play Store involved.
 */
export async function GET(req: NextRequest) {
  try {
    const sess = readSession(req)
    if (!sess?.uid) {
      return NextResponse.json({ detail: 'Sign in to download the app.' }, { status: 401 })
    }
    const apkUrl = process.env.APK_DOWNLOAD_URL || ''
    if (!apkUrl) {
      return NextResponse.json({ detail: 'No APK build published yet.' }, { status: 404 })
    }
    const db = await getDb()
    if (db) {
      const p = await db.collection('profiles').findOne(
        { user_id: sess.uid },
        { projection: { apk_access: 1, role: 1, email: 1 } }
      ) || await db.collection('users').findOne(
        { user_id: sess.uid },
        { projection: { apk_access: 1, role: 1, email: 1 } }
      )
      const isAdmin = sess.role === 'admin'
      if (!isAdmin && !p?.apk_access) {
        return NextResponse.json({ detail: 'App download is not enabled for your account. Ask Super Admin for access.' }, { status: 403 })
      }
    }
    return NextResponse.redirect(apkUrl)
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Download failed.' }, { status: 500 })
  }
}
