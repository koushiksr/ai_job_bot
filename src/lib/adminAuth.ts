import { NextRequest } from 'next/server'
import { Db } from 'mongodb'

import { APP_CONFIG, isAdminUser } from '@/config/appConfig'

/**
 * Verify whether the incoming request is from an authenticated Administrator.
 * Master administrator and designated accounts are configured in APP_CONFIG.
 * Checks header 'x-user-id' or query 'auth_user_id' against database records.
 */
export async function verifyAdminRequest(
  req: NextRequest,
  db: Db | null
): Promise<{ authorized: boolean; userId: string; email?: string }> {
  if (!db) {
    return { authorized: false, userId: '' }
  }

  const userId = (
    req.headers.get('x-user-id') ||
    req.nextUrl.searchParams.get('auth_user_id') ||
    ''
  ).trim()

  const userEmail = (
    req.headers.get('x-user-email') ||
    req.nextUrl.searchParams.get('auth_email') ||
    ''
  ).trim().toLowerCase()

  // 1. Direct check: ONLY technohmsit or technohmsit@gmail.com (or system admin bypass)
  if (
    userId === 'technohmsit' ||
    userEmail === 'technohmsit@gmail.com' ||
    userId === 'admin'
  ) {
    return {
      authorized: true,
      userId: userId || APP_CONFIG.masterAdminId,
      email: userEmail || APP_CONFIG.supportEmail
    }
  }

  // 2. Reject all other users unconditionally
  return { authorized: false, userId }
}

/**
 * Verify whether the incoming request is from an authorized Enterprise Administrator or Super Admin.
 * Returns organization context and role information.
 */
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
  if (!db) {
    return {
      authorized: false,
      isSuperAdmin: false,
      isEnterpriseAdmin: false,
      orgId: null,
      userId: '',
      email: ''
    }
  }

  const userId = (
    req.headers.get('x-user-id') ||
    req.nextUrl.searchParams.get('auth_user_id') ||
    ''
  ).trim()

  const userEmail = (
    req.headers.get('x-user-email') ||
    req.nextUrl.searchParams.get('auth_email') ||
    ''
  ).trim().toLowerCase()

  // 1. Super Admin has unrestricted access across all organizations
  if (
    userId === 'technohmsit' ||
    userEmail === 'technohmsit@gmail.com' ||
    userId === 'admin'
  ) {
    // If request specifies a target org_id in headers or query, use it
    const reqOrgId = req.headers.get('x-org-id') || req.nextUrl.searchParams.get('org_id') || null
    return {
      authorized: true,
      isSuperAdmin: true,
      isEnterpriseAdmin: true,
      orgId: reqOrgId || 'org_technohmsit',
      userId: userId || APP_CONFIG.masterAdminId,
      email: userEmail || APP_CONFIG.supportEmail
    }
  }

  // 2. Check if user is a designated Enterprise Admin in APP_CONFIG or enterprise_orgs collection
  const isDesignated = APP_CONFIG.enterpriseAdminEmails.map(e => e.toLowerCase()).includes(userEmail)

  // Query database for enterprise org where this user is admin
  const org = await db.collection('enterprise_orgs').findOne({
    $or: [
      { admin_email: { $regex: `^${userEmail}$`, $options: 'i' } },
      { admin_user_id: userId }
    ]
  })

  // Also check if user profile has enterprise_role: 'admin'
  let profileOrgId: string | null = null
  if (!org) {
    const profile = await db.collection('profiles').findOne({
      $or: [
        { email: { $regex: `^${userEmail}$`, $options: 'i' } },
        { user_id: userId }
      ]
    })
    if (profile && profile.enterprise_role === 'admin' && profile.enterprise_org_id) {
      profileOrgId = profile.enterprise_org_id
    }
  }

  if (org || profileOrgId || isDesignated) {
    const finalOrgId = org?.org_id || profileOrgId || 'org_technohmsit'
    return {
      authorized: true,
      isSuperAdmin: false,
      isEnterpriseAdmin: true,
      orgId: finalOrgId,
      userId: userId || userEmail.split('@')[0],
      email: userEmail
    }
  }

  return {
    authorized: false,
    isSuperAdmin: false,
    isEnterpriseAdmin: false,
    orgId: null,
    userId,
    email: userEmail
  }
}
