import { NextRequest } from 'next/server'

/**
 * Rate limiter with a shared MongoDB fixed window (works across Vercel
 * serverless instances) and an in-memory fallback when the DB is unreachable.
 *
 * Storage: `rate_limits` collection, one doc per key with a TTL on `resetAt`
 * so expired windows self-clean without any timer.
 */

interface RateLimitResult {
  success: boolean
  remaining: number
  resetSeconds: number
}

export interface RateLimitOptions {
  limit?: number
  windowSeconds?: number
  customKey?: string
}

// In-memory fallback (single instance only — used solely when Mongo is down)
const fallbackMap = new Map<string, { count: number; resetTime: number }>()
let ttlIndexEnsured = false

async function ensureTtlIndex(db: any) {
  if (ttlIndexEnsured) return
  try {
    await db.collection('rate_limits').createIndex({ resetAt: 1 }, { expireAfterSeconds: 0 })
    ttlIndexEnsured = true
  } catch {
    // Index races / permissions — limiting still works, cleanup just lags
  }
}

function clientKey(req: NextRequest, options: RateLimitOptions): string {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  const base = options.customKey ? `${options.customKey}:${ip}` : `${req.nextUrl.pathname}:${ip}`
  return `ratelimit:${base}`
}

function memoryFallback(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const record = fallbackMap.get(key)
  if (!record || now > record.resetTime) {
    fallbackMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, resetSeconds: Math.ceil(windowMs / 1000) }
  }
  record.count += 1
  if (record.count > limit) {
    return { success: false, remaining: 0, resetSeconds: Math.max(0, Math.ceil((record.resetTime - now) / 1000)) }
  }
  return { success: true, remaining: limit - record.count, resetSeconds: Math.ceil((record.resetTime - now) / 1000) }
}

/**
 * Check and enforce rate limits for incoming API requests.
 * Shared across instances via MongoDB; atomic single-round-trip increment.
 */
export async function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const limit = options.limit || 30
  const windowMs = (options.windowSeconds || 60) * 1000
  const key = clientKey(req, options)

  try {
    const { getDb } = await import('@/lib/mongodb')
    const db = await getDb()
    if (!db) return memoryFallback(key, limit, windowMs)
    await ensureTtlIndex(db)

    const updated: any = await (db.collection('rate_limits') as any).findOneAndUpdate(
      { _id: key },
      [
        {
          $set: {
            count: {
              $cond: [{ $gt: ['$resetAt', '$$NOW'] }, { $add: [{ $ifNull: ['$count', 0] }, 1] }, 1]
            },
            resetAt: {
              $cond: [{ $gt: ['$resetAt', '$$NOW'] }, '$resetAt', { $add: ['$$NOW', windowMs] }]
            }
          }
        }
      ],
      { upsert: true, returnDocument: 'after' }
    )

    const count = Number(updated?.count || 1)
    const resetAt = updated?.resetAt ? new Date(updated.resetAt).getTime() : Date.now() + windowMs
    const resetSeconds = Math.max(0, Math.ceil((resetAt - Date.now()) / 1000))
    if (count > limit) {
      return { success: false, remaining: 0, resetSeconds }
    }
    return { success: true, remaining: limit - count, resetSeconds }
  } catch {
    return memoryFallback(key, limit, windowMs)
  }
}
