import { Db } from 'mongodb'
import crypto from 'crypto'
import { exactMatchCI } from './query'

/**
 * Generate a clean, unique 6-character referral code (e.g. JF7K9X)
 */
export async function generateUniqueReferralCode(db: Db): Promise<string> {
  let attempts = 0
  while (attempts < 10) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase()
    const code = `JF${randomHex}`
    const existing = await db.collection('profiles').findOne({ referral_code: code })
    if (!existing) {
      return code
    }
    attempts++
  }
  // Fallback with timestamp slice
  return `JF${Date.now().toString(36).slice(-5).toUpperCase()}`
}

/**
 * Ensures user has a referral code; creates one if absent.
 */
export async function ensureReferralCode(db: Db, userId: string, currentCode?: string): Promise<string> {
  if (currentCode && currentCode.trim()) {
    return currentCode.trim()
  }
  const existing = await db.collection('profiles').findOne({ user_id: userId })
  if (existing?.referral_code) {
    return existing.referral_code
  }
  const newCode = await generateUniqueReferralCode(db)
  await db.collection('profiles').updateOne(
    { user_id: userId },
    { $set: { referral_code: newCode, updated_at: new Date() } }
  )
  await db.collection('users').updateOne(
    { user_id: userId },
    { $set: { referral_code: newCode, updated_at: new Date() } }
  )
  return newCode
}

/**
 * Validate referrer code or ID and return the referrer's profile
 */
export async function findReferrer(db: Db, codeOrId?: string | null) {
  if (!codeOrId || !codeOrId.trim()) return null
  const clean = codeOrId.trim().toUpperCase()
  return await db.collection('profiles').findOne({
    $or: [
      { referral_code: clean },
      { referral_code: codeOrId.trim() },
      { user_id: codeOrId.trim().toLowerCase() }
    ]
  })
}

/**
 * Eligible retail plans that qualify for ₹150 cash referral reward.
 * STRICTLY EXCLUDES organization plans ('org_starter', 'org_pro', 'org_pro_3m', 'enterprise').
 */
export const REFERRAL_REWARD_AMOUNT = 150
export const ELIGIBLE_REFERRAL_PLANS = ['pro', 'elite', 'professional']

/**
 * Record a verified referral reward when a referee purchases an eligible plan.
 */
export async function recordReferralReward(
  db: Db,
  params: {
    refereeUserId: string
    refereeEmail: string
    planId: string
    orderId: string
    paymentId: string
    purchaseAmount: string | number
  }
) {
  const { refereeUserId, refereeEmail, planId, orderId, paymentId, purchaseAmount } = params

  // 1. Guardrail: Must be an eligible retail plan (not org plan!)
  const normalizedPlan = (planId || '').toLowerCase()
  if (!ELIGIBLE_REFERRAL_PLANS.includes(normalizedPlan)) {
    return { rewarded: false, reason: 'Plan not eligible for referral cash reward (Org plans excluded)' }
  }

  // 2. Fetch referee profile to see who referred them
  const referee = await db.collection('profiles').findOne({
    $or: [
      ...(refereeUserId ? [{ user_id: refereeUserId }] : []),
      ...(refereeEmail ? [{ email: exactMatchCI(refereeEmail) }] : [])
    ]
  })

  if (!referee || !referee.referred_by) {
    return { rewarded: false, reason: 'Referee was not referred by any candidate' }
  }

  // 3. Find the referrer
  const referrer = await findReferrer(db, referee.referred_by)
  if (!referrer) {
    return { rewarded: false, reason: 'Referrer profile not found' }
  }

  // Prevent self-referral
  if (referrer.user_id === referee.user_id || referrer.email?.toLowerCase() === referee.email?.toLowerCase()) {
    return { rewarded: false, reason: 'Self-referral is not permitted' }
  }

  // 4. Check if referral reward already recorded for this referee or payment
  const existingReward = await db.collection('referrals').findOne({
    $or: [
      { referee_id: referee.user_id },
      { referee_email: exactMatchCI(refereeEmail) },
      { payment_id: paymentId },
      { order_id: orderId }
    ]
  })

  if (existingReward) {
    return { rewarded: false, reason: 'Referral reward already credited for this referee or transaction' }
  }

  // 5. Create referral reward document
  const now = new Date()
  const referralDoc = {
    referral_id: `ref_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    referrer_id: referrer.user_id,
    referrer_email: referrer.email,
    referrer_name: referrer.name || referrer.user_id,
    referee_id: referee.user_id,
    referee_email: referee.email || refereeEmail,
    referee_name: referee.name || referee.user_id,
    plan_id: normalizedPlan,
    plan_amount: purchaseAmount,
    reward_amount: REFERRAL_REWARD_AMOUNT, // ₹150 Cash Reward
    currency: 'INR',
    order_id: orderId,
    payment_id: paymentId,
    status: 'pending_payout', // 'pending_payout' | 'paid' | 'rejected'
    payout_type: referrer.payout_type || 'upi',
    upi_id: referrer.upi_id || '',
    bank_details: referrer.bank_details || null,
    created_at: now,
    paid_at: null,
    disbursed_by: null,
    transaction_ref: null,
    notes: 'Awaiting admin UPI/Bank transfer'
  }

  await db.collection('referrals').insertOne(referralDoc)

  return {
    rewarded: true,
    referral_id: referralDoc.referral_id,
    referrer_id: referrer.user_id,
    reward_amount: REFERRAL_REWARD_AMOUNT
  }
}
