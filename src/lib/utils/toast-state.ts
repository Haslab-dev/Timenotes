export interface TaskToast {
  id: string
  title: string
  description?: string
  dueInfo?: string
  type: 'due' | 'reminder'
}

let toastIdCounter = 0
let listeners: Array<() => void> = []
let toasts: TaskToast[] = []

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribe(listener: () => void) {
  listeners = [...listeners, listener]
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}

export function getSnapshot(): TaskToast[] {
  return toasts
}

export function addTaskToast(toast: Omit<TaskToast, 'id'>) {
  const id = `toast-${++toastIdCounter}`
  toasts = [...toasts, { ...toast, id }]
  emitChange()

  setTimeout(() => {
    removeToast(id)
  }, 10000)

  return id
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emitChange()
}
