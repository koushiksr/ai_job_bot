import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let user_id = ''
    let file_base64 = ''
    let filename = ''
    let file_size_bytes = 0

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      user_id = (formData.get('user_id') as string) || ''
      const file = formData.get('file') as File | null
      if (file) {
        filename = file.name
        file_size_bytes = file.size
        const arrayBuffer = await file.arrayBuffer()
        file_base64 = Buffer.from(arrayBuffer).toString('base64')
      }
    } else {
      const data = await req.json()
      user_id = data.user_id
      file_base64 = data.file_base64 || data.pdf_base64 || data.base64
      filename = data.filename || data.resume_filename || `${user_id}_Resume.pdf`
      file_size_bytes = data.file_size_bytes || (file_base64 ? Buffer.from(file_base64, 'base64').length : 0)
    }

    if (!user_id || !file_base64) {
      return NextResponse.json({ detail: 'user_id and resume PDF are required' }, { status: 400 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    let cleanFilename = filename.trim()
    if (!cleanFilename.toLowerCase().endsWith('.pdf')) {
      cleanFilename += '.pdf'
    }

    const size = file_size_bytes || Buffer.from(file_base64, 'base64').length
    const now = new Date()

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
          updated_at: now
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
          updated_at: now
        }
      },
      { upsert: true }
    )

    return NextResponse.json({
      status: 'success',
      message: 'Resume PDF uploaded and saved directly to JobFlux Cloud',
      filename: cleanFilename,
      size_bytes: size,
      timestamp: now.getTime()
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
