import { useEffect, useRef } from 'react'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import { taskRepository } from '../api/task-repository'
import { format } from 'date-fns'

const NOTIFICATION_CHECK_INTERVAL = 15000

export function NotificationManager() {
  const { user } = useAuthContext()
  const notifiedRef = useRef<Set<string>>(new Set())
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) return

    const checkNotifications = async () => {
      try {
        const dueTasks = await taskRepository.getUnnotifiedDueTasks(user.id)
        const reminderTasks = await taskRepository.getTasksNeedingReminders(user.id)

        const allNotifiable = [...dueTasks, ...reminderTasks].filter(
          (task) => !notifiedRef.current.has(task.id)
        )

        for (const task of allNotifiable) {
          showNotification(task)
          notifiedRef.current.add(task.id)
          try {
            await taskRepository.markNotified(task.id, user.id)
          } catch {
          }
        }
      } catch {
      }
    }

    const requestPermission = async () => {
      if (!('Notification' in window)) return
      if (Notification.permission === 'default') {
        await Notification.requestPermission()
      }
    }

    requestPermission()
    checkNotifications()

    intervalRef.current = setInterval(checkNotifications, NOTIFICATION_CHECK_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [user])

  return null
}

function showNotification(task: { id: string; title: string; description?: string; dueDate?: Date; dueTime?: string }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const dueStr = task.dueDate
    ? `${format(task.dueDate, 'MMM d')}${task.dueTime ? ` at ${task.dueTime}` : ''}`
    : ''

  try {
    new Notification('Task Reminder', {
      body: task.description
        ? `${task.title}${dueStr ? ` — ${dueStr}` : ''}`
        : task.title,
      icon: '/favicon.ico',
      tag: `task-${task.id}`,
      requireInteraction: true,
    })
  } catch {
    try {
      new Notification('Task Reminder', {
        body: task.title,
        tag: `task-${task.id}`,
      })
    } catch {
    }
  }
}

export function requestNotificationPermission() {
  if (!('Notification' in window)) return Promise.resolve('denied')
  if (Notification.permission === 'granted') return Promise.resolve('granted')
  if (Notification.permission === 'denied') return Promise.resolve('denied')
  return Notification.requestPermission()
}
