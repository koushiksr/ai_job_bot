import { PLAN_DAYS, getPlanDurationDays } from '@/config/plans'
import { exactMatchCI } from '@/lib/query'

export interface ActivePaymentResult {
  hasPaidPlan: boolean
  is_plan_active: boolean
  plan?: string
  plan_name?: string
  plan_activated_at?: Date
  plan_expires_at?: Date
  last_payment_id?: string
  last_order_id?: string
  amount?: string
}

/**
 * Finds the latest captured payment for a given email and determines if it is active.
 */
export async function findActivePaymentForEmail(
  db: any,
  email: string
): Promise<{ payment: any | null; isActive: boolean; expiresAt: Date | null }> {
  if (!db || !email) {
    return { payment: null, isActive: false, expiresAt: null }
  }

  const cleanEmail = email.toLowerCase().trim()
  const now = new Date()

  const payments = await db
    .collection('payments')
    .find({
      email: exactMatchCI(cleanEmail),
      status: 'captured'
    })
    .sort({ verified_at: -1, created_at: -1 })
    .toArray()

  if (!payments || payments.length === 0) {
    return { payment: null, isActive: false, expiresAt: null }
  }

  // Iterate over payments to find the latest unexpired one
  for (const p of payments) {
    let expiresAt = p.expires_at ? new Date(p.expires_at) : null

    if (!expiresAt) {
      const durationDays = p.promo_code
        ? getPlanDurationDays(p.plan_id, p.promo_code)
        : PLAN_DAYS[p.plan_id] || 30
      const baseDate = p.verified_at ? new Date(p.verified_at) : (p.created_at ? new Date(p.created_at) : now)
      expiresAt = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
    }

    if (expiresAt > now) {
      return { payment: p, isActive: true, expiresAt }
    }
  }

  // If all are expired, return the most recent payment marked as expired
  const latest = payments[0]
  const latestExpires = latest.expires_at ? new Date(latest.expires_at) : null
  return { payment: latest, isActive: false, expiresAt: latestExpires }
}

/**
 * Syncs any unlinked or newly purchased plan from payments collection to the user's profile and user record.
 */
export async function syncUserPaymentPlan(
  db: any,
  userId: string,
  email: string,
  profileToUpdate?: any
): Promise<ActivePaymentResult> {
  if (!db || !email) {
    return { hasPaidPlan: false, is_plan_active: false }
  }

  const cleanEmail = email.toLowerCase().trim()
  const { payment, isActive, expiresAt } = await findActivePaymentForEmail(db, cleanEmail)

  if (!payment) {
    return { hasPaidPlan: false, is_plan_active: false }
  }

  // Ensure this payment and any other payments for this email are linked to the user's ID
  if (userId) {
    await db.collection('payments').updateMany(
      {
        email: exactMatchCI(cleanEmail),
        $or: [{ user_id: { $in: [null, '', 'guest'] } }, { user_id: { $exists: false } }]
      },
      { $set: { user_id: userId } }
    )
  }

  if (isActive && expiresAt) {
    const rawPlanId = payment.plan_id || 'pro'
    const planId = rawPlanId === 'starter' ? 'pro' : rawPlanId
    const planName =
      planId === 'org_pro'
        ? 'JobFlux Org Pro'
        : planId === 'elite' || planId === 'professional'
          ? 'JobFlux Professional'
          : 'JobFlux Essentials'

    const activatedAt = payment.verified_at ? new Date(payment.verified_at) : new Date()

    const updateFields = {
      plan: planId,
      plan_name: planName,
      plan_activated_at: activatedAt,
      plan_expires_at: expiresAt,
      enabled_for_daily_run: true,
      last_payment_id: payment.payment_id,
      last_order_id: payment.order_id,
      updated_at: new Date()
    }

    const query = userId
      ? { $or: [{ user_id: userId }, { email: exactMatchCI(cleanEmail) }] }
      : { email: exactMatchCI(cleanEmail) }

    await db.collection('profiles').updateMany(query, { $set: updateFields })
    await db.collection('users').updateMany(query, { $set: updateFields })

    if (profileToUpdate) {
      Object.assign(profileToUpdate, updateFields)
    }

    return {
      hasPaidPlan: true,
      is_plan_active: true,
      plan: planId,
      plan_name: planName,
      plan_activated_at: activatedAt,
      plan_expires_at: expiresAt,
      last_payment_id: payment.payment_id,
      last_order_id: payment.order_id,
      amount: payment.amount
    }
  }

  return {
    hasPaidPlan: true,
    is_plan_active: false,
    plan: payment.plan_id,
    plan_expires_at: expiresAt || undefined
  }
}
