/**
 * Unified Browser Push Notification Service
 * 
 * Provides client-side helpers for browser push notifications, permission requests,
 * and standard event handling across Dashboard and Admin interfaces.
 */

import { APP_CONFIG } from '@/config/appConfig'

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

export interface AppNotificationOptions extends NotificationOptions {
  onclick?: (event: Event) => void
}

/**
 * Dispatch an interactive system browser notification.
 * Automatically applies brand icons, focus behavior, and error handling.
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
