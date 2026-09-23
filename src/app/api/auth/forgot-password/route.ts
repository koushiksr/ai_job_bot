import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getDb } from '@/lib/mongodb'
import { sendEmail, generatePasswordResetHtml } from '@/lib/mailService'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req, { limit: 5, windowSeconds: 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { detail: `Too many password reset requests. Please wait ${rateCheck.resetSeconds}s before retrying.` },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const emailClean = (body.email || '').trim().toLowerCase()
    const { ip, userAgent } = getClientInfo(req)

    if (!emailClean || !emailClean.includes('@')) {
      return NextResponse.json(
        { detail: 'A valid email address is required.' },
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

    // Look for user in profiles or users collection
    const user = await db.collection('users').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    }) || await db.collection('profiles').findOne({
      email: { $regex: `^${emailClean}$`, $options: 'i' }
    })

    if (!user) {
      // Security best practice: don't reveal if user exists, but respond politely
      return NextResponse.json({
        status: 'success',
        message: 'If an account exists with this email, a password reset link and verification code have been dispatched.'
      })
    }

    // Generate secure reset token and 6-digit verification code
    const resetToken = crypto.randomBytes(32).toString('hex')
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour validity

    // Update in both users and profiles collections
    await db.collection('users').updateMany(
      { email: { $regex: `^${emailClean}$`, $options: 'i' } },
      {
        $set: {
          reset_token: resetToken,
          reset_otp: otp,
          reset_token_expires_at: expiresAt,
          updated_at: new Date()
        }
      }
    )

    await db.collection('profiles').updateMany(
      { email: { $regex: `^${emailClean}$`, $options: 'i' } },
      {
        $set: {
          reset_token: resetToken,
          reset_otp: otp,
          reset_token_expires_at: expiresAt,
          updated_at: new Date()
        }
      }
    )

    // Determine host origin for link
    const origin = req.headers.get('origin') || process.env.NEXTAUTH_URL || 'https://jobfluxai.vercel.app'
    const resetUrl = `${origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(emailClean)}`

    // Generate luxury HTML email
    const candidateName = user.name || user.user_id?.replace('_', ' ') || 'Candidate'
    const html = generatePasswordResetHtml(candidateName, resetUrl, otp)

    // Send email (via SMTP, with automatic fallback logging to MongoDB)
    const mailResult = await sendEmail({
      to: emailClean,
      subject: '🔐 Reset Your JobFlux AI Password',
      html,
      text: `Hi ${candidateName},\n\nUse this link to reset your password: ${resetUrl}\n\nOr enter this 6-digit code: ${otp}\n\nExpires in 60 minutes.`
    })

    await logUserActivity(db, {
      userId: user.user_id || 'anonymous',
      email: emailClean,
      eventType: 'profile_update',
      description: `Password reset requested for ${emailClean} (OTP: ${otp})`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: {
        method: 'forgot_password',
        mail_dispatched: mailResult.success,
        simulated: mailResult.simulated
      }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Password reset link and verification code have been dispatched to your email.',
      simulated: mailResult.simulated,
      previewOtp: otp // Included for testing convenience
    })
  } catch (err: any) {
    console.error('Forgot password error:', err)
    return NextResponse.json(
      { detail: err.message || 'Failed to process password reset request.' },
      { status: 500 }
    )
  }
}
