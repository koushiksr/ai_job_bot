'use client'

import { useEffect } from 'react'
import { registerServiceWorker, subscribeDeviceToPush } from '@/lib/notifications'
import { APP_CONFIG } from '@/config/appConfig'

/**
 * Global Service Worker Registrar
 * 
 * Automatically registers /sw.js on all pages (Home, Dashboard, Admin, Pricing, Tools)
 * across both mobile and desktop browsers to ensure true OS-level background Web Push.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Immediately register the Service Worker
    registerServiceWorker()
      .then((registration) => {
        if (!registration) return

        // 2. If user already granted notification permission, ensure device subscription is active
        if ('Notification' in window && Notification.permission === 'granted') {
          const storedEmail = localStorage.getItem('user_email') || APP_CONFIG.supportEmail
          const storedUid = localStorage.getItem('user_id') || undefined
          subscribeDeviceToPush(storedEmail, storedUid).catch(() => {})
        }
      })
      .catch((err) => {
        console.warn('Background service worker init failed:', err)
      })
  }, [])

  return null
}
