import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ inquiries: [] })
    }

    const inquiries = await db
      .collection('enterprise_inquiries')
      .find({})
      .sort({ created_at: -1 })
      .toArray()

    const formatted = inquiries.map((doc: any) => ({
      id: doc._id.toString(),
      inquiry_id: doc.inquiry_id || doc._id.toString(),
      name: doc.name || '',
      email: doc.email || '',
      company: doc.company || '',
      seats: doc.seats || '10-25',
      phone: doc.phone || '',
      notes: doc.notes || '',
      status: doc.status || 'new',
      created_at: doc.created_at || new Date()
    }))

    return NextResponse.json({ inquiries: formatted })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, company, seats, phone, notes } = body

    if (!name || !email || !company) {
      return NextResponse.json(
        { detail: 'Name, email, and organization name are required.' },
        { status: 400 }
      )
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { detail: 'Database service unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const inquiryId = `ent_${crypto.randomBytes(6).toString('hex')}`
    const now = new Date()

    const newInquiry = {
      inquiry_id: inquiryId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company.trim(),
      seats: seats || '10-25',
      phone: (phone || '').trim(),
      notes: (notes || '').trim(),
      status: 'new',
      created_at: now,
      updated_at: now
    }

    await db.collection('enterprise_inquiries').insertOne(newInquiry)

    return NextResponse.json({
      success: true,
      inquiry_id: inquiryId,
      message: 'Thank you! Your enterprise inquiry has been received. Our team will contact you within 4 business hours.'
    })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { inquiry_id, status } = body

    if (!inquiry_id || !status) {
      return NextResponse.json(
        { detail: 'inquiry_id and status are required' },
        { status: 400 }
      )
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    await db.collection('enterprise_inquiries').updateOne(
      { inquiry_id: inquiry_id },
      {
        $set: {
          status: status,
          updated_at: new Date()
        }
      }
    )

    return NextResponse.json({ success: true, status })
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 })
  }
}
