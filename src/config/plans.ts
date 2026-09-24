/**
 * Centralized Plans, Pricing, and Promotional Offer Configuration
 * 
 * Single source of truth for:
 * 1. Public pricing page plans, features, and UI cards
 * 2. Razorpay backend transaction amounts (in paise) and duration allocations
 * 3. Administrative campaign offer presets and automated email templates
 * 4. Promo code validation, candidate assignment, and access control
 * 
 * To modify any price, promo code, feature list, or discount, update this single file.
 */

export interface PlanFeature {
  text: string
  isAddon?: boolean
}

export interface PlanDefinition {
  id: string
  name: string
  subtitle: string
  badge?: string
  price: string
  originalPrice?: string
  amountPaise: number
  period: string
  durationDays: number
  featuresIntro: string
  features: PlanFeature[]
  cta: string
  highlight?: boolean
  popular?: boolean
}

export interface PromoDefinition {
  code: string
  presetId: string
  name: string
  offerTitle: string
  discountBadge: string
  originalPrice: string
  discountedPrice: string
  amountPaise: number
  allowedPlans: string[]
  durationDays: number
  description: string
  customMessage: string
  pricingDisplay: {
    displayPrice: string
    label: string
  }
  category?: 'individual' | 'org_member'
}

// ----------------------------------------------------------------------
// 1. Master Plan Definitions
// ----------------------------------------------------------------------

export const MASTER_PLANS: PlanDefinition[] = [
  {
    id: 'trial',
    name: 'Free',
    subtitle: '100% Free. No credit card needed. Start in 30 seconds.',
    price: '₹0',
    amountPaise: 0,
    period: 'free to start',
    durationDays: 3,
    featuresIntro: 'Daily morning sweep, automated applying, zero card required...',
    features: [
      { text: 'Autonomous Daily Auto-Apply' },
      { text: 'Daily Morning Sweep (6:00 AM IST)' },
      { text: 'Automated screening questions answered' },
      { text: 'Real-time application telemetry dashboard' },
      { text: 'Daily email dispatch reports' },
      { text: 'Zero credit card required' }
    ],
    cta: 'Start for Free',
    highlight: false
  },
  {
    id: 'pro',
    name: 'Essentials',
    subtitle: 'For candidates with daily proactive application demands.',
    badge: 'POPULAR',
    price: '₹99',
    originalPrice: '₹1,000',
    amountPaise: 9900,
    period: '/ month',
    durationDays: 30,
    featuresIntro: 'Everything in Free, with 600+ monthly applications, plus...',
    features: [
      { text: '30 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 600+ Verified Job Applications' },
      { text: 'Daily Autonomous Application Sweeps' },
      { text: 'AI Tailored Responses for Recruiter Screening' },
      { text: 'Target Role, Location & Salary Filters' },
      { text: 'Priority Cloud Worker Queue' },
      { text: 'Live Application History & Recruiter Links' }
    ],
    cta: 'Get 1 Month for ₹99',
    popular: true,
    highlight: true
  },
  {
    id: 'elite',
    name: 'Professional',
    subtitle: 'Best for comprehensive pipeline until you sign an offer.',
    price: '₹199',
    originalPrice: '₹2,500',
    amountPaise: 19900,
    period: '/ 3 months',
    durationDays: 90,
    featuresIntro: 'Everything in Essentials, with extended 90-day pipeline, plus...',
    features: [
      { text: '90 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 1,800+ Verified Job Applications' },
      { text: 'VIP Priority Server Queue Slot' },
      { text: 'AI Resume Optimization & Keyword Match' },
      { text: 'On-Demand Real-Time Sweeps (Up to 5x / week)' },
      { text: 'Continuous Applications Until Hired' },
      { text: 'Dedicated Recruiter Response Priority' }
    ],
    cta: 'Get 3 Months (₹199)',
    highlight: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'For staffing agencies and colleges needing cohort scale.',
    price: 'Custom',
    amountPaise: 0,
    period: '/ volume quote',
    durationDays: 90,
    featuresIntro: 'Everything in Professional, with bulk candidate controls, plus...',
    features: [
      { text: 'Bulk Candidate Licensing (10 to 500+ Seats)' },
      { text: 'Candidate Cohort Grouping & Batching' },
      { text: 'Multi-User Telemetry & Aggregated Stats' },
      { text: 'Dedicated Cloud Automation Workers' },
      { text: 'Priority SLA & Dedicated Support Desk' },
      { text: 'Custom ATS Integration & Webhooks', isAddon: true },
      { text: 'Dedicated Placement Coordinator', isAddon: true }
    ],
    cta: 'Contact sales',
    highlight: false
  }
]

