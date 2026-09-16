// Client-Side Visitor & Interaction Tracking Engine
// Generates persistent visitor UUIDs, tracks pageviews, button interactions, and payment intents

export interface TrackEventPayload {
  visitor_id?: string
  session_id?: string
  event_type: 'page_view' | 'payment_click' | 'payment_success' | 'payment_fail' | 'pwa_install_click' | 'cta_click' | 'custom'
  path?: string
  full_url?: string
  referrer?: string
  title?: string
  email?: string
  user_id?: string
  user_name?: string
  screen_resolution?: string
  language?: string
  metadata?: Record<string, any>
}

const VISITOR_COOKIE_NAME = 'jf_vid'
const SESSION_STORAGE_NAME = 'jf_sid'

/**
 * Generate a cryptographically strong UUID v4
 */
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get cookie by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

/**
 * Set persistent cookie (valid for 2 years)
 */
function setCookie(name: string, value: string, days: number = 730): void {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

/**
 * Retrieve or generate a persistent visitor ID (survives browser restarts)
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let vid = localStorage.getItem('jobflux_visitor_id')
    if (!vid) {
      vid = getCookie(VISITOR_COOKIE_NAME)
    }
    if (!vid) {
      vid = 'v_' + generateUUID()
    }
    localStorage.setItem('jobflux_visitor_id', vid)
    setCookie(VISITOR_COOKIE_NAME, vid)
    return vid
  } catch {
    return 'v_' + generateUUID()
  }
}

/**
 * Retrieve or generate a session ID (resets on browser session close)
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_NAME)
    if (!sid) {
      sid = 's_' + generateUUID()
      sessionStorage.setItem(SESSION_STORAGE_NAME, sid)
    }
    return sid
  } catch {
    return 's_' + generateUUID()
  }
}

/**
 * Extract authenticated user info from localStorage if available
 */
function getStoredUserInfo(): { email?: string; userId?: string; name?: string } {
  if (typeof window === 'undefined') return {}
  try {
    const email = localStorage.getItem('user_email') || undefined
    const userId = localStorage.getItem('user_id') || undefined
    const name = localStorage.getItem('user_name') || undefined
    return { email, userId, name }
  } catch {
    return {}
  }
}

/**
 * Send an event payload to the server non-blockingly using sendBeacon or keepalive fetch
 */
export function sendTrackEvent(payload: TrackEventPayload): void {
  if (typeof window === 'undefined') return

  try {
    const visitor_id = payload.visitor_id || getVisitorId()
    const session_id = payload.session_id || getSessionId()
    const storedUser = getStoredUserInfo()

    const fullPayload: TrackEventPayload = {
      visitor_id,
      session_id,
      event_type: payload.event_type,
      path: payload.path || window.location.pathname,
      full_url: payload.full_url || window.location.href,
      referrer: payload.referrer !== undefined ? payload.referrer : (document.referrer || 'Direct'),
      title: payload.title || document.title,
      email: payload.email || storedUser.email,
      user_id: payload.user_id || storedUser.userId,
      user_name: payload.user_name || storedUser.name,
      screen_resolution:
        payload.screen_resolution ||
        (typeof window.screen !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : undefined),
      language: payload.language || (typeof navigator !== 'undefined' ? navigator.language : undefined),
      metadata: payload.metadata || {}
    }

    const jsonString = JSON.stringify(fullPayload)

    // Primary transport: Reliable first-party fetch with keepalive (guaranteed standard JSON)
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: jsonString,
      keepalive: true
    }).catch((err) => {
      // Fallback: sendBeacon if page is unloading or fetch fails
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          const blob = new Blob([jsonString], { type: 'application/json' })
          navigator.sendBeacon('/api/track', blob)
        }
      } catch {}
    })
  } catch (err) {
    console.debug('[Tracker] Non-fatal tracking error:', err)
  }
}

/**
 * Track a Page View event
 */
export function trackPageView(path?: string, title?: string, metadata?: Record<string, any>): void {
  sendTrackEvent({
    event_type: 'page_view',
    path,
    title,
    metadata
  })
}

/**
 * Track a Payment Intent click (Plan upgrade, checkout modal, offer claim)
 */
export function trackPaymentClick(
  planId: string,
  planName: string,
  amount: number | string,
  metadata?: Record<string, any>
): void {
  const numericAmount =
    typeof amount === 'number'
      ? amount
      : Number(String(amount).replace(/[^0-9.]/g, '')) || 0

  sendTrackEvent({
    event_type: 'payment_click',
    metadata: {
      plan_id: planId,
      plan_name: planName,
      amount: numericAmount,
      raw_amount: amount,
      clicked_at: new Date().toISOString(),
      ...metadata
    }
  })
}

/**
 * Track general interactive CTA or button clicks
 */
export function trackCtaClick(buttonName: string, metadata?: Record<string, any>): void {
  sendTrackEvent({
    event_type: 'cta_click',
    metadata: {
      button_name: buttonName,
      ...metadata
    }
  })
}

/**
 * Track PWA install interactions
 */
export function trackPwaInteraction(action: 'modal_opened' | 'prompt_accepted' | 'instructions_viewed' | 'manual_confirmed'): void {
  sendTrackEvent({
    event_type: 'pwa_install_click',
    metadata: {
      pwa_action: action
    }
  })
}
