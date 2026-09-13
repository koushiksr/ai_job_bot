/**
 * JobFlux AI Service Worker for Background Web Push Notifications
 * 
 * Runs independently of open browser tabs to deliver native OS desktop and mobile
 * push notifications even when the web application is completely closed.
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
      title: '⚡ JobFlux AI Radar Alert',
      body: event.data ? event.data.text() : 'You have a new update in your JobFlux AI Cockpit.'
    }
  }

  const title = data.title || '⚡ JobFlux AI Radar Alert'
  const options = {
    body: data.body || data.message || 'You have a new priority alert from JobFlux AI.',
    icon: data.icon || '/images/icon.png',
    badge: data.badge || '/images/icon.png',
    tag: data.tag || `jobflux_${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Keep notification visible until user interacts with it
    data: {
      url: data.url || data.claim_url || '/dashboard',
      timestamp: Date.now()
    }
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle user clicking on the notification
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
