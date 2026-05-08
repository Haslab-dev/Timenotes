import React, { createContext, useContext, useEffect, useState } from 'react'

interface ActiveTimer {
  id: string
  startTime: Date
  projectId: string | null
  description: string
  timeEntryId?: string
}

interface TimerActionsContextType {
  activeTimer: ActiveTimer | null
  startTimer: (projectId?: string, description?: string) => void
  stopTimer: () => ActiveTimer | null
  updateTimer: (updates: Partial<ActiveTimer>) => void
}

interface TimerTickerContextType {
  elapsedSeconds: number
}

const TimerActionsContext = createContext<TimerActionsContextType | undefined>(undefined)
const TimerTickerContext = createContext<TimerTickerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const saved = localStorage.getItem('timenotes_active_timer')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          ...parsed,
          startTime: new Date(parsed.startTime),
        }
      } catch (e) {
        return null
      }
    }
    return null
  })

  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('timenotes_active_timer', JSON.stringify(activeTimer))

      const calcElapsed = () => {
        setElapsedSeconds(Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000))
      }

      calcElapsed()
      const interval = setInterval(calcElapsed, 1000)
      return () => clearInterval(interval)
    } else {
      localStorage.removeItem('timenotes_active_timer')
      setElapsedSeconds(0)
    }
  }, [activeTimer])

  const startTimer = (projectId: string | null = null, description: string = '') => {
    setActiveTimer({
      id: crypto.randomUUID(),
      startTime: new Date(),
      projectId,
      description,
    })
  }

  const stopTimer = () => {
    const currentTimer = activeTimer
    setActiveTimer(null)
    return currentTimer
  }

  const updateTimer = (updates: Partial<ActiveTimer>) => {
    setActiveTimer((prev) => (prev ? { ...prev, ...updates } : null))
  }

  return (
    <TimerActionsContext.Provider value={{ activeTimer, startTimer, stopTimer, updateTimer }}>
      <TimerTickerContext.Provider value={{ elapsedSeconds }}>
        {children}
      </TimerTickerContext.Provider>
    </TimerActionsContext.Provider>
  )
}

export function useActiveTimer() {
  const context = useContext(TimerActionsContext)
  if (context === undefined) {
    throw new Error('useActiveTimer must be used within a TimerProvider')
  }
  return context
}

export function useTimerTicker() {
  const context = useContext(TimerTickerContext)
  if (context === undefined) {
    throw new Error('useTimerTicker must be used within a TimerProvider')
  }
  return context
}
