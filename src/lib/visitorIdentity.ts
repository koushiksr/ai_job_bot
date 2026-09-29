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
  tag_name?: string | null
}

export async function getIdentityMap(db: Db, visitorIds: string[]): Promise<Map<string, VisitorIdentity>> {
  const map = new Map<string, VisitorIdentity>()
  const ids = [...new Set((visitorIds || []).filter(Boolean))].slice(0, 300)
  if (ids.length === 0) return map
  try {
    const docs = await db.collection('visitors_summary')
      .find(
        { visitor_id: { $in: ids } },
        { projection: { visitor_id: 1, identified_email: 1, identified_user_id: 1, manual_tag: 1, tag_name: 1, alias: 1 } }
      )
      .toArray()
    for (const d of docs) {
      if (d.identified_email || d.tag_name || d.alias) {
        map.set(d.visitor_id, {
          email: d.identified_email || null,
          user_id: d.identified_user_id || null,
          manual: d.manual_tag === true,
          tag_name: d.tag_name || d.alias || null
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

/** Super-admin manual tag: this browser IS this person/name. Wins over auto-learning. */
export async function tagVisitorManually(
  db: Db,
  opts: { visitor_id: string; email?: string | null; tag_name?: string | null; user_id?: string | null; taggedBy: string }
): Promise<boolean> {
  const vid = (opts.visitor_id || '').trim()
  const email = (opts.email || '').trim().toLowerCase()
  const tagName = (opts.tag_name || '').trim()
  if (!vid) return false
  if (!email && !tagName) return false
  try {
    try {
      await db.collection('visitors_summary').createIndex({ visitor_id: 1 }, { unique: true })
    } catch {}

    const setOps: Record<string, any> = {
      visitor_id: vid,
      manual_tag: true,
      tagged_by: opts.taggedBy,
      tagged_at: new Date(),
      last_seen_at: new Date()
    }
    if (email) {
      setOps.identified_email = email
      setOps.manual_email = email
    }
    if (tagName) {
      setOps.tag_name = tagName
    }
    if (opts.user_id) {
      setOps.identified_user_id = opts.user_id
    }

    const unsetOps: Record<string, ''> = {}
    if (opts.tag_name === '') {
      unsetOps.tag_name = ''
    }

    const updateDoc: Record<string, any> = { $set: setOps }
    if (Object.keys(unsetOps).length > 0) {
      updateDoc.$unset = unsetOps
    }

    await db.collection('visitors_summary').updateOne(
      { visitor_id: vid },
      updateDoc,
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
    const unset: Record<string, ''> = { manual_tag: '', tagged_by: '', tagged_at: '', tag_name: '' }
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
