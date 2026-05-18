import { useState, useEffect, useCallback } from 'react'
import { useSyncExternalStore } from 'react'
import { X, Bell, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { subscribe, getSnapshot, removeToast, type TaskToast } from '@/lib/utils/toast-state'

export function NotificationToastContainer() {
  const currentToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  if (currentToasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex flex-col items-center gap-3 p-3 sm:top-auto sm:bottom-0 sm:right-0 sm:left-auto sm:items-end sm:p-5">
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
        'pointer-events-auto relative w-full max-w-[420px] rounded-2xl border-2 bg-card p-5 shadow-xl transition-all duration-300',
        visible && !exiting
          ? 'translate-y-0 opacity-100 scale-100'
          : 'opacity-0 scale-95 translate-y-2',
        isDue
          ? 'border-red-500/30 shadow-red-500/10'
          : 'border-emerald-500/30 shadow-emerald-500/10'
      )}
      style={{ zIndex: 9999 + index }}
    >
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-1 rounded-l-full',
          isDue ? 'bg-red-500' : 'bg-emerald-500'
        )}
      />

      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isDue ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
          )}
        >
          {isDue ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                isDue ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
              )}
            >
              {isDue ? <Clock className="h-3 w-3" /> : <Bell className="h-3 w-3" />}
              {isDue ? 'Due' : 'Reminder'}
            </span>
          </div>

          <p className="text-base font-bold text-foreground leading-tight truncate">
            {toast.title}
          </p>

          {toast.description && (
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {toast.description}
            </p>
          )}

          {toast.dueInfo && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground/80">{toast.dueInfo}</p>
          )}
        </div>

        <button
          onClick={handleClose}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
