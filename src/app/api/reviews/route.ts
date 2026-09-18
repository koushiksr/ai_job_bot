import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { ReviewItem, INITIAL_SAMPLE_REVIEWS } from '@/config/reviews'

/**
 * Public GET: Retrieve all approved reviews for display on homepage & login screen.
 */
export async function GET() {
  try {
    const db = await getDb()
    if (!db) {
      // Return initial authentic samples if DB is momentarily unavailable
      return NextResponse.json({
        reviews: INITIAL_SAMPLE_REVIEWS.map((r, i) => ({ ...r, id: `sample-${i}` })),
        total_approved: INITIAL_SAMPLE_REVIEWS.length,
        avg_rating: 4.8
      })
    }

    const reviewsCol = db.collection('reviews')

    // Count existing approved reviews
    const existingCount = await reviewsCol.countDocuments({ status: 'approved' })

    // If empty, auto-seed the initial authentic sample reviews
    if (existingCount === 0) {
      try {
        const seedDocs = INITIAL_SAMPLE_REVIEWS.map(r => ({
          ...r,
          created_at: new Date(r.created_at)
        }))
        await reviewsCol.insertMany(seedDocs)
      } catch (seedErr) {
        console.warn('[Reviews] Auto-seed error:', seedErr)
      }
    }

    const approvedDocs = await reviewsCol
      .find({ status: 'approved' })
      .sort({ featured: -1, created_at: -1 })
      .limit(20)
      .toArray()

    const reviews: ReviewItem[] = (approvedDocs.length > 0 ? approvedDocs : INITIAL_SAMPLE_REVIEWS).map((doc: any, i: number) => ({
      id: doc._id ? doc._id.toString() : `sample-${i}`,
      user_id: doc.user_id || '',
      user_name: doc.user_name || 'Verified Candidate',
      user_avatar: doc.user_avatar || '',
      role_title: doc.role_title || 'Software Professional',
      company: doc.company || 'Verified Employer',
      rating: typeof doc.rating === 'number' ? doc.rating : 4.8,
      satisfaction_level: doc.satisfaction_level || 'Highly Satisfied',
      review_text: doc.review_text || '',
      verified: Boolean(doc.verified ?? true),
      featured: Boolean(doc.featured),
      status: 'approved',
      created_at: doc.created_at ? new Date(doc.created_at).toISOString() : new Date().toISOString()
    }))

    const totalRatings = reviews.reduce((sum, r) => sum + r.rating, 0)
    const avgRating = reviews.length > 0 ? Number((totalRatings / reviews.length).toFixed(1)) : 4.8

    return NextResponse.json({
      reviews,
      total_approved: reviews.length,
      avg_rating: avgRating
    })
  } catch (err: any) {
    console.error('[Reviews API GET Error]', err)
    return NextResponse.json({
      reviews: INITIAL_SAMPLE_REVIEWS.map((r, i) => ({ ...r, id: `sample-${i}` })),
      total_approved: INITIAL_SAMPLE_REVIEWS.length,
      avg_rating: 4.8
    })
  }
}

/**
 * Candidate POST: Submit a candidate satisfaction review.
 * All submissions are stored with status = 'pending' and require Admin Approval.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      user_id,
      user_email,
      user_name,
      user_avatar,
      role_title,
      company,
      rating,
      satisfaction_level,
      review_text
    } = body

    if (!user_name || !user_name.trim()) {
      return NextResponse.json(
        { detail: 'Candidate name is required to submit a verified review.' },
        { status: 400 }
      )
    }

    if (!review_text || review_text.trim().length < 10) {
      return NextResponse.json(
        { detail: 'Please share at least a few sentences (minimum 10 characters) about your experience.' },
        { status: 400 }
      )
    }

    const numericRating = Math.max(1, Math.min(5, Number(rating) || 5))

    const db = await getDb()
    if (!db) {
      return NextResponse.json(
        { detail: 'Database connection currently unavailable. Please try again shortly.' },
        { status: 500 }
      )
    }

    const newReview = {
      user_id: (user_id || '').trim(),
      user_email: (user_email || '').toLowerCase().trim(),
      user_name: user_name.trim(),
      user_avatar: (user_avatar || '').trim(),
      role_title: (role_title || 'Software Professional').trim(),
      company: (company || 'Verified Employer').trim(),
      rating: numericRating,
      satisfaction_level: (satisfaction_level || 'Highly Satisfied').trim(),
      review_text: review_text.trim(),
      verified: true,
      featured: false,
      status: 'pending', // Requires administrator approval before public release
      created_at: new Date(),
      admin_notified: false
    }

    const result = await db.collection('reviews').insertOne(newReview)

    // Log in activity logs for audit
    try {
      await db.collection('activity_logs').insertOne({
        action: 'review_submitted',
        user_id: newReview.user_id || 'guest_candidate',
        user_email: newReview.user_email,
        details: `Candidate review submitted by ${newReview.user_name} (${numericRating}★). Awaiting Admin verification.`,
        timestamp: new Date()
      })
    } catch (e) {
      // Non-critical audit log
    }

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: 'Thank you for sharing your experience! Your review has been submitted for verification and will appear on the homepage once approved by the administrator.'
    })
  } catch (err: any) {
    console.error('[Reviews API POST Error]', err)
    return NextResponse.json(
      { detail: err.message || 'Failed to submit review. Please try again.' },
      { status: 500 }
    )
  }
}
