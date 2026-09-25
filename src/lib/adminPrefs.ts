/**
 * Shared client for super-admin UI preferences.
 * Server (MongoDB `admin_preferences`, tagged by session user) is the source
 * of truth; localStorage is the instant cache. PUT merges per-key, so tabs
 * can save their own slice without clobbering each other.
 */

export type AdminPrefs = Record<string, string>

export async function loadAdminPrefs(): Promise<AdminPrefs> {
  try {
    const res = await fetch('/api/admin/preferences', { credentials: 'same-origin' })
    if (!res.ok) return {}
    const data = await res.json()
    return data.prefs && typeof data.prefs === 'object' ? data.prefs : {}
  } catch {
    return {}
  }
}

let saveTimer: any = null
let pendingPatch: AdminPrefs = {}

export function saveAdminPrefs(patch: AdminPrefs, debounceMs = 800) {
  Object.assign(pendingPatch, patch)
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const body = pendingPatch
    pendingPatch = {}
    if (Object.keys(body).length === 0) return
    fetch('/api/admin/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    }).catch(() => {})
  }, debounceMs)
}

export function cachePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}
