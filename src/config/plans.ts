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
    name: 'Pro (1 Month)',
    subtitle: 'Maximum speed, automated daily applies, and priority queue.',
    badge: 'POPULAR',
    price: '₹499',
    originalPrice: '₹1,499',
    amountPaise: 49900,
    period: '/ month',
    durationDays: 30,
    featuresIntro: 'Everything in Free, with 55 daily applications and priority queue...',
    features: [
      { text: '30 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 55 Verified Job Applications / Day (Platform Max)' },
      { text: 'On-Demand Real-Time Sweeps (Up to 10x / week)' },
      { text: 'Harvard ATS Resume Optimization & Keyword Match' },
      { text: 'AI Tailored Responses for Recruiter Screening' },
      { text: 'Priority Cloud Worker Queue Slot' },
      { text: 'Live Application History & Recruiter Links' }
    ],
    cta: 'Get 1 Month for ₹499',
    popular: true,
    highlight: true
  },
  {
    id: 'elite',
    name: 'Pro (3 Months)',
    subtitle: 'Best value 90-day comprehensive pipeline until you sign an offer.',
    badge: 'BEST VALUE',
    price: '₹1,299',
    originalPrice: '₹3,999',
    amountPaise: 129900,
    period: '/ 3 months',
    durationDays: 90,
    featuresIntro: 'Everything in 1-Month Pro, with extended 90-day pipeline, plus...',
    features: [
      { text: '90 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 55 Verified Job Applications / Day (Platform Max)' },
      { text: 'VIP Priority Server Queue Slot' },
      { text: 'Harvard ATS Resume Optimization & Keyword Match' },
      { text: 'On-Demand Real-Time Sweeps (Up to 15x / week)' },
      { text: 'Continuous Applications Until Hired' },
      { text: 'Dedicated Recruiter Response Priority' }
    ],
    cta: 'Get 3 Months for ₹1,299',
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
    code: 'PRO399',
    presetId: 'pro_399',
    name: '1-Month Pro Starter Pass (₹399 / mo)',
    offerTitle: 'Introductory Special: 1-Month JobFlux Pro for ₹399',
    discountBadge: '₹100 OFF (STARTER PASS)',
    originalPrice: '₹499 / mo',
    discountedPrice: '₹399 / mo',
    amountPaise: 39900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Pro - 1-Month Starter Pass (30 Days)',
    customMessage: 'Unlock 30 days of continuous daily autonomous job applications (55 applies/day), Harvard ATS resume formatting, and direct priority recruiter submission for just ₹399 (Regular ₹499/mo).',
    pricingDisplay: {
      displayPrice: '₹399',
      label: 'Special Starter Pass (Regular ₹499 / mo)'
    },
    category: 'individual'
  },
  {
    code: 'PRO999',
    presetId: 'pro_999',
    name: '3-Month Pro Comprehensive Saver (₹999 / 3 mos)',
    offerTitle: 'Comprehensive 90-Day Pipeline: JobFlux Pro for ₹999',
    discountBadge: 'SAVE ₹300 (BEST VALUE)',
    originalPrice: '₹1,299 / 3 mos',
    discountedPrice: '₹999 / 3 mos',
    amountPaise: 99900,
    allowedPlans: ['elite', 'professional'],
    durationDays: 90,
    description: 'JobFlux Pro - 3-Month Comprehensive Pass (90 Days)',
    customMessage: 'Get 90 days of continuous automated applications (55 applies/day), on-demand sweeps up to 15x/week, and VIP queue priority at ₹999 (Regular ₹1,299/3 mos).',
    pricingDisplay: {
      displayPrice: '₹999',
      label: '3-Month Comprehensive Saver (Regular ₹1,299 / 3 mos)'
    },
    category: 'individual'
  },
  {
    code: 'WELCOMEPRO',
    presetId: 'welcome_pro',
    name: 'Candidate Welcome Special (₹399 / mo)',
    offerTitle: 'Candidate Welcome Special: JobFlux Pro for ₹399',
    discountBadge: 'WELCOME SPECIAL (₹399)',
    originalPrice: '₹499 / mo',
    discountedPrice: '₹399 / mo',
    amountPaise: 39900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Pro - Candidate Welcome Special (30 Days)',
    customMessage: 'Welcome offer! Get 30 days of continuous autonomous job applications (55 applies/day) for only ₹399.',
    pricingDisplay: {
      displayPrice: '₹399',
      label: 'New Candidate Special (Regular ₹499 / mo)'
    },
    category: 'individual'
  },
  {
    code: 'OFFER90',
    presetId: 'offer_99',
    name: '1-Month Pro Special Pass (₹399 / mo)',
    offerTitle: 'Candidate Special: JobFlux Pro for ₹399',
    discountBadge: 'SPECIAL PASS (₹399)',
    originalPrice: '₹499 / mo',
    discountedPrice: '₹399 / mo',
    amountPaise: 39900,
    allowedPlans: ['pro', 'starter'],
    durationDays: 30,
    description: 'JobFlux Pro - Special Pass (30 Days)',
    customMessage: 'Unlock 30 days of continuous daily autonomous job applications (55 applies/day) for just ₹399.',
    pricingDisplay: {
      displayPrice: '₹399',
      label: 'Special Pass (Regular ₹499 / mo)'
    },
    category: 'individual'
  },
  {
    code: 'PRO199',
    presetId: 'pro_199',
    name: '3-Month Pro Saver (₹999 / 3 mos)',
    offerTitle: 'Comprehensive 90-Day Pipeline: JobFlux Pro for ₹999',
    discountBadge: 'SAVE ₹300 (₹999)',
    originalPrice: '₹1,299 / 3 mos',
    discountedPrice: '₹999 / 3 mos',
    amountPaise: 99900,
    allowedPlans: ['elite', 'professional'],
    durationDays: 90,
    description: 'JobFlux Pro - 3-Month Pipeline (90 Days)',
    customMessage: 'Get 90 days of continuous automated applications (55 applies/day) with VIP priority for ₹999.',
    pricingDisplay: {
      displayPrice: '₹999',
      label: '3-Month Saver Pass (Regular ₹1,299 / 3 mos)'
    },
    category: 'individual'
  },
  {
    code: 'VIP299',
    presetId: 'vip_299',
    name: '3-Month VIP Pro Extension (₹999 / 3 mos)',
    offerTitle: '3-Month VIP Extension: Continuous Job Applications for ₹999',
    discountBadge: 'VIP EXTENSION (₹999)',
    originalPrice: '₹1,299 / 3 mos',
    discountedPrice: '₹999 / 3 mos',
    amountPaise: 99900,
    allowedPlans: ['elite', 'professional'],
    durationDays: 90,
    description: 'JobFlux Pro - VIP 3-Month Extension (90 Days)',
    customMessage: 'Extend your autonomous job applications for 3 full months with VIP priority server queue for only ₹999.',
    pricingDisplay: {
      displayPrice: '₹999',
      label: '3-Month VIP Extension (Regular ₹1,299 Value)'
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
  },
  {
    code: 'ORGSTART79',
    presetId: 'org_starter_79',
    name: 'Org Starter Member Pass (₹79 / mo)',
    offerTitle: 'Organization Member Starter: JobFlux Org Starter for ₹79',
    discountBadge: 'ORG STARTER (₹79)',
    originalPrice: '₹499 / mo',
    discountedPrice: '₹79 / mo',
    amountPaise: 7900,
    allowedPlans: ['org_starter'],
    durationDays: 30,
    description: 'JobFlux Org Starter - Member Pass (30 Days)',
    customMessage: 'Activate your Org Starter pass! Get 30 days of autonomous morning applications (20 applies/day, scheduled sweeps) for just ₹79.',
    pricingDisplay: {
      displayPrice: '₹79',
      label: 'Org Starter Member Pass (₹79 / mo)'
    },
    category: 'org_member'
  },
  {
    code: 'ORGPRO289',
    presetId: 'org_pro_289',
    name: 'Org Pro 3-Month Comprehensive Pass (₹289 / 3 mos)',
    offerTitle: 'Organization Member 90-Day Pipeline: JobFlux Org Pro for ₹289',
    discountBadge: 'ORG PRO 3-MO (₹289)',
    originalPrice: '₹2,500 / 3 mos',
    discountedPrice: '₹289 / 3 mos',
    amountPaise: 28900,
    allowedPlans: ['org_pro_3m', 'org_pro'],
    durationDays: 90,
    description: 'JobFlux Org Pro - 3-Month Comprehensive Pass (90 Days)',
    customMessage: 'Unlock 90 days of continuous auto-apply (55 daily applications, 15 weekly on-demand sweeps, VIP priority queue) for just ₹289.',
    pricingDisplay: {
      displayPrice: '₹289',
      label: 'Org Pro 3-Month Pass (₹289 / 3 mos)'
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
    id: 'org_starter',
    name: 'Org Starter',
    subtitle: 'Essential daily job automation for org candidates.',
    badge: 'STARTER',
    price: '₹79',
    originalPrice: '₹499',
    amountPaise: 7900,
    period: '/ month',
    durationDays: 30,
    featuresIntro: 'Continuous automated applications without on-demand sweeps...',
    features: [
      { text: '30 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 20 Verified Job Applications / Day' },
      { text: 'Daily Morning Scheduled Sweep (06:00 AM IST)' },
      { text: 'Automated Recruiter Screening Responses' },
      { text: 'No On-Demand Sweeps (Scheduled Daily Only)' },
      { text: 'Stays linked to your organization & admin' }
    ],
    cta: 'Get Org Starter (₹79)',
    highlight: false
  },
  {
    id: 'org_pro',
    name: 'Org Pro',
    subtitle: 'Maximum speed, higher volume, and on-demand sweeps.',
    badge: 'POPULAR',
    price: '₹99',
    originalPrice: '₹1,000',
    amountPaise: 9900,
    period: '/ month',
    durationDays: 30,
    featuresIntro: 'Everything in Starter, plus 55/day and priority sweeps...',
    features: [
      { text: '30 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 55 Verified Job Applications / Day (Platform Max)' },
      { text: 'On-Demand Real-Time Sweeps (Up to 15x / week)' },
      { text: 'Priority Cloud Worker Queue Slot' },
      { text: 'AI Resume Optimization & Keyword Match' },
      { text: 'Stays linked to your organization & admin' }
    ],
    cta: 'Upgrade to Org Pro (₹99)',
    highlight: true,
    popular: true
  },
  {
    id: 'org_pro_3m',
    name: 'Org Pro (3 Months)',
    subtitle: 'Best value 90-day comprehensive pipeline until hired.',
    badge: 'BEST VALUE',
    price: '₹289',
    originalPrice: '₹2,500',
    amountPaise: 28900,
    period: '/ 3 months',
    durationDays: 90,
    featuresIntro: 'Extended 90-day pipeline with priority worker queue...',
    features: [
      { text: '90 Days of Continuous Daily Auto-Apply' },
      { text: 'Up to 55 Verified Job Applications / Day (Platform Max)' },
      { text: 'On-Demand Real-Time Sweeps (Up to 15x / week)' },
      { text: 'VIP Priority Cloud Worker Queue Slot' },
      { text: 'AI Resume Optimization & Keyword Match' },
      { text: 'Stays linked to your organization & admin' }
    ],
    cta: 'Get Org Pro 3 Months (₹289)',
    highlight: false
  }
]

export function getOrgPlan(planId: string): PlanDefinition | undefined {
  return ORG_PLANS.find(p => p.id === planId)
}

/** True for organization-linked plans. */
export function isOrgPlanId(planId?: string | null): boolean {
  return planId === 'enterprise' || planId === 'org_starter' || planId === 'org_pro' || planId === 'org_pro_3m'
}

/** Weekly on-demand run allowance per plan. */
export function getWeeklyOnDemandLimit(planId?: string | null, isEnterpriseMember = false): number {
  const p = (planId || '').toLowerCase()
  if (p === 'org_pro' || p === 'org_pro_3m') return 15
  if (p === 'org_starter') return 0 // No on-demand sweeps for org starter
  if (p === 'enterprise' || (isEnterpriseMember && !p.startsWith('org_pro'))) return 0 // Unpaid enterprise member gets 0
  if (p === 'elite' || p === 'professional') return 15
  if (p === 'pro') return 10
  if (p === 'starter') return 5
  return 0
}

/**
 * Daily application cap per plan.
 * If an enterprise member has NOT paid, they cannot apply even one job (0 applies/day).
 * Org Starter: 20 applies/day.
 * Org Pro (1m or 3m): 55 applies/day.
 */
export function getDailyAppLimit(planId?: string | null, isEnterpriseMember = false): number {
  const p = (planId || '').toLowerCase()
  if (isEnterpriseMember) {
    if (p === 'org_pro' || p === 'org_pro_3m' || p === 'pro' || p === 'elite' || p === 'vip') return 55
    if (p === 'org_starter' || p === 'starter') return 20
    return 0 // Unpaid org member cannot apply even one job
  }
  if (p === 'trial') return 10
  if (p === 'starter' || p === 'org_starter') return 20
  if (p === 'none' || p === 'no_plan' || p === 'unpaid' || !p) return 0
  return 55
}

/** Upgrade nudge for capped tiers. Empty string when nothing to upsell. */
export function getCapUpgradeHint(planId?: string | null, isEnterpriseMember = false): number | string {
  const p = (planId || '').toLowerCase()
  if (isEnterpriseMember && (p === 'enterprise' || p === 'none' || p === 'unpaid' || !p)) {
    return 'Payment required to apply. Subscribe to Org Starter (₹79) or Org Pro (₹99) to begin applications.'
  }
  if (p === 'org_starter') return 'Org Starter allows 20/day with 0 on-demand sweeps — upgrade to Org Pro for 55/day and 15 weekly sweeps.'
  if (p === 'trial') return 'Free trial allows 10/day — upgrade to Pro for 55/day.'
  if (p === 'starter') return 'Starter allows 20/day — upgrade to Pro for 55/day.'
  return ''
}

/**
 * Backend Razorpay Plan Amounts Map
 * Supports canonical IDs and historical aliases.
 */
export const PLAN_AMOUNTS: Record<string, { amount: number; name: string; days: number }> = {
  starter: { amount: 49900, name: 'JobFlux Pro (1 Month)', days: 30 },
  pro: { amount: 49900, name: 'JobFlux Pro (1 Month)', days: 30 },
  elite: { amount: 129900, name: 'JobFlux Pro (3 Months)', days: 90 },
  professional: { amount: 129900, name: 'JobFlux Pro (3 Months)', days: 90 },
  org_starter: { amount: 7900, name: 'JobFlux Org Starter (30 Days)', days: 30 },
  org_pro: { amount: 9900, name: 'JobFlux Org Pro — Member Upgrade (30 Days)', days: 30 },
  org_pro_3m: { amount: 28900, name: 'JobFlux Org Pro — 3-Month Pass (90 Days)', days: 90 }
}

/**
 * Plan duration in days map for payment verification
 */
export const PLAN_DAYS: Record<string, number> = {
  starter: 30,
  pro: 30,
  elite: 90,
  professional: 90,
  org_starter: 30,
  org_pro: 30,
  org_pro_3m: 90
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
