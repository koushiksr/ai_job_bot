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
      timestamp: Date.now()
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
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
