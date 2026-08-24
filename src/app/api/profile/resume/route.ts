import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    if (!userId) {
      return NextResponse.json({ detail: 'user_id is required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const resumeDoc = await db.collection('resumes').findOne({ user_id: userId })
    if (!resumeDoc || !resumeDoc.file_base64) {
      return NextResponse.json({ detail: 'Resume binary not found for user' }, { status: 404 })
    }

    // Convert Base64 back to PDF binary buffer
    const buffer = Buffer.from(resumeDoc.file_base64, 'base64')
    const filename = resumeDoc.filename || `${userId}.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800'
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
