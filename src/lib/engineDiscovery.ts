/**
 * engineDiscovery.ts
 * Auto-discovers the best available engine URL by probing a priority list.
 *
 * Priority order:
 *  1. Last known-good URL from localStorage (instant reconnect)
 *  2. NEXT_PUBLIC_ENGINE_URL env var (set in Vercel dashboard)
 *  3. http://localhost:8000 (local dev only — skipped on HTTPS pages)
 *  4. http://127.0.0.1:8000 (local dev only — skipped on HTTPS pages)
 *
 * IMPORTANT: Browsers block HTTP requests from HTTPS pages (mixed-content).
 * When running on Vercel (https://), localhost URLs are automatically excluded.
 */

const STORAGE_KEY = 'engine_url_active'
const PROBE_TIMEOUT_MS = 5000

/** True when the page is served over HTTPS (e.g. Vercel deployment) */
function isHttpsContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.location.protocol === 'https:'
}

/**
 * Returns candidate URLs in priority order.
 * On HTTPS pages, HTTP localhost URLs are excluded (mixed-content blocked).
 */
function staticCandidates(): string[] {
  const candidates: string[] = []
  const https = isHttpsContext()

  // 1. Env var set in Vercel dashboard or .env.local
  const envUrl = process.env.NEXT_PUBLIC_ENGINE_URL
  if (envUrl && envUrl.trim()) {
    candidates.push(envUrl.trim().replace(/\/$/, ''))
  }

  // 2. Global HTTPS Engine endpoints (always safe for Vercel HTTPS clients)
  candidates.push('https://win.pirate-fomalhaut.ts.net')

  // 3. Localhost — only safe on HTTP pages (local dev)
  if (!https) {
    candidates.push('http://localhost:8000')
    candidates.push('http://127.0.0.1:8000')
  }

  return [...new Set(candidates)]
}

/** Probe a single URL — returns the URL if reachable, null otherwise */
export async function probeUrl(url: string): Promise<string | null> {
  // Never probe HTTP from an HTTPS page (will be blocked anyway)
  if (isHttpsContext() && url.startsWith('http://')) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
    const res = await fetch(`${url}/`, { cache: 'no-store', signal: controller.signal })
    clearTimeout(timer)
    if (res.ok) return url
  } catch {}
  return null
}

/** Probe all candidates in parallel, return first that responds */
export async function discoverEngineUrl(): Promise<string | null> {
  const candidates = staticCandidates()

  if (candidates.length === 0) {
    console.warn('[engineDiscovery] No candidates to probe. Set NEXT_PUBLIC_ENGINE_URL in Vercel.')
    return null
  }

  const results = await Promise.all(candidates.map(probeUrl))
  return results.find(r => r !== null) ?? null
}

export function saveActiveEngineUrl(url: string) {
  try { localStorage.setItem(STORAGE_KEY, url) } catch {}
}

export function getStoredEngineUrl(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

/**
 * Full bootstrap: tries stored URL first (instant), then full discovery.
 * Returns best URL or null if nothing responds.
 */
export async function bootstrapEngineUrl(): Promise<string | null> {
  // Fast path: reuse last known-good URL
  const stored = getStoredEngineUrl()
  if (stored) {
    const alive = await probeUrl(stored)
    if (alive) return alive
    // Stored URL died — clear it
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const found = await discoverEngineUrl()
  if (found) saveActiveEngineUrl(found)
  return found
}
