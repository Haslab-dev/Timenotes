import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  FileText,
  LayoutList,
  Calendar as CalendarIcon,
  Clock,
  Plus,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { StatsCards } from '../components/stats-cards'
import { ProjectHoursChart } from '../components/project-hours-chart'
import { TagHoursChart } from '../components/tag-hours-chart'
import { RecentActivity } from '../components/recent-activity'
import { DashboardCalendar } from '../components/dashboard-calendar'
import { useTimeNoteDashboard } from '../hooks/use-timenote-dashboard'
import { useTimeEntries } from '@/features/timesheet/hooks/use-timesheet'
import { useNotes } from '@/features/notes/hooks/use-notes'

import { useActiveTimer, useTimerTicker } from '@/features/timesheet/hooks/use-active-timer'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { TimesheetSidePanel } from '@/features/timesheet/components/timesheet-side-panel'
import { NotesSidePanel } from '@/features/notes/components/notes-side-panel'

export function TimeNoteDashboardPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [_, setSearchParams] = useSearchParams()
  const { data: stats, isLoading, error } = useTimeNoteDashboard()
  const { data: timeEntries = [] } = useTimeEntries()
  const { data: notes = [] } = useNotes()
  const {
    activeTimer,
    pauseTimer,
    resumeTimer,
    updateSettings,
    timerSettings,
    stopTimer,
    updateTimer,
    switchMode,
    resetTimer,
  } = useActiveTimer()
  const { elapsedSeconds, remainingSeconds, totalWorkSeconds } = useTimerTicker()
  const { data: projects = [] } = useProjects()
  const [view, setView] = useState<'overview' | 'calendar'>('overview')
  const [isStartingFocus, setIsStartingFocus] = useState(false)
  const { startTimer } = useActiveTimer()

  const [focusDetails, setFocusDetails] = useState({
    projectId: '',
    description: '',
    workDurationMinutes: timerSettings.workDurationMinutes,
    shortBreakDurationMinutes: timerSettings.shortBreakDurationMinutes,
    longBreakDurationMinutes: timerSettings.longBreakDurationMinutes,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-left">Dashboard</h1>
          <p className="text-muted-foreground text-left">Welcome to TimeNotes</p>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-left">Dashboard</h1>
          <p className="text-muted-foreground text-left">Welcome to TimeNotes</p>
        </div>
        <div className="text-center py-8 text-destructive text-left">Error loading dashboard</div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Focus Starter Mode
  if (isStartingFocus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="max-w-xl w-full p-8 sm:p-12 rounded-[40px] bg-card border shadow-2xl shadow-primary/5 relative overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-6 right-6 rounded-full h-10 w-10"
            onClick={() => setIsStartingFocus(false)}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="text-center space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-[0.2em] uppercase">
                {activeTimer ? 'Configure Session' : 'Prepare Focus Session'}
              </div>
              <h2 className="text-4xl font-black tracking-tight">
                {activeTimer ? 'Update durations?' : 'Ready to focus?'}
              </h2>
            </div>

            <div className="space-y-6 text-left">
              {!activeTimer && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                      Select Project
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() =>
                            setFocusDetails((prev) => ({ ...prev, projectId: project.id }))
                          }
                          className={[
                            'flex items-center gap-2 p-3 rounded-2xl border transition-all text-sm font-bold',
                            focusDetails.projectId === project.id
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-muted-foreground/10 bg-muted/10 hover:bg-muted/20 text-muted-foreground',
                          ].join(' ')}
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                      What are you working on?
                    </label>
                    <textarea
                      placeholder="E.g. Designing mobile interface, Writing documentation..."
                      className="w-full h-24 p-4 rounded-2xl bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none text-sm font-medium resize-none"
                      value={focusDetails.description}
                      onChange={(e) =>
                        setFocusDetails((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Pomodoro
                    </label>
                  </div>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-xl bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none text-sm font-black"
                    value={focusDetails.workDurationMinutes}
                    onChange={(e) =>
                      setFocusDetails((prev) => ({
                        ...prev,
                        workDurationMinutes: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Short Break
                    </label>
                  </div>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-xl bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none text-sm font-black"
                    value={focusDetails.shortBreakDurationMinutes}
                    onChange={(e) =>
                      setFocusDetails((prev) => ({
                        ...prev,
                        shortBreakDurationMinutes: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      Long Break
                    </label>
                  </div>
                  <input
                    type="number"
                    className="w-full h-10 px-3 rounded-xl bg-muted/20 border-2 border-transparent focus:border-primary/20 focus:bg-background transition-all outline-none text-sm font-black"
                    value={focusDetails.longBreakDurationMinutes}
                    onChange={(e) =>
                      setFocusDetails((prev) => ({
                        ...prev,
                        longBreakDurationMinutes: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                  Alert Volume
                </label>
                <div className="flex items-center gap-4 px-4 h-12 rounded-2xl bg-muted/20 border border-muted-foreground/10">
                  {timerSettings.volume === 0 ? (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={timerSettings.volume}
                    onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                    className="flex-1 accent-primary"
                  />
                  <span className="text-[10px] font-black w-8">
                    {Math.round(timerSettings.volume * 100)}%
                  </span>
                </div>
              </div>

              <Button
                className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                onClick={() => {
                  if (activeTimer) {
                    updateSettings({
                      workDurationMinutes: focusDetails.workDurationMinutes,
                      shortBreakDurationMinutes: focusDetails.shortBreakDurationMinutes,
                      longBreakDurationMinutes: focusDetails.longBreakDurationMinutes,
                    })
                  } else {
                    startTimer(focusDetails.projectId || undefined, focusDetails.description, {
                      workDurationMinutes: focusDetails.workDurationMinutes,
                      shortBreakDurationMinutes: focusDetails.shortBreakDurationMinutes,
                      longBreakDurationMinutes: focusDetails.longBreakDurationMinutes,
                    })
                  }
                  setIsStartingFocus(false)
                }}
              >
                {activeTimer ? 'Save Settings' : 'Start Session'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Focus Mode
  if (activeTimer) {
    const activeProject = projects.find((p) => p.id === activeTimer.projectId)
    const formatTime = (totalSeconds: number) => {
      const safeTime = isNaN(totalSeconds) ? 0 : totalSeconds
      const h = Math.floor(safeTime / 3600)
      const m = Math.floor((safeTime % 3600) / 60)
      const s = safeTime % 60
      return {
        hours: h > 0 ? h.toString().padStart(2, '0') + ':' : '',
        minutes: m.toString().padStart(2, '0'),
        seconds: s.toString().padStart(2, '0'),
      }
    }

    const countdownTime =
      remainingSeconds !== null ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)
    const sessionTime = formatTime(totalWorkSeconds)

    const modeColors = {
      work: 'primary',
      shortBreak: 'teal-500',
      longBreak: 'blue-500',
    }

    const modeLabels = {
      work: 'Pomodoro',
      shortBreak: 'Short Break',
      longBreak: 'Long Break',
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-8 max-w-xl w-full p-8 sm:p-12 rounded-[40px] bg-card border shadow-2xl shadow-primary/5 relative overflow-hidden transition-all duration-500">
          {/* Dynamic background glow based on mode */}
          <div
            className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl opacity-20 transition-colors duration-700 ${activeTimer.mode === 'work' ? 'bg-primary' : activeTimer.mode === 'shortBreak' ? 'bg-teal-500' : 'bg-blue-500'}`}
          />
          <div
            className={`absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-3xl opacity-10 transition-colors duration-700 ${activeTimer.mode === 'work' ? 'bg-primary' : activeTimer.mode === 'shortBreak' ? 'bg-teal-500' : 'bg-blue-500'}`}
          />

          <div className="space-y-6 relative z-10">
            {/* Mode Tabs */}
            <div className="flex items-center justify-center p-1.5 rounded-2xl bg-muted/30 border border-muted-foreground/5 w-fit mx-auto">
              {(['work', 'shortBreak', 'longBreak'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTimer.mode === m ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  {modeLabels[m]}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <div
                className={`text-[100px] sm:text-[120px] font-mono font-bold tracking-tighter tabular-nums leading-none select-none transition-all duration-500 ${activeTimer.isPaused ? 'opacity-30 scale-95' : 'opacity-100 scale-100 text-foreground'}`}
              >
                {countdownTime.minutes}:{countdownTime.seconds}
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <Button
                size="lg"
                className="w-48 h-16 bg-primary text-primary-foreground hover:bg-primary/90 text-2xl font-black rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 active:shadow-none border-b-4 border-primary-foreground/20"
                onClick={() => (activeTimer.isPaused ? resumeTimer() : pauseTimer())}
              >
                {activeTimer.isPaused ? 'START' : 'PAUSE'}
              </Button>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full h-10 w-10 ${activeTimer.isPaused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  onClick={() => setIsStartingFocus(true)}
                  title="Configure durations"
                >
                  <Plus className="h-6 w-6" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full h-10 w-10 ${activeTimer.isPaused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                  onClick={() => {
                    if (confirm('Reset timer for this mode?')) {
                      resetTimer()
                    }
                  }}
                  title="Reset timer"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-muted/50 space-y-6 relative z-10">
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-foreground">
                {activeTimer.mode === 'work' ? 'Time to focus!' : 'Break Time'}
              </h2>
              {activeProject ? (
                <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-muted/50 border border-muted-foreground/10">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: activeProject.color }}
                  />
                  <span className="text-sm font-bold tracking-tight">{activeProject.name}</span>
                </div>
              ) : (
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-50">
                  General Session
                </p>
              )}
              {activeTimer.description && (
                <p className="text-sm font-medium text-muted-foreground italic">
                  "{activeTimer.description}"
                </p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-bold text-[10px] uppercase tracking-widest"
              onClick={() => {
                if (confirm('Finish this session?')) {
                  const timer = stopTimer()
                  if (timer && timer.projectId) {
                    navigate('/timesheet/new', {
                      state: {
                        id: timer.id,
                        projectId: timer.projectId,
                        description: timer.description,
                        startTime: timer.startTime,
                      },
                    })
                  }
                }
              }}
            >
              Finish Session
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-8">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex bg-muted/50 p-1 rounded-xl border shadow-inner overflow-hidden">
          <Button
            variant={view === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className={[
              'h-8 px-3 sm:px-4 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer',
              view === 'overview' ? 'shadow-md' : 'text-muted-foreground hover:bg-muted',
            ].join(' ')}
            onClick={() => setView('overview')}
          >
            <LayoutList className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Overview</span>
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className={[
              'h-8 px-3 sm:px-4 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer',
              view === 'calendar' ? 'shadow-md' : 'text-muted-foreground hover:bg-muted',
            ].join(' ')}
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-full border-primary/20 hover:border-primary/50 hover:bg-primary/5 text-xs font-bold transition-all active:scale-95 group"
            onClick={() => setIsStartingFocus(true)}
          >
            <Play className="h-3 w-3 mr-2 text-primary fill-none group-hover:fill-primary/10 transition-all" />
            Start timer
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
            onClick={() => navigate('/notes/new')}
            title="New Note"
          >
            <FileText className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
            onClick={() => navigate('/timesheet/new')}
            title="New Time Entry"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'overview' ? (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
          {/* Stats Cards */}
          <StatsCards stats={stats} />

          {/* Charts */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <ProjectHoursChart stats={stats} />
            <TagHoursChart stats={stats} />
          </div>

          {/* Recent Activity */}
          <RecentActivity
            stats={stats}
            onViewNote={(note) => {
              if (isMobile) {
                navigate(`/notes/${note.id}/edit`)
              } else {
                setSearchParams({ noteId: note.id })
              }
            }}
            onEditEntry={(entry) => {
              if (isMobile) {
                navigate(`/timesheet/${entry.id}/edit`)
              } else {
                setSearchParams({ timeEntryId: entry.id })
              }
            }}
          />
        </div>
      ) : (
        <DashboardCalendar
          timeEntries={timeEntries}
          notes={notes}
          onSelectEntry={(entry) => {
            if (isMobile) {
              navigate(`/timesheet/${entry.id}/edit`)
            } else {
              setSearchParams({ timeEntryId: entry.id })
            }
          }}
          onSelectNote={(note) => {
            if (isMobile) {
              navigate(`/notes/${note.id}/edit`)
            } else {
              setSearchParams({ noteId: note.id })
            }
          }}
        />
      )}

      {/* Detail Side Panels (Desktop only, mobile uses full-page navigation) */}
      {!isMobile && (
        <>
          <TimesheetSidePanel />
          <NotesSidePanel />
        </>
      )}
    </div>
  )
}
