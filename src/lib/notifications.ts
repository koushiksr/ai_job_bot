/**
 * Unified Browser & Background Web Push Notification Service
 * 
 * Provides client-side helpers for browser push notifications, Service Worker registration,
 * VAPID push subscriptions, and closed-tab desktop notification delivery.
 */

import { APP_CONFIG } from '@/config/appConfig'

export interface AppNotificationOptions extends NotificationOptions {
  onclick?: (event: Event) => void
}

/**
 * Converts a base64 string to a Uint8Array for PushManager applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check the current browser notification permission safely.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (err) {
    console.warn('Notification permission request error:', err)
    return Notification.permission
  }
}

/**
 * Register the background Web Push Service Worker (/sw.js).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
    await navigator.serviceWorker.ready
    return registration
  } catch (err) {
    console.warn('Service worker registration failed:', err)
    return null
  }
}

/**
 * Retrieves the current push subscription if one exists.
 */
export async function getDevicePushSubscription(): Promise<PushSubscription | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }
  try {
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  } catch (err) {
    return null
  }
}

/**
 * Subscribes this browser device to background Web Push notifications (YouTube-style).
 * Automatically fetches the server VAPID key and registers the subscription in MongoDB.
 */
export async function subscribeDeviceToPush(
  userEmail: string,
  userId?: string
): Promise<{ success: boolean; subscription?: PushSubscription; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Window not available' }
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Background Web Push is not supported by your current browser.' }
  }

  // 1. Request permission if not already granted
  let permission = Notification.permission
  if (permission !== 'granted') {
    permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission was denied.' }
    }
  }

  try {
    // 2. Register and wait for Service Worker
    const registration = await registerServiceWorker()
    if (!registration) {
      return { success: false, error: 'Service worker registration failed.' }
    }

    // 3. Fetch public VAPID key from backend
    const keyRes = await fetch('/api/notifications/vapid-key')
    if (!keyRes.ok) {
      throw new Error(`Failed to retrieve VAPID key (HTTP ${keyRes.status})`)
    }
    const { publicKey } = await keyRes.json()
    if (!publicKey) {
      throw new Error('VAPID public key not found on server.')
    }

    // 4. Subscribe via PushManager
    const applicationServerKey = urlBase64ToUint8Array(publicKey)
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Passing ArrayBuffer or TypedArray view
        applicationServerKey: applicationServerKey.buffer as ArrayBuffer
      })
    }

    // 5. Send subscription to MongoDB backend
    const subJson = subscription.toJSON()
    const saveRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subJson,
        email: userEmail,
        userId: userId || null
      })
    })

    if (!saveRes.ok) {
      throw new Error('Failed to save push subscription on server.')
    }

    return { success: true, subscription }
  } catch (err: any) {
    console.error('Failed to subscribe device to Web Push:', err)
    return { success: false, error: err.message || 'Push subscription failed.' }
  }
}

/**
 * Dispatch an interactive in-browser notification.
 * Works when page is active; Service Worker handles notifications when page is closed.
 */
export function sendBrowserNotification(
  title: string,
  options?: AppNotificationOptions
): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null
  }

  if (Notification.permission !== 'granted') {
    return null
  }

  try {
    const notification = new Notification(title, {
      icon: APP_CONFIG.assets.iconPng,
      badge: APP_CONFIG.assets.iconPng,
      ...options
    })

    notification.onclick = (event) => {
      try {
        window.focus()
      } catch (_) {}
      if (options?.onclick) {
        options.onclick(event)
      }
      notification.close()
    }

    return notification
  } catch (error) {
    console.warn('Could not dispatch browser notification:', error)
    return null
  }
}
