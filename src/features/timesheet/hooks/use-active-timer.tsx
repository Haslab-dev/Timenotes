import React, { createContext, useContext, useEffect, useState } from 'react'

interface TimerSettings {
  workDurationMinutes: number
  shortBreakDurationMinutes: number
  longBreakDurationMinutes: number
  volume: number
}

interface ActiveTimer {
  id: string
  startTime: Date
  projectId: string | null
  description: string
  timeEntryId?: string
  isPaused: boolean
  workAccumulatedSeconds: number
  restAccumulatedSeconds: number
  settings: TimerSettings
  mode: 'work' | 'shortBreak' | 'longBreak'
}

interface TimerActionsContextType {
  activeTimer: ActiveTimer | null
  startTimer: (projectId?: string, description?: string, settings?: Partial<TimerSettings>) => void
  stopTimer: () => ActiveTimer | null
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
  switchMode: (mode: 'work' | 'shortBreak' | 'longBreak') => void
  updateTimer: (updates: Partial<ActiveTimer>) => void
  updateSettings: (settings: Partial<TimerSettings>) => void
  timerSettings: TimerSettings
}

interface TimerTickerContextType {
  elapsedSeconds: number
  remainingSeconds: number | null
  totalWorkSeconds: number
}

const DEFAULT_SETTINGS: TimerSettings = {
  workDurationMinutes: 25,
  shortBreakDurationMinutes: 5,
  longBreakDurationMinutes: 15,
  volume: 0.5,
}

