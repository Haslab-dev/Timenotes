import { useEffect, useRef } from 'react'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import { taskRepository } from '../api/task-repository'
import { getNotificationSettings, setBrowserNotifications } from '@/lib/utils/notification-settings'
import { addTaskToast } from '@/lib/utils/toast-state'
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase/fcm'
import { isFirebaseConfigured } from '@/lib/firebase/firebase-init'
import { format } from 'date-fns'

const NOTIFICATION_CHECK_INTERVAL = 15000

export function NotificationManager() {
  const { user } = useAuthContext()
  const notifiedRef = useRef<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) return

    let active = true

    const init = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const result = await Notification.requestPermission()
        if (result === 'granted') {
          setBrowserNotifications(true)
        }
      }

      if (isFirebaseConfigured() && 'serviceWorker' in navigator) {
        requestFcmToken()
      }

      if (isFirebaseConfigured()) {
        onForegroundMessage((payload) => {
          addTaskToast({
            title: payload.title || 'Task Reminder',
            description: payload.body,
            dueInfo: undefined,
            type: 'due',
          })
        })
      }

      if (!active) return

      checkNotifications()

      intervalRef.current = setInterval(checkNotifications, NOTIFICATION_CHECK_INTERVAL)
    }

    const checkNotifications = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return

      const settings = getNotificationSettings()
      if (!settings.browserNotifications) return

      try {
        const dueTasks = await taskRepository.getUnnotifiedDueTasks(user.id)
        const reminderTasks = await taskRepository.getTasksNeedingReminders(user.id)

        const allNotifiable = [
          ...dueTasks.map((t) => ({ task: t, type: 'due' as const })),
          ...reminderTasks.map((t) => ({ task: t, type: 'reminder' as const })),
        ].filter(({ task }) => !notifiedRef.current.has(task.id))

        for (const { task, type: toastType } of allNotifiable) {
          const dueStr = task.dueDate
            ? `${format(task.dueDate, 'MMM d')}${task.dueTime ? ` at ${task.dueTime}` : ''}`
            : ''

          addTaskToast({
            title: task.title,
            description: task.description,
            dueInfo: dueStr || undefined,
            type: toastType,
          })

          showNotification(task)

          notifiedRef.current.add(task.id)
          try {
            await taskRepository.markNotified(task.id, user.id)
          } catch {
            /* silently ignore mark error */
          }
        }
      } catch {
        /* silently ignore query error */
      }
    }

    init()

    return () => {
      active = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [user])

  return null
}

function showNotification(task: {
  id: string
  title: string
  description?: string
  dueDate?: Date
  dueTime?: string
}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const settings = getNotificationSettings()
  if (!settings.browserNotifications) return

  const dueStr = task.dueDate
    ? `${format(task.dueDate, 'MMM d')}${task.dueTime ? ` at ${task.dueTime}` : ''}`
    : ''

  const body = task.description ? `${task.title}${dueStr ? ` — ${dueStr}` : ''}` : task.title

  const show = (reg: ServiceWorkerRegistration | undefined) => {
    const notifOptions: NotificationOptions = {
      body,
      icon: '/favicon.ico',
      tag: `task-${task.id}`,
      requireInteraction: true,
      data: { taskId: task.id, url: '/tasks' },
    }

    if (reg) {
      reg.showNotification('Task Reminder', notifOptions).catch(() => {
        new Notification('Task Reminder', notifOptions)
      })
    } else {
      new Notification('Task Reminder', notifOptions)
    }
  }

  if ('serviceWorker' in navigator) {
    const timeout = new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 3000))
    Promise.race([navigator.serviceWorker.ready, timeout])
      .then((reg) => show(reg))
      .catch(() => show(undefined))
  } else {
    show(undefined)
  }
}
