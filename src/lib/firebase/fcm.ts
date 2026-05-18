import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging, isFirebaseConfigured } from './firebase-init'

const FCM_TOKEN_KEY = 'timenotes_fcm_token'

export function getStoredFcmToken(): string | null {
  try {
    return localStorage.getItem(FCM_TOKEN_KEY)
  } catch {
    return null
  }
}

function storeFcmToken(token: string): void {
  try {
    localStorage.setItem(FCM_TOKEN_KEY, token)
  } catch {
    /* silently ignore */
  }
}

export async function requestFcmToken(): Promise<string | null> {
  if (!isFirebaseConfigured()) return null

  const messaging = getFirebaseMessaging()
  if (!messaging) return null

  try {
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    })
    if (token) {
      storeFcmToken(token)
    }
    return token
  } catch {
    return null
  }
}

let foregroundUnsubscribe: (() => void) | null = null

export function onForegroundMessage(
  callback: (payload: { title?: string; body?: string; taskId?: string }) => void
): void {
  if (!isFirebaseConfigured()) return

  const messaging = getFirebaseMessaging()
  if (!messaging) return

  if (foregroundUnsubscribe) {
    foregroundUnsubscribe()
  }

  foregroundUnsubscribe = onMessage(messaging, (payload) => {
    callback({
      title: payload.notification?.title,
      body: payload.notification?.body,
      taskId: payload.data?.taskId,
    })
  })
}

export function unsubscribeForegroundMessages(): void {
  if (foregroundUnsubscribe) {
    foregroundUnsubscribe()
    foregroundUnsubscribe = null
  }
}
