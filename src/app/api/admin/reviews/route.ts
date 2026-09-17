import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { verifyAdminRequest } from '@/lib/adminAuth'
import { ObjectId } from 'mongodb'

/**
 * GET /api/admin/reviews: List all candidate reviews across all statuses with audit metrics.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ reviews: [], metrics: { total: 0, pending: 0, approved: 0, rejected: 0, avg_rating: 5.0 } })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator credentials required.' }, { status: 403 })
    }

    const reviewsCol = db.collection('reviews')
    const allDocs = await reviewsCol.find({}).sort({ created_at: -1 }).toArray()

    const reviews = allDocs.map((doc: any) => ({
      id: doc._id.toString(),
      user_id: doc.user_id || '',
      user_email: doc.user_email || '',
      user_name: doc.user_name || 'Candidate',
      user_avatar: doc.user_avatar || '',
      role_title: doc.role_title || 'Software Professional',
      company: doc.company || 'Verified Employer',
      rating: typeof doc.rating === 'number' ? doc.rating : 5,
      satisfaction_level: doc.satisfaction_level || 'Highly Satisfied',
      review_text: doc.review_text || '',
      verified: Boolean(doc.verified ?? true),
      featured: Boolean(doc.featured),
      status: doc.status || 'pending',
      created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString(),
      approved_at: doc.approved_at ? new Date(doc.approved_at).toISOString() : null
    }))

    const pending = reviews.filter(r => r.status === 'pending').length
    const approved = reviews.filter(r => r.status === 'approved').length
    const rejected = reviews.filter(r => r.status === 'rejected').length
    const featured = reviews.filter(r => r.featured).length
    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = reviews.length > 0 ? Number((totalRatings / reviews.length).toFixed(1)) : 5.0

    return NextResponse.json({
      reviews,
      metrics: {
        total: reviews.length,
        pending,
        approved,
        rejected,
        featured,
        avg_rating: avgRating
      }
    })
  } catch (err: any) {
    console.error('[Admin Reviews API GET Error]', err)
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/reviews: Approve, reject, feature, or update candidate reviews.
 */
export async function PATCH(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 500 })
    }

    const { authorized, email } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator credentials required.' }, { status: 403 })
    }

    const body = await req.json()
    const { id, status, featured, role_title, company, review_text, rating, satisfaction_level } = body

    if (!id) {
      return NextResponse.json({ detail: 'Review ID is required.' }, { status: 400 })
    }

    let objId: ObjectId
    try {
      objId = new ObjectId(id)
    } catch {
      return NextResponse.json({ detail: 'Invalid Review ID format.' }, { status: 400 })
    }

    const updateFields: Record<string, any> = {
      updated_at: new Date()
    }

    if (status && ['approved', 'rejected', 'pending'].includes(status)) {
      updateFields.status = status
      if (status === 'approved') {
        updateFields.approved_at = new Date()
        updateFields.approved_by = email || 'administrator'
      }
    }

    if (typeof featured === 'boolean') {
      updateFields.featured = featured
    }

    if (typeof role_title === 'string') updateFields.role_title = role_title.trim()
    if (typeof company === 'string') updateFields.company = company.trim()
    if (typeof review_text === 'string') updateFields.review_text = review_text.trim()
    if (typeof satisfaction_level === 'string') updateFields.satisfaction_level = satisfaction_level.trim()
    if (typeof rating === 'number') updateFields.rating = Math.max(1, Math.min(5, rating))

    const result = await db.collection('reviews').updateOne(
      { _id: objId },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ detail: 'Review not found.' }, { status: 404 })
    }

    // Log admin moderation action
    try {
      await db.collection('activity_logs').insertOne({
        action: `review_${status || 'updated'}`,
        user_id: 'administrator',
        user_email: email || 'technohmsit@gmail.com',
        details: `Review ${id} was set to ${status || 'updated'} by Admin (Featured: ${featured ?? 'unchanged'}).`,
        timestamp: new Date()
      })
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: `Review successfully updated to ${status || 'saved'}.`
    })
  } catch (err: any) {
    console.error('[Admin Reviews API PATCH Error]', err)
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/reviews: Permanently remove a review.
 */
export async function DELETE(req: NextRequest) {
  try {
    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 500 })
    }

    const { authorized } = await verifyAdminRequest(req, db)
    if (!authorized) {
      return NextResponse.json({ detail: 'Forbidden: Administrator credentials required.' }, { status: 403 })
    }

    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ detail: 'Review ID required in query parameter.' }, { status: 400 })
    }

    let objId: ObjectId
    try {
      objId = new ObjectId(id)
    } catch {
      return NextResponse.json({ detail: 'Invalid Review ID.' }, { status: 400 })
    }

    const result = await db.collection('reviews').deleteOne({ _id: objId })
    if (result.deletedCount === 0) {
      return NextResponse.json({ detail: 'Review not found or already removed.' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Review permanently removed.' })
  } catch (err: any) {
    console.error('[Admin Reviews API DELETE Error]', err)
    return NextResponse.json({ detail: err.message || 'Server error' }, { status: 500 })
  }
}
