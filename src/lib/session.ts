import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual, randomBytes } from 'crypto'

/**
 * Cookie session auth — the ONLY server-side auth mechanism.
 *
 * Replaces the old `x-user-id` header trust (spoofable by any client).
 * Tokens are HMAC-SHA256 signed; payload carries the verified identity,
 * so API routes never trust client-supplied ids.
 *
 * Secret resolution (no mandatory env config):
 *   1. SESSION_SECRET env (32+ chars) when set — highest priority.
 *   2. Otherwise a deployment secret auto-provisioned once into MongoDB
 *      `system_config.session_secret` and reused by every serverless
 *      instance (atomic insert-if-absent, so concurrent boots agree).
 *
 * Frontend: same-origin fetch sends the cookie automatically — do NOT send
 * identity headers. localStorage role flags remain for UI routing only.
 */

export const SESSION_COOKIE = 'jf_session'
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

export interface SessionPayload {
  uid: string
  email: string
  role: 'admin' | 'enterprise_admin' | 'user'
  orgId?: string | null
  entRole?: string | null
  v: number
  exp: number
}

let cachedSecret: string | null = null

export async function getSessionSecret(): Promise<string> {
  if (cachedSecret && cachedSecret.length >= 32) return cachedSecret

  const env = process.env.SESSION_SECRET || ''
  if (env.length >= 32) {
    cachedSecret = env
    return env
  }

  // Auto-provision: one shared secret persisted in MongoDB.
  const { getDb } = await import('@/lib/mongodb')
  const db = await getDb()
  if (!db) {
    throw new Error(
      'SESSION_SECRET missing and database unreachable — cannot establish session auth. ' +
      'Set SESSION_SECRET (32+ chars) in env.'
    )
  }
  const existing = await db.collection('system_config').findOne({ key: 'session_secret' })
  if (existing?.secret && String(existing.secret).length >= 32) {
    cachedSecret = String(existing.secret)
    return cachedSecret
  }
  const fresh = randomBytes(48).toString('hex')
  await db.collection('system_config').findOneAndUpdate(
    { key: 'session_secret' },
    { $setOnInsert: { key: 'session_secret', secret: fresh, created_at: new Date() } },
    { upsert: true }
  )
  const final = await db.collection('system_config').findOne({ key: 'session_secret' })
  const secret = final?.secret && String(final.secret).length >= 32 ? String(final.secret) : fresh
  cachedSecret = secret
  return secret
}

function b64urlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Buffer.from(s, 'base64').toString('utf-8')
}

export async function signSession(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = SESSION_TTL_SECONDS): Promise<string> {
  const secret = await getSessionSecret()
  const body = b64urlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
  const sig = b64urlEncode(createHmac('sha256', secret).update(body).digest())
  return `${body}.${sig}`
}

export async function verifySession(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token || !token.includes('.')) return null
  try {
    const secret = await getSessionSecret()
    const [body, sig] = token.split('.')
    const expected = b64urlEncode(createHmac('sha256', secret).update(body).digest())
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null
    const payload = JSON.parse(b64urlDecode(body)) as SessionPayload
    if (!payload.uid || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null
    if (!['admin', 'enterprise_admin', 'user'].includes(payload.role)) return null
    if (typeof payload.v !== 'number') return null
    return payload
  } catch {
    return null
  }
}

export async function readSession(req: NextRequest): Promise<SessionPayload | null> {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value)
}

export async function issueSession(res: NextResponse, payload: Omit<SessionPayload, 'exp'>): Promise<NextResponse> {
  const token = await signSession(payload)
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS
  })
  return res
}

export function clearSession(res: NextResponse): NextResponse {
  res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return res
}
