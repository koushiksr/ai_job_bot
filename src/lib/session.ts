import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Cookie session auth — the ONLY server-side auth mechanism.
 *
 * Replaces the old `x-user-id` header trust (spoofable by any client).
 * Tokens are HMAC-SHA256 signed with SESSION_SECRET; payload carries the
 * verified identity, so API routes never trust client-supplied ids.
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

function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET || ''
  if (!s || s.length < 32) {
    throw new Error(
      'SESSION_SECRET missing or too short (min 32 chars). ' +
      'Set it in Vercel env — auth is disabled until configured.'
    )
  }
  return s
}

function b64urlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(input: string): string {
  let s = input.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return Buffer.from(s, 'base64').toString('utf-8')
}

export function signSession(payload: Omit<SessionPayload, 'exp'>, ttlSeconds = SESSION_TTL_SECONDS): string {
  const body = b64urlEncode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
  const sig = b64urlEncode(createHmac('sha256', getSessionSecret()).update(body).digest())
  return `${body}.${sig}`
}

export function verifySession(token: string | null | undefined): SessionPayload | null {
  if (!token || !token.includes('.')) return null
  try {
    const [body, sig] = token.split('.')
    const expected = b64urlEncode(createHmac('sha256', getSessionSecret()).update(body).digest())
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

export function readSession(req: NextRequest): SessionPayload | null {
  return verifySession(req.cookies.get(SESSION_COOKIE)?.value)
}

export function issueSession(res: NextResponse, payload: Omit<SessionPayload, 'exp'>): NextResponse {
  const token = signSession(payload)
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