// ----------------------------------------------------------------------
// 2. Master Promotional Offers & Presets
// ----------------------------------------------------------------------

export const MASTER_PROMOS: PromoDefinition[] = [
  {
    code: 'OFFER90',
    presetId: 'offer_99',
    name: 'Essentials 90% Welcome Pass (₹99 / mo)',
    offerTitle: 'Candidate Welcome: 90% Off JobFlux Essentials for ₹99',
    discountBadge: '90% OFF (ACTUAL ₹1,000)',
    originalPrice: '₹1,000 / mo',
    discountedPrice: '₹99 / mo',
    amountPaise: 9900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Essentials - 90% Special Pass (30 Days)',
    customMessage: 'Unlock 30 days of continuous daily autonomous job applications (600+ applies), Harvard ATS resume formatting, and direct priority recruiter submission at 90% discount (Regular ₹1,000/mo) for just ₹99.',
    pricingDisplay: {
      displayPrice: '₹99',
      label: '90% OFF Special Pass (Actual ₹1,000 / mo)'
    }
  },
  {
    code: 'CHOC29',
    presetId: 'choc_29',
    name: '1-Month Starter Sprint (₹29 / mo)',
    offerTitle: 'Introductory Special: 1-Month JobFlux Sprint for ₹29',
    discountBadge: '97% OFF (INTRO SPECIAL)',
    originalPrice: '₹1,000 / mo',
    discountedPrice: '₹29 / mo',
    amountPaise: 2900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Essentials - 1-Month Special Sprint (30 Days)',
    customMessage: 'Claim the ₹29 introductory sprint! Get 30 days of autonomous job applications (600+ applications) for just ₹29.',
    pricingDisplay: {
      displayPrice: '₹29',
      label: 'Special 1-Month Sprint (Actual ₹1,000 / mo)'
    }
  },
  {
    code: 'FLASH49',
    presetId: 'flash_49',
    name: 'Essentials Flash Pass (₹49 / mo)',
    offerTitle: 'Exclusive 95% Flash Discount: JobFlux Essentials for ₹49',
    discountBadge: '95% OFF (ACTUAL ₹1,000)',
    originalPrice: '₹1,000 / mo',
    discountedPrice: '₹49 / mo',
    amountPaise: 4900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Essentials - 95% Flash Pass (30 Days)',
    customMessage: 'Claim an exclusive 95% flash pass! Get 30 days of autonomous job applications for just ₹49 (Regular ₹1,000/mo).',
    pricingDisplay: {
      displayPrice: '₹49',
      label: '95% OFF Flash Pass (Actual ₹1,000 / mo)'
    }
  },
  {
    code: 'SPRINT69',
    presetId: 'sprint_69',
    name: 'Weekend Career Sprint (₹69 / mo)',
    offerTitle: 'Weekend Career Sprint: 1-Month JobFlux Essentials for ₹69',
    discountBadge: '93% OFF (ACTUAL ₹1,000)',
    originalPrice: '₹1,000 / mo',
    discountedPrice: '₹69 / mo',
    amountPaise: 6900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Essentials - 93% Sprint Pass (30 Days)',
    customMessage: 'Kickstart your interview pipeline this week with 600+ verified applications and daily smart scans at 93% discount (Regular ₹1,000/mo) for only ₹69.',
    pricingDisplay: {
      displayPrice: '₹69',
      label: '93% OFF Weekend Sprint (Actual ₹1,000 / mo)'
    }
  },
  {
    code: 'PRO199',
    presetId: 'pro_199',
    name: 'Professional 3-Month Plan (₹199 / 3 mos)',
    offerTitle: 'Comprehensive 90-Day Pipeline: JobFlux Professional for ₹199',
    discountBadge: '92% OFF (ACTUAL ₹2,500)',
    originalPrice: '₹2,500 / 3 mos',
    discountedPrice: '₹199 / 3 mos',
    amountPaise: 19900,
    allowedPlans: ['elite', 'professional'],
    durationDays: 90,
    description: 'JobFlux Professional - 92% 3-Month Pass (90 Days)',
    customMessage: 'Get 90 days of continuous automated applications (1,800+ applies), on-demand sweeps up to 5x/week, and VIP queue priority at 92% off (Regular ₹2,500) for ₹199.',
    pricingDisplay: {
      displayPrice: '₹199',
      label: '92% OFF 3-Month Full Pass (Actual ₹2,500 / 3 mos)'
    }
  },
  {
    code: 'PRO129',
    presetId: 'pro_129',
    name: 'Professional 3-Month Fast-Track (₹129)',
    offerTitle: 'Career Fast-Track: 3 Months of JobFlux Professional for ₹129',
    discountBadge: '95% OFF (ACTUAL ₹2,500)',
    originalPrice: '₹2,500 / 3 mos',
    discountedPrice: '₹129 / 3 mos',
    amountPaise: 12900,
    allowedPlans: ['elite', 'professional'],
    durationDays: 90,
    description: 'JobFlux Professional - 95% Fast-Track (90 Days)',
    customMessage: 'Accelerate your interview shortlists with 90 days of continuous automated applies (1,800+ applications), on-demand sweeps up to 5x/week, and VIP priority queue at 95% off (Regular ₹2,500) for just ₹129.',
    pricingDisplay: {
      displayPrice: '₹129',
      label: '95% OFF 3-Month Fast-Track (Actual ₹2,500 / 3 mos)'
    }
  },
  {
    code: 'VIP299',
    presetId: 'vip_299',
    name: '3-Month VIP Professional Extension (₹299)',
    offerTitle: '3-Month VIP Extension: Continuous Autonomous Job Applications for ₹299',
    discountBadge: '88% OFF (ACTUAL ₹2,500)',
    originalPrice: '₹2,500 / 3 mos',
    discountedPrice: '₹299 / 3 mos',
    amountPaise: 29900,
    allowedPlans: ['elite', 'professional'],
    durationDays: 90,
    description: 'JobFlux Professional - 88% VIP 3-Month Extension (90 Days)',
    customMessage: 'Extend your autonomous job applications for 3 full months (90 days / 1,800+ applications) with VIP priority server queue and on-demand sweeps at 88% discount (Regular ₹2,500) for only ₹299.',
    pricingDisplay: {
      displayPrice: '₹299',
      label: '88% OFF 3-Month VIP Extension (Actual ₹2,500 Value)'
    },
    category: 'individual'
  },
  {
    code: 'ORGPRO49',
    presetId: 'org_pro_49',
    name: 'Org Pro Member Flash Upgrade (₹49 / mo)',
    offerTitle: 'Exclusive Org Member Upgrade: JobFlux Org Pro for ₹49',
    discountBadge: '95% OFF (ORG MEMBER ONLY)',
    originalPrice: '₹1,000 / mo',
    discountedPrice: '₹49 / mo',
    amountPaise: 4900,
    allowedPlans: ['org_pro'],
    durationDays: 30,
    description: 'JobFlux Org Pro - 95% Flash Upgrade for Organization Members (30 Days)',
    customMessage: 'Exclusive upgrade for organization members! Upgrade your account to Org Pro with up to 15 weekly on-demand sweeps, 55 daily applications, and priority server queue for just ₹49 (Regular ₹1,000/mo).',
    pricingDisplay: {
      displayPrice: '₹49',
      label: '95% OFF Org Member Upgrade (Actual ₹1,000 / mo)'
    },
    category: 'org_member'
  },
  {
    code: 'ORGPRO99',
    presetId: 'org_pro_99',
    name: 'Org Pro Member Official Pass (₹99 / mo)',
    offerTitle: 'Organization Member Pass: JobFlux Org Pro for ₹99',
    discountBadge: '90% OFF (ACTUAL ₹1,000)',
    originalPrice: '₹1,000 / mo',
    discountedPrice: '₹99 / mo',
    amountPaise: 9900,
    allowedPlans: ['org_pro'],
    durationDays: 30,
    description: 'JobFlux Org Pro - Member Upgrade (30 Days)',
    customMessage: 'Upgrade to Org Pro: Up to 15 weekly on-demand sweeps, 55 daily applications, priority server queue, and AI resume optimization for ₹99.',
    pricingDisplay: {
      displayPrice: '₹99',
      label: '90% OFF Org Pro Upgrade (Actual ₹1,000 / mo)'
    },
    category: 'org_member'
  }
]

