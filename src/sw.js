import { precacheAndRoute } from 'workbox-precaching'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

// Precache assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Firebase Cloud Messaging background handler dynamically configured via Vite env
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const firebaseApp = initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

onBackgroundMessage(messaging, (payload) => {
  const { title, body } = payload.notification || {}
  const taskId = payload.data?.taskId

  self.registration.showNotification(title || 'Task Reminder', {
    body: body || '',
    icon: '/favicon.ico',
    tag: taskId ? `task-${taskId}` : undefined,
    requireInteraction: true,
    data: { taskId, url: '/tasks' },
  })
})

// Handle notification clicks — focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = event.notification.data?.url || '/tasks'
  const taskId = event.notification.data?.taskId

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          if (taskId) {
            client.postMessage({ type: 'notification-click', taskId })
          }
          return
        }
      }
      if (self.clients.openWindow) {
        self.clients.openWindow(targetUrl)
      }
    })
  )
})

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
