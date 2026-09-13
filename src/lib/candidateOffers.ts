/**
 * Candidate Offers & Notifications Client API Service
 * 
 * Centralized functions for querying exclusive promotional offers, validating
 * offer assignment during checkout, and updating notification read status.
 */

export interface CandidateOffer {
  id: string
  promo_code: string
  preset_id: string
  offer_title: string
  discount_badge: string
  original_price: string
  discounted_price: string
  claim_url: string
  custom_message?: string
  created_at: string
}

export interface CandidateNotification {
  id: string
  title: string
  message: string
  promo_code?: string
  claim_url?: string
  created_at: string
}

export interface CandidateOffersResponse {
  assigned_offers: CandidateOffer[]
  unclaimed_count: number
  latest_offer: CandidateOffer | null
  notifications: CandidateNotification[]
}

/**
 * Fetch assigned offers and unread notifications for a candidate email.
 */
export async function fetchCandidateOffers(email: string): Promise<CandidateOffersResponse> {
  if (!email) {
    return {
      assigned_offers: [],
      unclaimed_count: 0,
      latest_offer: null,
      notifications: []
    }
  }

  const clean = email.toLowerCase().trim()
  const res = await fetch(`/api/user/offers?email=${encodeURIComponent(clean)}&t=${Date.now()}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch offers (HTTP ${res.status})`)
  }
  return res.json()
}

/**
 * Validate whether a promo code is assigned to a candidate and valid for the selected plan.
 */
export async function validateCandidatePromo(
  email: string,
  promoCode: string,
  planId?: string
): Promise<{
  valid: boolean
  offer?: CandidateOffer
  discount?: {
    amount: number
    name: string
    allowedPlans: string[]
    days: number
  }
  message?: string
  error?: string
}> {
  const cleanEmail = (email || '').toLowerCase().trim()
  const cleanPromo = (promoCode || '').trim().toUpperCase()

  const res = await fetch('/api/user/offers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: cleanEmail,
      promo_code: cleanPromo,
      plan_id: planId
    })
  })

  return res.json()
}

/**
 * Mark a notification or all notifications as read for a candidate.
 */
export async function markNotificationAsRead(notificationId?: string, email?: string): Promise<boolean> {
  if (!notificationId && !email) return false
  try {
    const res = await fetch('/api/user/offers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification_id: notificationId,
        email: email ? email.toLowerCase().trim() : undefined
      })
    })
    return res.ok
  } catch (err) {
    console.warn('Failed to mark notification read:', err)
    return false
  }
}
