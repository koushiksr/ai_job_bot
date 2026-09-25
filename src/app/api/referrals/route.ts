import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { readSession } from '@/lib/session'
import { ensureReferralCode } from '@/lib/referral'
import { exactMatchCI } from '@/lib/query'

export const dynamic = 'force-dynamic'

function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return 'Friend'
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}*@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export async function GET(req: NextRequest) {
  try {
    const session = readSession(req)
    const { searchParams } = new URL(req.url)
    const queryUserId = searchParams.get('user_id')

    const effectiveUserId = session?.uid || queryUserId
    if (!effectiveUserId) {
      return NextResponse.json({ detail: 'Authentication required' }, { status: 401 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const profile = await db.collection('profiles').findOne({
      $or: [
        { user_id: effectiveUserId },
        ...(session?.email ? [{ email: exactMatchCI(session.email) }] : [])
      ]
    })

    if (!profile) {
      return NextResponse.json({ detail: 'Profile not found' }, { status: 404 })
    }

    // Ensure user has a referral code
    const referralCode = await ensureReferralCode(db, profile.user_id, profile.referral_code)

    // Count all signups who used this user's referral code
    const totalSignups = await db.collection('profiles').countDocuments({
      $or: [
        { referred_by: referralCode },
        { referred_by: profile.user_id }
      ]
    })

    // Fetch confirmed purchase rewards
    const rewards = await db.collection('referrals')
      .find({
        $or: [
          { referrer_id: profile.user_id },
          ...(profile.email ? [{ referrer_email: exactMatchCI(profile.email) }] : [])
        ]
      })
      .sort({ created_at: -1 })
      .toArray()

    const totalConversions = rewards.length
    const pendingRewards = rewards.filter(r => r.status === 'pending_payout')
    const paidRewards = rewards.filter(r => r.status === 'paid')

    const pendingCash = pendingRewards.reduce((sum, r) => sum + (r.reward_amount || 150), 0)
    const paidCash = paidRewards.reduce((sum, r) => sum + (r.reward_amount || 150), 0)
    const totalEarnedCash = rewards.reduce((sum, r) => sum + (r.reward_amount || 150), 0)

    const origin = req.headers.get('origin') || 'https://jobfluxai.vercel.app'
    const shareUrl = `${origin}/register?ref=${referralCode}`

    const maskedHistory = rewards.map(r => ({
      referral_id: r.referral_id || r._id.toString(),
      referee_name: r.referee_name || maskEmail(r.referee_email),
      referee_email_masked: maskEmail(r.referee_email),
      plan_id: r.plan_id,
      reward_amount: r.reward_amount || 150,
      status: r.status,
      created_at: r.created_at,
      paid_at: r.paid_at,
      transaction_ref: r.transaction_ref || null
    }))

    return NextResponse.json({
      referral_code: referralCode,
      share_url: shareUrl,
      stats: {
        total_signups: totalSignups,
        total_conversions: totalConversions,
        total_earned_cash: totalEarnedCash,
        pending_cash: pendingCash,
        paid_cash: paidCash
      },
      payout_settings: {
        payout_type: profile.payout_type || 'upi',
        upi_id: profile.upi_id || '',
        bank_details: profile.bank_details || {
          account_number: '',
          ifsc_code: '',
          account_holder_name: '',
          bank_name: ''
        }
      },
      history: maskedHistory
    })
  } catch (err: any) {
    console.error('Error fetching referral data:', err)
    return NextResponse.json({ detail: err.message || 'Failed to fetch referral data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = readSession(req)
    const body = await req.json()
    const targetUserId = session?.uid || body.user_id

    if (!targetUserId) {
      return NextResponse.json({ detail: 'Authentication required' }, { status: 401 })
    }

    const db = await getDb()
    if (!db) {
      return NextResponse.json({ detail: 'Database unavailable' }, { status: 503 })
    }

    const payoutType = body.payout_type === 'bank' ? 'bank' : 'upi'
    const upiId = (body.upi_id || '').trim()
    const bankDetails = {
      account_number: (body.bank_details?.account_number || '').trim(),
      ifsc_code: (body.bank_details?.ifsc_code || '').trim().toUpperCase(),
      account_holder_name: (body.bank_details?.account_holder_name || '').trim(),
      bank_name: (body.bank_details?.bank_name || '').trim()
    }

    if (payoutType === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        return NextResponse.json({ detail: 'Please enter a valid UPI ID (e.g. mobile@paytm or name@oksbi)' }, { status: 400 })
      }
    } else {
      if (!bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.account_holder_name) {
        return NextResponse.json({ detail: 'Please fill in Account Number, IFSC Code, and Account Holder Name' }, { status: 400 })
      }
    }

    const updateData = {
      payout_type: payoutType,
      upi_id: upiId,
      bank_details: bankDetails,
      payout_updated_at: new Date()
    }

    await db.collection('profiles').updateMany(
      { user_id: targetUserId },
      { $set: updateData }
    )

    await db.collection('users').updateMany(
      { user_id: targetUserId },
      { $set: updateData }
    )

    // Synchronize pending payouts with updated destination details
    await db.collection('referrals').updateMany(
      { referrer_id: targetUserId, status: 'pending_payout' },
      {
        $set: {
          payout_type: payoutType,
          upi_id: upiId,
          bank_details: bankDetails
        }
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Payout details saved successfully! Your ₹150 rewards will be disbursed here.',
      payout_settings: {
        payout_type: payoutType,
        upi_id: upiId,
        bank_details: bankDetails
      }
    })
  } catch (err: any) {
    console.error('Error saving payout details:', err)
    return NextResponse.json({ detail: err.message || 'Failed to save payout details' }, { status: 500 })
  }
}