const TimerActionsContext = createContext<TimerActionsContextType | undefined>(undefined)
const TimerTickerContext = createContext<TimerTickerContextType | undefined>(undefined)

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timerSettings, setTimerSettings] = useState<TimerSettings>(() => {
    const saved = localStorage.getItem('timenotes_timer_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          workDurationMinutes: 25,
          shortBreakDurationMinutes: 5,
          longBreakDurationMinutes: 15,
          ...parsed,
        }
      } catch (e) {
        return DEFAULT_SETTINGS
      }
    }
    return DEFAULT_SETTINGS
  })

  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const saved = localStorage.getItem('timenotes_active_timer')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return {
          workAccumulatedSeconds: 0,
          restAccumulatedSeconds: 0,
          isPaused: false,
          mode: 'work',
          settings: timerSettings,
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
  const [totalWorkSeconds, setTotalWorkSeconds] = useState(0)

  useEffect(() => {
    localStorage.setItem('timenotes_timer_settings', JSON.stringify(timerSettings))
  }, [timerSettings])

  useEffect(() => {
    if (activeTimer) {
      localStorage.setItem('timenotes_active_timer', JSON.stringify(activeTimer))

      const calcElapsed = () => {
        const sessionExtra = activeTimer.isPaused
          ? 0
          : Math.floor((Date.now() - activeTimer.startTime.getTime()) / 1000)

        if (activeTimer.mode === 'work') {
          const currentWork = activeTimer.workAccumulatedSeconds + sessionExtra
          setElapsedSeconds(currentWork) // This will be used for countdown if limit is set
          setTotalWorkSeconds(currentWork)
        } else {
          const currentRest = activeTimer.restAccumulatedSeconds + sessionExtra
          setElapsedSeconds(currentRest)
          setTotalWorkSeconds(activeTimer.workAccumulatedSeconds) // Preserve work time
        }
      }

      calcElapsed()
      if (!activeTimer.isPaused) {
        const interval = setInterval(calcElapsed, 1000)
        return () => clearInterval(interval)
      }
    } else {
      localStorage.removeItem('timenotes_active_timer')
      setElapsedSeconds(0)
      setTotalWorkSeconds(0)
    }
  }, [activeTimer])

  const startTimer = (
    projectId: string | null = null,
    description: string = '',
    settings?: Partial<TimerSettings>
  ) => {
    setActiveTimer({
      id: crypto.randomUUID(),
      startTime: new Date(),
      projectId,
      description,
      isPaused: false,
      workAccumulatedSeconds: 0,
      restAccumulatedSeconds: 0,
      mode: 'work',
      settings: { ...timerSettings, ...settings },
    })
  }

  const stopTimer = () => {
    let finalTimer = activeTimer
    if (finalTimer && !finalTimer.isPaused) {
      const now = new Date()
      const extraSeconds = Math.floor((now.getTime() - finalTimer.startTime.getTime()) / 1000)
      if (finalTimer.mode === 'work') {
        finalTimer = {
          ...finalTimer,
          workAccumulatedSeconds: finalTimer.workAccumulatedSeconds + extraSeconds,
        }
      } else {
        finalTimer = {
          ...finalTimer,
          restAccumulatedSeconds: finalTimer.restAccumulatedSeconds + extraSeconds,
        }
      }
    }
    setActiveTimer(null)
    return finalTimer
  }

  const pauseTimer = () => {
    setActiveTimer((prev) => {
      if (!prev || prev.isPaused) return prev
      const now = new Date()
      const extraSeconds = Math.floor((now.getTime() - prev.startTime.getTime()) / 1000)
      if (prev.mode === 'work') {
        return {
          ...prev,
          isPaused: true,
          workAccumulatedSeconds: prev.workAccumulatedSeconds + extraSeconds,
        }
      } else {
        return {
          ...prev,
          isPaused: true,
          restAccumulatedSeconds: prev.restAccumulatedSeconds + extraSeconds,
        }
      }
    })
  }

  const resumeTimer = () => {
    setActiveTimer((prev) => {
      if (!prev || !prev.isPaused) return prev
      return {
        ...prev,
        isPaused: false,
        startTime: new Date(),
      }
    })
  }

  const switchMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setActiveTimer((prev) => {
      if (!prev || prev.mode === mode) return prev
      const now = new Date()
      
      // Calculate how much time was spent in the PREVIOUS mode
      const extraSeconds = prev.isPaused
        ? 0
        : Math.floor((now.getTime() - prev.startTime.getTime()) / 1000)

      const updated = { ...prev }
      if (prev.mode === 'work') {
        updated.workAccumulatedSeconds += extraSeconds
      } else {
        updated.restAccumulatedSeconds += extraSeconds
      }

      // Reset for the NEW mode
      updated.mode = mode
      updated.startTime = now
      updated.isPaused = false // Auto-start on switch
      
      // If we are switching TO a break, we want a fresh start for that break
      if (mode !== 'work') {
        updated.restAccumulatedSeconds = 0 
      }
      // If we are switching TO work, we preserve workAccumulatedSeconds (the user requested this earlier: "do not reset main time")
      
      return updated
    })
  }

  const resetTimer = () => {
    setActiveTimer((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        startTime: new Date(),
        workAccumulatedSeconds: prev.mode === 'work' ? 0 : prev.workAccumulatedSeconds,
        restAccumulatedSeconds: prev.mode !== 'work' ? 0 : prev.restAccumulatedSeconds,
        isPaused: true, // Pause on reset? Or keep status? Usually reset pauses.
      }
    })
  }

  const updateTimer = (updates: Partial<ActiveTimer>) => {
    setActiveTimer((prev) => (prev ? { ...prev, ...updates } : null))
  }

  const updateSettings = (updates: Partial<TimerSettings>) => {
    setTimerSettings((prev) => ({ ...prev, ...updates }))
    if (activeTimer) {
      updateTimer({ settings: { ...activeTimer.settings, ...updates } })
    }
  }

  const targetSeconds = activeTimer
    ? (activeTimer.mode === 'work'
        ? activeTimer.settings?.workDurationMinutes || timerSettings.workDurationMinutes
        : activeTimer.mode === 'shortBreak'
        ? activeTimer.settings?.shortBreakDurationMinutes || timerSettings.shortBreakDurationMinutes
        : activeTimer.settings?.longBreakDurationMinutes || timerSettings.longBreakDurationMinutes) * 60
    : null

  const remainingSeconds =
    targetSeconds !== null
      ? Math.max(0, targetSeconds - (isNaN(elapsedSeconds) ? 0 : elapsedSeconds))
      : null

  const lastAlertSessionRef = React.useRef<string | null>(null)

  // Sound alert logic
  useEffect(() => {
    const sessionKey = `${activeTimer?.id}-${activeTimer?.mode}`
    if (
      remainingSeconds === 0 &&
      activeTimer &&
      !activeTimer.isPaused &&
      lastAlertSessionRef.current !== sessionKey
    ) {
      const playAlert = () => {
        if (timerSettings.volume === 0) return
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          gain.gain.value = timerSettings.volume
          osc.frequency.value = 880
          osc.type = 'sine'
          osc.start()
          osc.stop(ctx.currentTime + 0.5)
          lastAlertSessionRef.current = sessionKey
        } catch (e) {
          console.error('Failed to play alert sound', e)
        }
      }
      playAlert()
    }

    if (remainingSeconds !== 0) {
      lastAlertSessionRef.current = null
    }
  }, [
    remainingSeconds,
    activeTimer?.id,
    activeTimer?.mode,
    activeTimer?.isPaused,
    timerSettings.volume,
  ])

  return (
    <TimerActionsContext.Provider
      value={{
        activeTimer,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        switchMode,
        updateTimer,
        updateSettings,
        timerSettings,
      }}
    >
      <TimerTickerContext.Provider value={{ elapsedSeconds, remainingSeconds, totalWorkSeconds }}>
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

