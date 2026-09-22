/**
 * VAPID (Voluntary Application Server Identification) Configuration
 * 
 * Standards-compliant W3C Web Push encryption credentials.
 * Used by the server to sign Web Push payloads dispatched to Google (FCM), Apple (APNs),
 * and Mozilla push gateways.
 */

import { APP_CONFIG } from '@/config/appConfig'

// Default fallback VAPID keypair.
// NOTE: the public key is public by design; the PRIVATE key must NEVER be
// hardcoded here — it must come from VAPID_PRIVATE_KEY env or the
// system_config.vapid_config DB record. Push sending fails loudly without it.
const DEFAULT_VAPID_PUBLIC = 'BNiGxBzDPi4_iFuHn6k1yEpI8GRnblcMfF5mIqH1LK1_D9Keyb_ljg0CienSVGAhtMgJdSdyp7GOi5FCYDLf8xw'

export const VAPID_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC,
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || `mailto:${APP_CONFIG.supportEmail}`
}

/**
 * Returns dynamic VAPID credentials, checking MongoDB system_config if available.
 */
export async function getDynamicVapidCredentials(db?: any) {
  let publicKey = VAPID_CONFIG.publicKey
  let privateKey = VAPID_CONFIG.privateKey
  let subject = VAPID_CONFIG.subject

  if (db) {
    try {
      const config = await db.collection('system_config').findOne({ key: 'vapid_config' })
      if (config) {
        if (config.publicKey) publicKey = config.publicKey.trim()
        if (config.privateKey) privateKey = config.privateKey.trim()
        if (config.subject) subject = config.subject.trim()
      }
    } catch (_) {}
  }

  return { publicKey, privateKey, subject }
}
