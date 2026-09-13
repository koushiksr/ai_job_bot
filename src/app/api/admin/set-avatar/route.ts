import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const AVATAR_MAP: Record<string, string> = {
  shield: 'avatar-option1-shield.jpg',
  nexus: 'avatar-option2-nexus.jpg',
  infinity: 'avatar-option3-infinity.jpg'
}

export async function POST(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 503 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const avatarKey = body.avatarKey || 'nexus'

    const filename = AVATAR_MAP[avatarKey]
    if (!filename) {
      return NextResponse.json({ error: 'Invalid avatar option' }, { status: 400 })
    }

    const publicDir = path.join(process.cwd(), 'public')
    const sourcePath = path.join(publicDir, filename)
    const targetPath = path.join(publicDir, 'admin-helpdesk-avatar.jpg')

    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath)
      } catch (_) {}
    }

    // Save selection in DB
    await db.collection('system_config').updateOne(
      { key: 'helpdesk_avatar' },
      { $set: { key: 'helpdesk_avatar', selected: avatarKey, filename, updated_at: new Date() } },
      { upsert: true }
    )

    return NextResponse.json({
      success: true,
      selected: avatarKey,
      filename,
      url: `/admin-helpdesk-avatar.jpg?t=${Date.now()}`
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
