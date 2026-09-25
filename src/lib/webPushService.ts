/**
 * Server-Side Web Push Dispatcher
 * 
 * Uses the RFC 8291 / RFC 8292 standard to push real-time notifications directly
 * to candidate and admin operating systems (macOS, Windows, Android, iOS) via
 * Google FCM, Apple APNs, and Mozilla push services.
 */

import webpush from 'web-push'
import { getDb } from '@/lib/mongodb'
import { getDynamicVapidCredentials } from '@/config/vapid'

export interface WebPushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  ttlSeconds?: number
  expiresAt?: number
  data?: Record<string, any>
}

export interface PushSubscriptionRecord {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

/**
 * Configure web-push with active VAPID credentials.
 */
async function configureVapid(db?: any) {
  const { publicKey, privateKey, subject } = await getDynamicVapidCredentials(db)
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return { publicKey, privateKey, subject }
}

/**
 * Send a Web Push notification to a single device subscription.
 * Automatically cleans up expired/uninstalled subscriptions (HTTP 410 / 404).
 */
export async function sendPushToSubscription(
  subscription: PushSubscriptionRecord,
  payload: WebPushPayload,
  db?: any
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  try {
    await configureVapid(db)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jobfluxai.vercel.app'
    const fullUrl = payload.url?.startsWith('http') ? payload.url : `${baseUrl}${payload.url || '/dashboard'}`
    const fullIcon = payload.icon?.startsWith('http') ? payload.icon : `${baseUrl}/images/icon.png`
    const now = Date.now()
    // Strict cloud retention cap: default 4 hours (14,400s). Never linger for days in APNs/FCM!
    const defaultTtlSeconds = 4 * 60 * 60
    const ttl = Math.max(60, Math.min(payload.ttlSeconds || defaultTtlSeconds, 24 * 60 * 60))
    const expiresAt = payload.expiresAt || (now + ttl * 1000)

    const jsonPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: fullUrl,
      icon: fullIcon,
      badge: fullBadge,
      ...(payload.image?.startsWith('http') ? { image: payload.image } : {}),
      tag: payload.tag || `jobflux_${Date.now()}`,
      created_at: now,
      expires_at: expiresAt
    })

    // Sanitize topic for RFC 8030 standard (alphanumeric, -, _ max 32 chars)
    const topicHeader = payload.tag
      ? payload.tag.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 32)
      : undefined

    const res = await webpush.sendNotification(
      subscription as any,
      jsonPayload,
      {
        TTL: ttl,        // Expire in APNs/FCM after TTL so offline devices don't get flooded later
        urgency: 'high', // Wake up sleeping mobile/desktop devices immediately
        topic: topicHeader || undefined
      }
    )

    return { success: true, statusCode: res.statusCode }
  } catch (err: any) {
    const statusCode = err.statusCode

    // If subscription is expired or unregistered, prune it from MongoDB
    if (statusCode === 410 || statusCode === 404) {
      if (db && subscription.endpoint) {
        try {
          await db.collection('push_subscriptions').deleteOne({ endpoint: subscription.endpoint })
        } catch (_) {}
      }
    }

    return {
      success: false,
      statusCode,
      error: err.message || 'Push delivery failed'
    }
  }
}

/**
 * Send a background Web Push notification to all devices registered to a specific candidate email.
 */
export async function sendPushToUser(
  email: string,
  payload: WebPushPayload
): Promise<{ delivered: number; failed: number; total: number }> {
  if (!email) return { delivered: 0, failed: 0, total: 0 }

  let db: any = null
  try {
    db = await getDb()
  } catch (_) {}

  if (!db) return { delivered: 0, failed: 0, total: 0 }

  const clean = email.toLowerCase().trim()
  const subscriptions = await db.collection('push_subscriptions')
    .find({
      $or: [
        { email: clean },
        { user_id: clean },
        { email: { $regex: new RegExp(`^${clean}$`, 'i') } }
      ]
    })
    .toArray()

  let delivered = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (subDoc: any) => {
      const subRecord: PushSubscriptionRecord = {
        endpoint: subDoc.endpoint,
        keys: subDoc.keys
      }
      const res = await sendPushToSubscription(subRecord, payload, db)
      if (res.success) {
        delivered++
      } else {
        failed++
      }
    })
  )

  return { delivered, failed, total: subscriptions.length }
}

/**
 * Broadcast a background Web Push notification to all active device subscriptions.
 */
export async function broadcastPush(
  payload: WebPushPayload
): Promise<{ delivered: number; failed: number; total: number }> {
  let db: any = null
  try {
    db = await getDb()
  } catch (_) {}

  if (!db) return { delivered: 0, failed: 0, total: 0 }

  const subscriptions = await db.collection('push_subscriptions')
    .find({})
    .toArray()

  let delivered = 0
  let failed = 0

  await Promise.all(
    subscriptions.map(async (subDoc: any) => {
      const subRecord: PushSubscriptionRecord = {
        endpoint: subDoc.endpoint,
        keys: subDoc.keys
      }
      const res = await sendPushToSubscription(subRecord, payload, db)
      if (res.success) {
        delivered++
      } else {
        failed++
      }
    })
  )

  return { delivered, failed, total: subscriptions.length }
}
