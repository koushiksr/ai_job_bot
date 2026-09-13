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

  if (!userId) {
    return { authorized: false, userId: '' }
  }

  // 1. Master admin or designated admin account
  if (userId === 'admin') {
    return { authorized: true, userId: 'admin', email: 'admin@jobfluxai.com' }
  }

  if (isAdminUser(userId)) {
    return { authorized: true, userId: APP_CONFIG.masterAdminId, email: APP_CONFIG.supportEmail }
  }

  // 2. Check in database users and profiles collections
  const user = await db.collection('users').findOne({ user_id: userId }) ||
               await db.collection('profiles').findOne({ user_id: userId })

  if (user) {
    if (user.role === 'admin' || isAdminUser(user.email)) {
      return { authorized: true, userId, email: user.email }
    }
  }

  return { authorized: false, userId }
}
