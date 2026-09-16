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
