const SETTINGS_KEY = 'timenotes_settings'

export interface NotificationSettings {
  browserNotifications: boolean
}

const DEFAULT_SETTINGS: NotificationSettings = {
  browserNotifications: 'Notification' in window && Notification.permission !== 'denied',
}

function readSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      browserNotifications: parsed.browserNotifications ?? DEFAULT_SETTINGS.browserNotifications,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

function writeSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* silently ignore */
  }
}

export function getNotificationSettings(): NotificationSettings {
  return readSettings()
}

export function setBrowserNotifications(enabled: boolean): void {
  const current = readSettings()
  writeSettings({ ...current, browserNotifications: enabled })
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('denied')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  return Notification.requestPermission()
}
