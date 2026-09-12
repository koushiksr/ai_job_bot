import { NextRequest } from 'next/server'

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory rate limit cache with sliding window
const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodically clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

/**
 * Check and enforce rate limits for incoming API requests.
 * @param req NextRequest
 * @param options { limit: number, windowSeconds: number, identifierKey?: string }
 * @returns { success: boolean, remaining: number, resetSeconds: number }
 */
export function checkRateLimit(
  req: NextRequest,
  options: {
    limit?: number
    windowSeconds?: number
    customKey?: string
  } = {}
): {
  success: boolean
  remaining: number
  resetSeconds: number
} {
  const limit = options.limit || 30
  const windowMs = (options.windowSeconds || 60) * 1000

  // Extract client IP or identifier
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'

  const key = options.customKey ? `${options.customKey}:${ip}` : `${req.nextUrl.pathname}:${ip}`
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000)
    }
  }

  if (record.count >= limit) {
    const resetSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000))
    return {
      success: false,
      remaining: 0,
      resetSeconds
    }
  }

  record.count += 1
  return {
    success: true,
    remaining: limit - record.count,
    resetSeconds: Math.ceil((record.resetTime - now) / 1000)
  }
}

