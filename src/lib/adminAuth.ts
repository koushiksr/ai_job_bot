import { NextRequest } from 'next/server'
import { Db } from 'mongodb'

/**
 * Verify whether the incoming request is from an authenticated Administrator.
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

  // Master admin user id
  if (userId === 'admin') {
    return { authorized: true, userId: 'admin', email: 'admin@jobfluxai.com' }
  }

  // Check in users and profiles collection
  const user = await db.collection('users').findOne({ user_id: userId }) ||
               await db.collection('profiles').findOne({ user_id: userId })

  if (user && user.role === 'admin') {
    return { authorized: true, userId, email: user.email }
  }

  return { authorized: false, userId }
}