// ----------------------------------------------------------------------
// 3. Derived Formats for Specialized Consumers
// ----------------------------------------------------------------------

/** UI Plans List for /pricing page */
export const PLANS = MASTER_PLANS

/**
 * Organization-member exclusive plans (NOT shown on public pricing).
 * Sold only via the member dashboard upgrade banner to verified org members.
 */
export const ORG_PLANS: PlanDefinition[] = [
  {
    id: 'org_pro',
    name: 'Org Pro',
    subtitle: 'Exclusive upgrade for organization members.',
    badge: 'ORG MEMBER',
    price: '₹99',
    originalPrice: '₹1,000',
    amountPaise: 9900,
    period: '/ month',
    durationDays: 30,
    featuresIntro: 'Everything in Enterprise, plus member-only extras...',
    features: [
      { text: '30 Days of Continuous Daily Auto-Apply' },
      { text: 'On-Demand Real-Time Sweeps (Up to 15x / week)' },
      { text: 'Priority Cloud Worker Queue' },
      { text: 'AI Resume Optimization & Keyword Match' },
      { text: 'Stays linked to your organization & admin' }
    ],
    cta: 'Upgrade to Org Pro (₹99)',
    highlight: true
  }
]

export function getOrgPlan(planId: string): PlanDefinition | undefined {
  return ORG_PLANS.find(p => p.id === planId)
}

