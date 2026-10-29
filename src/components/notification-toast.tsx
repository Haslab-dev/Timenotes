import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { IconX, IconBell, IconAlertTriangle, IconClock } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { subscribe, getSnapshot, removeToast, type TaskToast } from '@/lib/utils/toast-state'

export function NotificationToastContainer() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  if (currentToasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col items-center gap-2.5 p-3 sm:top-auto sm:bottom-0 sm:right-0 sm:left-auto sm:items-end sm:p-5">
      {currentToasts.map((toast, index) => (
        <NotificationToastItem
          key={toast.id}
          toast={toast}
          index={index}
          total={currentToasts.length}
        />
      ))}
    </div>
  )
}

function NotificationToastItem({
  toast,
  index,
}: {
  toast: TaskToast
  index: number
  total: number
}) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = useCallback(() => {
    setExiting(true)
    setTimeout(() => removeToast(toast.id), 200)
  }, [toast.id])

  const isDue = toast.type === 'due'

  return (
    <div
      className={cn(
        'pointer-events-auto relative w-full max-w-[380px] rounded-xl border bg-card p-4 shadow-lg transition-all duration-200',
        visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'opacity-0 scale-95 translate-y-2'
      )}
      style={{ zIndex: 9999 + index }}
    >
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
          isDue ? 'bg-destructive' : 'bg-primary'
        )}
      />

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            isDue ? 'bg-destructive/10 text-destructive' : 'bg-tertiary text-tertiary-foreground'
          )}
        >
          {isDue ? <IconAlertTriangle className="h-4 w-4" /> : <IconBell className="h-4 w-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                isDue
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary text-secondary-foreground'
              )}
            >
              {isDue ? <IconClock className="h-3 w-3" /> : <IconBell className="h-3 w-3" />}
              {isDue ? 'Due' : 'Reminder'}
            </span>
          </div>

          <p className="text-sm font-semibold text-foreground leading-tight truncate">
            {toast.title}
          </p>

          {toast.description && (
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {toast.description}
            </p>
          )}

          {toast.dueInfo && (
            <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">{toast.dueInfo}</p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <IconX className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
