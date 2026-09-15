import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let userId = ''
    let pictureDataUrl = ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      userId = (formData.get('user_id') as string) || ''
      const file = formData.get('file') as File | null
      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const mimeType = file.type || 'image/jpeg'
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        pictureDataUrl = `data:${mimeType};base64,${base64}`
      }
    } else {
      const data = await req.json()
      userId = data.user_id || ''
      pictureDataUrl = data.picture || ''
    }

    if (!userId || !pictureDataUrl) {
      return NextResponse.json({ detail: 'user_id and picture are required.' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const now = new Date()
    await db.collection('profiles').updateOne(
      { user_id: userId },
      { $set: { picture: pictureDataUrl, updated_at: now } },
      { upsert: true }
    )
    await db.collection('users').updateOne(
      { user_id: userId },
      { $set: { picture: pictureDataUrl, updated_at: now } },
      { upsert: true }
    )

    const { ip, userAgent } = getClientInfo(req)
    await logUserActivity(db, {
      userId,
      eventType: 'profile_update',
      description: 'Candidate profile picture updated',
      ipAddress: ip,
      userAgent
    })

    return NextResponse.json({ success: true, picture: pictureDataUrl })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to update picture' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const now = new Date()
    await db.collection('profiles').updateOne(
      { user_id: userId },
      { $set: { picture: '', updated_at: now } }
    )
    await db.collection('users').updateOne(
      { user_id: userId },
      { $set: { picture: '', updated_at: now } }
    )

    return NextResponse.json({ success: true, picture: '' })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || 'Failed to delete picture' }, { status: 500 })
  }
}
