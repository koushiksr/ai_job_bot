/**
 * JobFlux AI Service Worker for Real Background Web Push Notifications
 * 
 * Complies with W3C Web Push, Google FCM, and Apple APNs specifications.
 * Delivers native OS desktop and mobile push notifications even when the web application
 * is completely closed.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for incoming Web Push events from Google/Apple/Mozilla push services
self.addEventListener('push', (event) => {
  let data = {}
  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    data = {
      title: 'JobFlux AI',
      body: event.data ? event.data.text() : 'You have a new update in your JobFlux AI Cockpit.'
    }
  }

  const now = Date.now()

  // 1. Strict Expiry Enforcement: If notification has expired, drop it silently
  if (data.expires_at && typeof data.expires_at === 'number' && now > data.expires_at) {
    console.log('[SW] Push notification expired at', new Date(data.expires_at).toISOString(), 'Dropping.')
    return
  }

  // 2. Fallback Stale Guard: Drop notifications created more than 6 hours ago
  if (data.created_at && typeof data.created_at === 'number' && (now - data.created_at) > 6 * 60 * 60 * 1000) {
    console.log('[SW] Push notification created >6h ago. Dropping stale notification.')
    return
  }

  // 3. User Availability Check: If candidate is currently active & looking at JobFlux AI,
  // notify the active tab directly and suppress intrusive OS desktop notification center alerts
  const showPromise = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
    const isUserActive = clientList.some(client => client.focused || client.visibilityState === 'visible')
    if (isUserActive) {
      clientList.forEach(client => {
        client.postMessage({
          type: 'JOBFLUX_ACTIVE_NOTIFICATION',
          data: data
        })
      })
      // Suppress OS notification banner since user is already available in the app
      return
    }

    const origin = self.location.origin
    const title = data.title || 'JobFlux AI'

    // Apple APNs & Google FCM require absolute URLs for icons
    const iconUrl = data.icon 
      ? (data.icon.startsWith('http') ? data.icon : new URL(data.icon, origin).href)
      : new URL('/images/icon.png', origin).href

    const badgeUrl = data.badge
      ? (data.badge.startsWith('http') ? data.badge : new URL(data.badge, origin).href)
      : new URL('/images/icon.png', origin).href

    const imageUrl = data.image && data.image.startsWith('http') ? data.image : undefined

    const options = {
      body: data.body || data.message || 'You have a new priority alert from JobFlux AI.',
      icon: iconUrl,
      badge: badgeUrl,
      ...(imageUrl ? { image: imageUrl } : {}),
      vibrate: [200, 100, 200, 100, 200],
      tag: data.tag || `jobflux_${Date.now()}`,
      renotify: true,
      data: {
        url: data.url || data.claim_url || '/dashboard',
        timestamp: now,
        expires_at: data.expires_at || null
      }
    }

    return self.registration.showNotification(title, options)
  })

  event.waitUntil(showPromise)
})

// Handle user clicking on the notification banner
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const rawUrl = event.notification.data?.url || '/dashboard'
  const targetUrl = new URL(rawUrl, self.location.origin).href

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open on this origin, focus and navigate it
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // If no window is open, open a new window to the target URL
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
