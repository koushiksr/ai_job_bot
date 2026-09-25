import { Db } from 'mongodb'

/**
 * Browser ↔ identity map, backed by `visitors_summary` (one doc per visitor_id).
 * Auto-learned: any authenticated tracked event / login binds that browser's
 * visitor_id to the email. Manual super-admin tags win over auto-learning.
 */

export interface VisitorIdentity {
  email: string | null
  user_id: string | null
  manual: boolean
}

export async function getIdentityMap(db: Db, visitorIds: string[]): Promise<Map<string, VisitorIdentity>> {
  const map = new Map<string, VisitorIdentity>()
  const ids = [...new Set((visitorIds || []).filter(Boolean))].slice(0, 200)
  if (ids.length === 0) return map
  try {
    const docs = await db.collection('visitors_summary')
      .find({ visitor_id: { $in: ids } }, { projection: { visitor_id: 1, identified_email: 1, identified_user_id: 1, manual_tag: 1 } })
      .toArray()
    for (const d of docs) {
      if (d.identified_email) {
        map.set(d.visitor_id, {
          email: d.identified_email,
          user_id: d.identified_user_id || null,
          manual: d.manual_tag === true
        })
      }
    }
  } catch {}
  return map
}

/**
 * Bind a browser to an identity. Never overwrites a *different* manual tag.
 * Returns true when the mapping was written.
 */
export async function linkVisitorToUser(
  db: Db,
  opts: { visitor_id: string; email: string; user_id?: string | null }
): Promise<boolean> {
  const vid = (opts.visitor_id || '').trim()
  const email = (opts.email || '').trim().toLowerCase()
  if (!vid || !email) return false
  try {
    const res = await db.collection('visitors_summary').updateOne(
      { visitor_id: vid, $or: [{ manual_tag: { $ne: true } }, { identified_email: email }] },
      {
        $set: {
          identified_email: email,
          ...(opts.user_id ? { identified_user_id: opts.user_id } : {}),
          last_seen_at: new Date()
        },
        $setOnInsert: { visitor_id: vid, first_seen_at: new Date() }
      },
      { upsert: true }
    )
    return (res.modifiedCount + (res.upsertedCount || 0)) > 0
  } catch {
    return false
  }
}

/** Super-admin manual tag: this browser IS this person. Wins over auto-learning. */
export async function tagVisitorManually(
  db: Db,
  opts: { visitor_id: string; email: string; user_id?: string | null; taggedBy: string }
): Promise<boolean> {
  const vid = (opts.visitor_id || '').trim()
  const email = (opts.email || '').trim().toLowerCase()
  if (!vid || !email || !email.includes('@')) return false
  try {
    try {
      await db.collection('visitors_summary').createIndex({ visitor_id: 1 }, { unique: true })
    } catch {}
    await db.collection('visitors_summary').updateOne(
      { visitor_id: vid },
      {
        $set: {
          visitor_id: vid,
          identified_email: email,
          manual_email: email,
          ...(opts.user_id ? { identified_user_id: opts.user_id } : {}),
          manual_tag: true,
          tagged_by: opts.taggedBy,
          tagged_at: new Date(),
          last_seen_at: new Date()
        },
        $setOnInsert: { first_seen_at: new Date() }
      },
      { upsert: true }
    )
    return true
  } catch {
    return false
  }
}

/** Remove a manual tag (auto-learned email, if any, stays). */
export async function untagVisitor(db: Db, visitorId: string): Promise<boolean> {
  const vid = (visitorId || '').trim()
  if (!vid) return false
  try {
    const doc = await db.collection('visitors_summary').findOne({ visitor_id: vid })
    if (!doc) return false
    const unset: Record<string, ''> = { manual_tag: '', tagged_by: '', tagged_at: '' }
    // If the displayed email came only from the manual tag, clear it too.
    if (doc.manual_email && doc.identified_email === doc.manual_email) {
      unset.identified_email = ''
      unset.manual_email = ''
      unset.identified_user_id = ''
    } else {
      unset.manual_email = ''
    }
    await db.collection('visitors_summary').updateOne({ visitor_id: vid }, { $unset: unset })
    return true
  } catch {
    return false
  }
}
