import { getDb } from './mongodb'
import type { SessionPayload } from './session'

/**
 * Per-device session registry (collection `user_sessions`).
 *
 * Why: the old model bumped the account-wide `session_v` on every logout,
 * so signing out on one phone killed every other device too. Now each login
 * mints a unique `jti`; logout revokes only its own row. `session_v` remains
 * as the global epoch for "log out everywhere".
 *
 * Reads fail OPEN (return live) — the cookie signature + `v` check remain
 * the backstop, so a transient DB blip never mass-logs-out users.
 */

const SESSION_DOC_TTL_SECONDS = 30 * 24 * 60 * 60
const MAX_SESSIONS_PER_USER = 10

export interface DeviceSession {
  user_id: string
  jti: string
  device_label: string
  created_at: Date
}

async function ensureIndex() {
  const db = await getDb()
  if (!db) return null
  try {
    await db.collection('user_sessions').createIndex({ created_at: 1 }, { expireAfterSeconds: SESSION_DOC_TTL_SECONDS })
    await db.collection('user_sessions').createIndex({ user_id: 1, jti: 1 }, { unique: true })
  } catch {}
  return db
}

/** True when this device token may still be used. Legacy tokens (no jti) pass. */
export async function isSessionLive(userId: string, jti?: string | null): Promise<boolean> {
  if (!jti) return true
  try {
    const db = await getDb()
    if (!db) return true
    const doc = await db.collection('user_sessions').findOne({ user_id: userId, jti })
    return Boolean(doc)
  } catch {
    return true
  }
}

export async function registerSession(userId: string, jti: string, deviceLabel: string): Promise<void> {
  try {
    const db = await ensureIndex()
    if (!db || !userId || !jti) return
    await db.collection('user_sessions').updateOne(
      { user_id: userId, jti },
      { $set: { user_id: userId, jti, device_label: (deviceLabel || '').slice(0, 160), created_at: new Date() } },
      { upsert: true }
    )
    // Cap rows per user (FIFO) so the collection can't grow unbounded.
    try {
      const extras = await db.collection('user_sessions')
        .find({ user_id: userId }, { projection: { _id: 1 } })
        .sort({ created_at: -1 })
        .skip(MAX_SESSIONS_PER_USER)
        .toArray()
      if (extras.length > 0) {
        await db.collection('user_sessions').deleteMany({ _id: { $in: extras.map((d: any) => d._id) } })
      }
    } catch {}
  } catch {}
}

export async function revokeSession(userId: string, jti?: string | null): Promise<void> {
  if (!userId || !jti) return
  try {
    const db = await getDb()
    if (!db) return
    await db.collection('user_sessions').deleteOne({ user_id: userId, jti })
  } catch {}
}

export async function revokeAllSessions(userId: string): Promise<void> {
  if (!userId) return
  try {
    const db = await getDb()
    if (!db) return
    await db.collection('user_sessions').deleteMany({ user_id: userId })
  } catch {}
}

/** Mint + register one device session; never throws (login must not fail). */
export async function mintDeviceSession(userId: string, userAgent?: string | null): Promise<string> {
  const { newSessionId } = await import('./session')
  const jti = newSessionId()
  try {
    const label = (userAgent || '').slice(0, 160) || 'unknown device'
    await registerSession(userId, jti, label)
  } catch {}
  return jti
}

/** Convenience: false when a jti-bearing session was revoked elsewhere. */
export async function isSessionRevoked(sess: SessionPayload | null): Promise<boolean> {
  if (!sess || !sess.jti) return false
  return !(await isSessionLive(sess.uid, sess.jti))
}
