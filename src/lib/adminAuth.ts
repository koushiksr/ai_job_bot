import { NextRequest } from 'next/server'
import { Db } from 'mongodb'

import { APP_CONFIG, isAdminUser } from '@/config/appConfig'
import { readSession } from '@/lib/session'

/**
 * Server-side authorization — session cookie ONLY.
 *
 * Historical note: these functions previously trusted `x-user-id` headers /
 * query params, meaning any client could claim to be admin. That trust is
 * removed. The signed session cookie (see lib/session.ts) is the identity;
 * when a DB handle is available the claimed role is re-validated live so
 * revocations (removed admin, removed org member) take effect immediately.
 */

export async function verifyAdminRequest(
  req: NextRequest,
  db: Db | null
): Promise<{ authorized: boolean; userId: string; email?: string }> {
  const sess = readSession(req)
  if (!sess || sess.role !== 'admin') {
    return { authorized: false, userId: '' }
  }

  const isBreakGlass = isAdminUser(sess.email) || isAdminUser(sess.uid)

  if (!db) {
    // DB unreachable: only the break-glass super-admin passes
    return isBreakGlass
      ? { authorized: true, userId: sess.uid, email: sess.email }
      : { authorized: false, userId: '' }
  }

  // Live re-validation: admin role must still exist in DB
  try {
    const rec = await db.collection('profiles').findOne({
      $or: [{ user_id: sess.uid }, { email: { $regex: `^${sess.email}$`, $options: 'i' } }]
    }) || await db.collection('users').findOne({
      $or: [{ user_id: sess.uid }, { email: { $regex: `^${sess.email}$`, $options: 'i' } }]
    })
    if (!rec) {
      // No DB record: only break-glass super-admin passes
      return isBreakGlass
        ? { authorized: true, userId: sess.uid, email: sess.email }
        : { authorized: false, userId: '' }
    }
    if (!(rec.role === 'admin' || isAdminUser(rec.email) || rec.user_id === 'technohmsit')) {
      return { authorized: false, userId: '' }
    }
    // Session version must match (bumped on logout → old tokens die)
    if (Number(rec.session_v || 0) !== sess.v) {
      return { authorized: false, userId: '' }
    }
    return { authorized: true, userId: sess.uid, email: sess.email }
  } catch {
    // DB error → deny (fail closed)
  }
  return { authorized: false, userId: '' }
}

export async function verifyEnterpriseAdminRequest(
  req: NextRequest,
  db: Db | null
): Promise<{
  authorized: boolean
  isSuperAdmin: boolean
  isEnterpriseAdmin: boolean
  orgId: string | null
  userId: string
  email: string
}> {
  const denied = {
    authorized: false,
    isSuperAdmin: false,
    isEnterpriseAdmin: false,
    orgId: null as string | null,
    userId: '',
    email: ''
  }

  const sess = readSession(req)
  if (!sess || (sess.role !== 'admin' && sess.role !== 'enterprise_admin')) {
    return denied
  }

  // Super-admin: full access, break-glass without DB
  if (sess.role === 'admin' && (isAdminUser(sess.email) || isAdminUser(sess.uid))) {
    const reqOrgId = req.headers.get('x-org-id') || req.nextUrl.searchParams.get('org_id') || sess.orgId || 'org_technohmsit'
    return {
      authorized: true,
      isSuperAdmin: true,
      isEnterpriseAdmin: true,
      orgId: reqOrgId,
      userId: sess.uid,
      email: sess.email
    }
  }

  if (!db) {
    return denied
  }

  // Live re-validation for enterprise admins: org link must still exist
  try {
    const userEmail = sess.email
    const userId = sess.uid

    const liveProfile = await db.collection('profiles').findOne({
      $or: [
        { email: { $regex: `^${userEmail}$`, $options: 'i' } },
        { user_id: userId }
      ]
    })
    // Session version must match (bumped on logout → old tokens die)
    if (liveProfile && Number(liveProfile.session_v || 0) !== sess.v) {
      return denied
    }

    const org = await db.collection('enterprise_orgs').findOne({
      $or: [
        { admin_email: { $regex: `^${userEmail}$`, $options: 'i' } },
        { admin_user_id: userId }
      ]
    })

    let profileOrgId: string | null = null
    if (!org) {
      if (liveProfile && liveProfile.enterprise_role === 'admin' && liveProfile.enterprise_org_id) {
        profileOrgId = liveProfile.enterprise_org_id
      }
    }

    const isDesignated = APP_CONFIG.enterpriseAdminEmails.map(e => e.toLowerCase()).includes(userEmail.toLowerCase())

    if (org || profileOrgId || isDesignated) {
      return {
        authorized: true,
        isSuperAdmin: false,
        isEnterpriseAdmin: true,
        orgId: org?.org_id || profileOrgId || sess.orgId || 'org_technohmsit',
        userId,
        email: userEmail
      }
    }
  } catch {
    // DB error → deny (fail closed)
  }
  return denied
}
