import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { logUserActivity, getClientInfo } from '@/lib/activityLogger'
import { checkRateLimit } from '@/lib/rateLimit'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const rateCheck = await checkRateLimit(req, { limit: 10, windowSeconds: 60 })
    if (!rateCheck.success) {
      return NextResponse.json(
        { detail: `Too many attempts. Please wait ${rateCheck.resetSeconds}s before trying again.` },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const token = (body.token || '').trim()
    const otp = (body.otp || '').trim()
    const emailClean = (body.email || '').trim().toLowerCase()
    const newPassword = (body.newPassword || '').trim()
    const { ip, userAgent } = getClientInfo(req)

    if (!newPassword) {
      return NextResponse.json(
        { detail: 'A new password is required.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 4) {
      return NextResponse.json(
        { detail: 'Password must be at least 4 characters.' },
        { status: 400 }
      )
    }

    if (!token && (!otp || !emailClean)) {
      return NextResponse.json(
        { detail: 'Either a valid reset token or email with 6-digit verification code is required.' },
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

    const now = new Date()

    // Query by token or by email + OTP
    let query: any = {}
    if (token) {
      query = {
        reset_token: token,
        reset_token_expires_at: { $gt: now }
      }
    } else {
      query = {
        email: exactMatchCI(emailClean),
        reset_otp: otp,
        reset_token_expires_at: { $gt: now }
      }
    }

    const user = await db.collection('profiles').findOne(query) || await db.collection('users').findOne(query)

    if (!user) {
      return NextResponse.json(
        { detail: 'Invalid or expired reset token or verification code. Please request a new one.' },
        { status: 400 }
      )
    }

    const targetEmail = user.email || emailClean
    const targetUserId = user.user_id

    // Update password and clear reset tokens in both collections
    await db.collection('profiles').updateMany(
      { $or: [{ user_id: targetUserId }, { email: exactMatchCI(targetEmail) }] },
      {
        $set: {
          password: newPassword,
          updated_at: now
        },
        $unset: {
          reset_token: '',
          reset_otp: '',
          reset_token_expires_at: ''
        }
      }
    )

    await db.collection('users').updateMany(
      { $or: [{ user_id: targetUserId }, { email: exactMatchCI(targetEmail) }] },
      {
        $set: {
          password: newPassword,
          updated_at: now
        },
        $unset: {
          reset_token: '',
          reset_otp: '',
          reset_token_expires_at: ''
        }
      }
    )

    // Log password change event
    await logUserActivity(db, {
      userId: targetUserId,
      email: targetEmail,
      eventType: 'profile_update',
      description: `Password successfully reset via ${token ? 'security token link' : '6-digit verification code'}`,
      ipAddress: ip,
      userAgent: userAgent,
      metadata: { method: token ? 'reset_token' : 'reset_otp' }
    })

    return NextResponse.json({
      status: 'success',
      message: 'Your password has been successfully reset! You can now sign in with your new credentials.'
    })
  } catch (err: any) {
    console.error('Reset password error:', err)
    return NextResponse.json(
      { detail: err.message || 'Failed to reset password.' },
      { status: 500 }
    )
  }
}