/** True for organization-linked plans (enterprise base + paid org upgrades). */
export function isOrgPlanId(planId?: string | null): boolean {
  return planId === 'enterprise' || planId === 'org_pro'
}

/** Weekly on-demand run allowance per plan. */
export function getWeeklyOnDemandLimit(planId?: string | null, isEnterpriseMember = false): number {
  const p = (planId || '').toLowerCase()
  if (p === 'org_pro') return 15
  if (p === 'enterprise' || isEnterpriseMember) return 10
  if (p === 'elite' || p === 'professional') return 10
  if (p === 'pro') return 5
  if (p === 'starter') return 3
  return 0
}

/**
 * Daily application cap per plan (mirrors backend db.PLAN_DAILY_CAPS).
 * Trial 10 < starter 20 < paid/enterprise 55. Hard ceiling 55 always.
 */
export function getDailyAppLimit(planId?: string | null): number {
  const p = (planId || 'trial').toLowerCase()
  if (p === 'trial') return 10
  if (p === 'starter') return 20
  return 55
}

/** Upgrade nudge for capped tiers. Empty string when nothing to upsell. */
export function getCapUpgradeHint(planId?: string | null): string {
  const p = (planId || '').toLowerCase()
  if (p === 'trial') return 'Free trial allows 10/day — upgrade to Pro for 55/day.'
  if (p === 'starter') return 'Starter allows 20/day — upgrade to Pro for 55/day.'
  return ''
}

