'use client'

/**
 * Client-side session validation.
 *
 * localStorage alone proves nothing (it survives logout expiry, TTL lapse,
 * and version bumps). Before auto-redirecting a "remembered" user, confirm
 * with the server. On failure the stale local identity is cleared so the
 * user lands on a clean sign-in screen instead of bouncing between pages.
 */

export interface LocalIdentity {
  uid: string
  email: string
  role: string
}

export function readLocalIdentity(): LocalIdentity | null {
  if (typeof window === 'undefined') return null
  const uid = localStorage.getItem('user_id') || ''
  if (!uid) return null
  return {
    uid,
    email: localStorage.getItem('user_email') || '',
    role: localStorage.getItem('user_role') || 'user'
  }
}

export function clearLocalIdentity() {
  try {
    localStorage.removeItem('user_id')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_plan')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_picture')
    localStorage.removeItem('enterprise_org_id')
  } catch {}
}

/** Returns the identity only if the server session is still valid. */
export async function validatedIdentity(): Promise<LocalIdentity | null> {
  const local = readLocalIdentity()
  if (!local) return null
  try {
    const res = await fetch(`/api/profile?user_id=${encodeURIComponent(local.uid)}`)
    if (res.ok) return local
  } catch {}
  clearLocalIdentity()
  return null
}
