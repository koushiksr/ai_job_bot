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

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const user_id = data.user_id
    const file_base64 = data.file_base64 || data.pdf_base64 || data.base64
    const filename = data.filename || data.resume_filename || `${user_id}_Resume.pdf`
    const file_size_bytes = data.file_size_bytes

    if (!user_id || !file_base64) {
      return NextResponse.json({ detail: 'user_id and file_base64/pdf_base64 are required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    let cleanFilename = filename.replace(/^candidate\d*[\s_]*/i, '').trim()
    if (!cleanFilename.toLowerCase().endsWith('.pdf')) {
      cleanFilename += '.pdf'
    }

    const size = file_size_bytes || Buffer.from(file_base64, 'base64').length

    // 1. Store binary PDF in dedicated 'resumes' collection
    await db.collection('resumes').updateOne(
      { user_id },
      {
        $set: {
          user_id,
          filename: cleanFilename,
          content_type: 'application/pdf',
          file_size_bytes: size,
          file_base64,
          updated_at: new Date()
        }
      },
      { upsert: true }
    )

    // 2. Update profile metadata
    await db.collection('profiles').updateOne(
      { user_id },
      {
        $set: {
          resume_filename: cleanFilename,
          resume_size_bytes: size,
          has_resume: true,
          updated_at: new Date()
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      status: 'success',
      message: 'Resume PDF uploaded and saved to MongoDB Atlas',
      filename: cleanFilename,
      size_bytes: size
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
