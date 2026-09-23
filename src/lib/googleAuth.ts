import { NextRequest } from 'next/server'
import { APP_CONFIG } from '@/config/appConfig'
import { exactMatchCI } from '@/lib/query'

/**
 * Single home for Google OAuth configuration + shared Google-login logic.
 *
 * Four routes participate in Google auth (all URLs keep working):
 *   GET  /api/auth/google/signin    → redirect to Google (uses getGoogleOAuthConfig)
 *   GET  /api/auth/callback/google  → OAuth code exchange (uses getGoogleOAuthConfig + resolveGoogleRole)
 *   GET  /api/auth/google/callback  → thin re-export of the above
 *   POST /api/auth/google           → GIS one-tap verify (uses findProfileByEmail +
 *                                      ensureTechnohmProfile + resolveGoogleRole)
 *
 * The two profile-CREATION flows intentionally stay in their routes: the GIS
 * flow links pre-existing purchases, the redirect flow seeds user_stats.
 */

export interface GoogleOAuthConfig {
  clientId: string
  clientSecret: string
  appUrl: string
  redirectUri: string
}

export function getGoogleOAuthConfig(req: NextRequest): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  if (!clientId || !clientSecret) {
    throw new Error('Server configuration error: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing.')
  }
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'
  const host = req.headers.get('host') || 'jobfluxai.vercel.app'
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || `${forwardedProto}://${host}`).replace(/\/+$/, '')
  return { clientId, clientSecret, appUrl, redirectUri: `${appUrl}/api/auth/callback/google` }
}

export async function findProfileByEmail(db: any, emailClean: string): Promise<any | null> {
  return (await db.collection('users').findOne({ email: exactMatchCI(emailClean) }))
    || (await db.collection('profiles').findOne({ email: exactMatchCI(emailClean) }))
}

/** Normalize the super-admin record. Returns the (possibly new) profile. */
export async function ensureTechnohmProfile(db: any, profile: any | null, name: string, now: Date): Promise<any> {
  if (!profile) {
    profile = {
      user_id: 'technohmsit',
      name: name || 'Technohm SIT Administrator',
      email: 'technohmsit@gmail.com',
      role: 'admin',
      plan: 'trial',
      plan_name: 'JobFlux 3-Day Free Access',
      created_at: now,
      updated_at: now
    }
  } else {
    profile.user_id = 'technohmsit'
    profile.role = 'admin'
  }
  await db.collection('profiles').updateOne(
    { email: exactMatchCI('technohmsit@gmail.com') },
    { $set: { role: 'admin', user_id: 'technohmsit' } },
    { upsert: true }
  )
  await db.collection('users').updateOne(
    { email: exactMatchCI('technohmsit@gmail.com') },
    { $set: { role: 'admin', user_id: 'technohmsit' } },
    { upsert: true }
  )
  return profile
}

export interface GoogleRoleResolution {
  role: 'admin' | 'enterprise_admin' | 'user'
  isSuperAdmin: boolean
  isEntAdmin: boolean
  orgAsAdmin: any | null
  redirectPath: '/admin' | '/enterprise-admin' | '/dashboard'
}

export async function resolveGoogleRole(db: any, profile: any, emailClean: string): Promise<GoogleRoleResolution> {
  const isSuperAdmin = (
    (emailClean === 'technohmsit@gmail.com' || profile.user_id === 'technohmsit') &&
    profile.role === 'admin'
  )
  const orgAsAdmin = await db.collection('enterprise_orgs').findOne({
    $or: [
      { admin_email: exactMatchCI(emailClean) },
      { admin_user_id: profile.user_id }
    ]
  })
  const isEntAdmin =
    APP_CONFIG.enterpriseAdminEmails.map(e => e.toLowerCase()).includes(emailClean) ||
    Boolean(orgAsAdmin) ||
    profile.enterprise_role === 'admin'

  if (isSuperAdmin) {
    return { role: 'admin', isSuperAdmin, isEntAdmin, orgAsAdmin, redirectPath: '/admin' }
  }
  if (isEntAdmin) {
    return { role: 'enterprise_admin', isSuperAdmin, isEntAdmin, orgAsAdmin, redirectPath: '/enterprise-admin' }
  }
  return { role: 'user', isSuperAdmin, isEntAdmin, orgAsAdmin, redirectPath: '/dashboard' }
}
