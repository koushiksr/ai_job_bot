/**
 * Smart Business & Sales Offer Eligibility Engine
 * 
 * Sales & Business Logic Rules:
 * 1. Candidates with NO PLAN (unsubscribed / free tier) -> ELIGIBLE.
 *    High-priority targets to convert into paying customers.
 * 
 * 2. Candidates with EXPIRED PLANS (paid plan expired or trial expired) -> ELIGIBLE.
 *    High-priority targets for win-back retention offers.
 * 
 * 3. Candidates with an active plan EXPIRING WITHIN 48 HOURS (1-2 days before expiry) -> ELIGIBLE.
 *    Permitted for timely renewal retention offers so service continues uninterrupted.
 * 
 * 4. Candidates with an ACTIVE PLAN (> 48 hours remaining, e.g. 10 days, 25 days) -> INELIGIBLE.
 *    Offers are blocked by default to protect subscription revenues, prevent customer confusion,
 *    and avoid devaluing full-price plans. Can be bypassed only with explicit admin override.
 * 
 * 5. Candidates with VIP PASS -> INELIGIBLE.
 *    VIP candidates have active VIP access; payment offers are unnecessary.
 */

export interface OfferEligibility {
  eligible: boolean
  reason: string
  badge: string
  plan: string
  hoursRemaining: number | null
  daysRemaining: number | null
  status: "no_plan" | "expired" | "expiring_soon" | "active_long_term" | "vip"
}

export function evaluateOfferEligibility(user: any): OfferEligibility {
  if (!user) {
    return {
      eligible: true,
      reason: "New candidate account. Eligible for initial conversion offer.",
      badge: "Eligible: New User",
      plan: "none",
      hoursRemaining: null,
      daysRemaining: null,
      status: "no_plan"
    }
  }

  const isVip = Boolean(user.is_vip || user.vip_access || user.free_privilege || user.plan === "vip")
  if (isVip) {
    return {
      eligible: false,
      reason: "Candidate holds an active VIP Access Pass (90d). Upgrade offers are unnecessary.",
      badge: "Ineligible: VIP Pass",
      plan: "vip",
      hoursRemaining: null,
      daysRemaining: null,
      status: "vip"
    }
  }

  const plan = (user.plan || "none").toLowerCase()
  if (plan === "none" || plan === "no_plan" || plan === "free" || plan === "unsubscribed") {
    return {
      eligible: true,
      reason: "Candidate has no active paid plan (Free tier). Prime candidate for first-purchase conversion.",
      badge: "Eligible: No Plan",
      plan: plan === "free" ? "free" : "none",
      hoursRemaining: 0,
      daysRemaining: 0,
      status: "no_plan"
    }
  }

  const expStr = user.plan_expires_at || user.trial_expires_at
  const now = new Date()

  if (!expStr) {
    if (plan === "trial") {
      return {
        eligible: true,
        reason: "Free trial completed. Eligible for starter discount offer.",
        badge: "Eligible: Trial Completed",
        plan: "trial",
        hoursRemaining: 0,
        daysRemaining: 0,
        status: "expired"
      }
    }
    return {
      eligible: false,
      reason: "Active " + plan.toUpperCase() + " plan without expiration. Retention offers not required.",
      badge: "Ineligible: Active (" + plan.toUpperCase() + ")",
      plan,
      hoursRemaining: null,
      daysRemaining: null,
      status: "active_long_term"
    }
  }

  const expDate = new Date(expStr)
  const diffHours = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60)
  const hoursLeft = Math.round(diffHours)
  const daysLeft = Math.round(diffHours / 24 * 10) / 10

  if (diffHours <= 0) {
    return {
      eligible: true,
      reason: "Candidate plan expired. Win-back discount recommended.",
      badge: "Eligible: Plan Expired",
      plan,
      hoursRemaining: 0,
      daysRemaining: 0,
      status: "expired"
    }
  }

  // 1 or 2 days before expiry (<= 48 hours):
  if (diffHours <= 48) {
    return {
      eligible: true,
      reason: "Candidate plan expires in " + hoursLeft + "h (1-2 days before expiry). Renewal retention offer permitted.",
      badge: "Eligible: Expiring (" + hoursLeft + "h)",
      plan,
      hoursRemaining: hoursLeft,
      daysRemaining: daysLeft,
      status: "expiring_soon"
    }
  }

  // Active plan with more than 48 hours left:
  return {
    eligible: false,
    reason: "Candidate already has an active " + plan.toUpperCase() + " plan with " + daysLeft + " days (" + hoursLeft + "h) remaining. Offers should only be sent 1-2 days before expiry to protect subscription value and avoid cannibalizing paid subscriptions.",
    badge: "Ineligible: Active (" + daysLeft + "d left)",
    plan,
    hoursRemaining: hoursLeft,
    daysRemaining: daysLeft,
    status: "active_long_term"
  }
}
