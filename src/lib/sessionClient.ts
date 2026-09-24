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

/**
 * Stable per-browser device UUID for login audit + trust exceptions.
 * Created once, reused forever (survives logout). Also mirrored to a
 * readable `jf_device_id` cookie so OAuth-redirect logins (no POST body)
 * can be attributed to the same device.
 */
export function getDeviceId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let id = localStorage.getItem('jf_device_id') || ''
    if (!id) {
      id = (globalThis.crypto?.randomUUID && globalThis.crypto.randomUUID()) ||
        `dev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      localStorage.setItem('jf_device_id', id)
    }
    document.cookie = `jf_device_id=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
    return id
  } catch {
    return ''
  }
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