/**
 * Backend Razorpay Plan Amounts Map
 * Supports both canonical IDs and historical aliases (starter, professional).
 */
export const PLAN_AMOUNTS: Record<string, { amount: number; name: string; days: number }> = {
  starter: { amount: 9900, name: 'JobFlux 1-Month Plan (30 Days)', days: 30 },
  pro: { amount: 9900, name: 'JobFlux 1-Month Career Pro (30 Days)', days: 30 },
  elite: { amount: 19900, name: 'JobFlux 3-Month Professional Plan (90 Days)', days: 90 },
  professional: { amount: 19900, name: 'JobFlux 3-Month Professional Plan (90 Days)', days: 90 },
  org_pro: { amount: 9900, name: 'JobFlux Org Pro — Member Upgrade (30 Days)', days: 30 }
}

/**
 * Plan duration in days map for payment verification
 */
export const PLAN_DAYS: Record<string, number> = {
  starter: 30,
  pro: 30,
  elite: 90,
  professional: 90,
  org_pro: 30
}

/**
 * Razorpay Promo Discounts Map for Order Creation & Verification
 */
export const PROMO_DISCOUNTS: Record<
  string,
  { amount: number; name: string; allowedPlans: string[]; days: number }
> = MASTER_PROMOS.reduce((acc, promo) => {
  acc[promo.code] = {
    amount: promo.amountPaise,
    name: promo.description,
    allowedPlans: promo.allowedPlans,
    days: promo.durationDays
  }
  return acc
}, {} as Record<string, { amount: number; name: string; allowedPlans: string[]; days: number }>)

/**
 * Admin Campaign Offer Presets List for /api/admin/offers
 */
export const OFFER_PRESETS = MASTER_PROMOS.map(p => ({
  id: p.presetId,
  name: p.name,
  offerTitle: p.offerTitle,
  discountBadge: p.discountBadge,
  originalPrice: p.originalPrice,
  discountedPrice: p.discountedPrice,
  promoCode: p.code,
  customMessage: p.customMessage,
  allowedPlans: p.allowedPlans,
  category: p.category || 'individual'
}))

/**
 * Promo Definitions map for /pricing page client-side state
 */
export const PROMO_DEFINITIONS: Record<
  string,
  { displayPrice: string; label: string; allowedPlans: string[]; durationDays?: number }
> = MASTER_PROMOS.reduce((acc, promo) => {
  acc[promo.code] = {
    displayPrice: promo.pricingDisplay.displayPrice,
    label: promo.pricingDisplay.label,
    allowedPlans: promo.allowedPlans,
    durationDays: promo.durationDays
  }
  return acc
}, {} as Record<string, { displayPrice: string; label: string; allowedPlans: string[]; durationDays?: number }>)

// ----------------------------------------------------------------------
// 4. Utility Helper Functions
// ----------------------------------------------------------------------

export function getPlan(planId: string): PlanDefinition | undefined {
  return MASTER_PLANS.find(p => p.id === planId)
}

export function getPromo(promoCode: string): PromoDefinition | undefined {
  const clean = (promoCode || '').trim().toUpperCase()
  return MASTER_PROMOS.find(p => p.code === clean)
}

export function validatePromoForPlan(promoCode: string, planId: string): {
  valid: boolean
  error?: string
  promo?: PromoDefinition
} {
  const promo = getPromo(promoCode)
  if (!promo) {
    return { valid: false, error: `Promo code "${promoCode}" is invalid or expired.` }
  }
  if (!promo.allowedPlans.includes(planId)) {
    return {
      valid: false,
      error: `Promo code "${promo.code}" is valid for ${promo.allowedPlans.join('/')}, not ${planId}.`
    }
  }
  return { valid: true, promo }
}

export function getPlanDurationDays(planId: string, promoCode?: string): number {
  if (promoCode) {
    const promo = getPromo(promoCode)
    if (promo) return promo.durationDays
  }
  return PLAN_DAYS[planId] || 30
}
