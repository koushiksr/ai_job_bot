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

  // 1. Direct check on identifier or email
  if (userId === 'admin' || userEmail === 'admin@jobfluxai.com') {
    return { authorized: true, userId: 'admin', email: 'admin@jobfluxai.com' }
  }

  if (isAdminUser(userId) || isAdminUser(userEmail)) {
    return {
      authorized: true,
      userId: userId || APP_CONFIG.masterAdminId,
      email: userEmail || APP_CONFIG.supportEmail
    }
  }

  if (!userId && !userEmail) {
    return { authorized: false, userId: '' }
  }

  // 2. Check in database users and profiles collections by user_id OR email
  const matchCriteria: any[] = []
  if (userId) {
    matchCriteria.push({ user_id: userId })
    matchCriteria.push({ email: userId })
  }
  if (userEmail) {
    matchCriteria.push({ email: userEmail })
  }

  const query = matchCriteria.length === 1 ? matchCriteria[0] : { $or: matchCriteria }
  const user = await db.collection('users').findOne(query) ||
               await db.collection('profiles').findOne(query)

  if (user) {
    if (user.role === 'admin' || isAdminUser(user.email) || isAdminUser(user.user_id)) {
      return { authorized: true, userId: user.user_id || userId, email: user.email || userEmail }
    }
  }

  return { authorized: false, userId }
}
