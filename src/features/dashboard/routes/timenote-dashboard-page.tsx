import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/ui/page-header'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { useTimeEntries } from '@/features/timesheet/hooks/use-timesheet'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import {
  IconCalendarMonth,
  IconNotes,
  IconLayoutList,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlus,
  IconRotateClockwise,
  IconVolume,
  IconVolumeOff,
  IconX,
  IconAdjustmentsHorizontal,
} from '@tabler/icons-react'
import { useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { DashboardCalendar } from '../components/dashboard-calendar'
import { ProjectHoursChart } from '../components/project-hours-chart'
import { RecentActivity } from '../components/recent-activity'
import { StatsCards } from '../components/stats-cards'
import { TagHoursChart } from '../components/tag-hours-chart'
import { useTimeNoteDashboard } from '../hooks/use-timenote-dashboard'

import { NotesSidePanel } from '@/features/notes/components/notes-side-panel'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { TimesheetSidePanel } from '@/features/timesheet/components/timesheet-side-panel'
import { useActiveTimer, useTimerTicker } from '@/features/timesheet/hooks/use-active-timer'
import { BookDashboard } from '@/features/books/components/book-dashboard'
import { useBooks, useDeleteBook } from '@/features/books/hooks/use-books'
import { useTasks, useCreateTask, useUpdateTask } from '@/features/tasks/hooks/use-tasks'
import { TaskDialog } from '@/features/tasks/components/task-dialog'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/lib/types'

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
    switchMode,
    resetTimer,
    startTimer,
  } = useActiveTimer()
  const { elapsedSeconds, remainingSeconds } = useTimerTicker()
  const { data: projects = [] } = useProjects()
  const [view, setView] = useState<'overview' | 'calendar'>('overview')
  const [isStartingFocus, setIsStartingFocus] = useState(false)
  const { data: booksData = [] } = useBooks()
  const deleteBook = useDeleteBook()

  const { data: tasks = [] } = useTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskDefaultDate, setTaskDefaultDate] = useState<Date>()

  const handleAddTask = useCallback((date?: Date) => {
    setEditingTask(null)
    setTaskDefaultDate(date || new Date())
    setTaskDialogOpen(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setTaskDefaultDate(undefined)
    setTaskDialogOpen(true)
  }, [])

  const handleToggleTask = useCallback(
    (task: Task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      updateTask.mutate({ id: task.id, data: { status: newStatus } })
    },
    [updateTask]
  )

  const handleSaveTask = useCallback(
    (data: CreateTaskRequest | UpdateTaskRequest) => {
      if (editingTask) {
        updateTask.mutate(
          { id: editingTask.id, data: data as UpdateTaskRequest },
          { onSuccess: () => setTaskDialogOpen(false) }
        )
      } else {
        createTask.mutate(data as CreateTaskRequest, {
          onSuccess: () => setTaskDialogOpen(false),
        })
      }
    },
    [editingTask, createTask, updateTask]
  )

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
        <PageHeader title="Dashboard" description="Welcome back to your workspace" />
        <div className="text-center py-12 text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Welcome back to your workspace" />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive text-left">
          Error loading dashboard data.
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Focus Configuration View
  if (isStartingFocus) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] animate-fade-in">
        <Card className="max-w-lg w-full p-6 sm:p-8 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8"
            onClick={() => setIsStartingFocus(false)}
          >
            <IconX className="h-4 w-4" />
          </Button>

          <div className="space-y-6 text-left">
            <div className="space-y-1.5">
              <Badge variant="tertiary">{activeTimer ? 'Session Settings' : 'Focus Session'}</Badge>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                {activeTimer ? 'Update timer durations' : 'Configure focus session'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Set your target project, task objective, and Pomodoro intervals.
              </p>
            </div>

            <div className="space-y-5">
              {!activeTimer && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Project</label>
                    <div className="grid grid-cols-2 gap-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() =>
                            setFocusDetails((prev) => ({ ...prev, projectId: project.id }))
                          }
                          className={[
                            'flex items-center gap-2 px-3 py-2 rounded-md border transition-colors text-xs font-medium cursor-pointer',
                            focusDetails.projectId === project.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background hover:bg-secondary/60 text-foreground',
                          ].join(' ')}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="truncate">{project.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-foreground">Session Objective</label>
                    <Textarea
                      placeholder="What are you focusing on?"
                      className="min-h-[76px] text-sm resize-none"
                      value={focusDetails.description}
                      onChange={(e) =>
                        setFocusDetails((prev) => ({ ...prev, description: e.target.value }))
                      }
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Focus (min)</label>
                  <Input
                    type="number"
                    className="h-9 text-sm tabular-nums"
                    value={focusDetails.workDurationMinutes}
                    onChange={(e) =>
                      setFocusDetails((prev) => ({
                        ...prev,
                        workDurationMinutes: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Short Break</label>
                  <Input
                    type="number"
                    className="h-9 text-sm tabular-nums"
                    value={focusDetails.shortBreakDurationMinutes}
                    onChange={(e) =>
                      setFocusDetails((prev) => ({
                        ...prev,
                        shortBreakDurationMinutes: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Long Break</label>
                  <Input
                    type="number"
                    className="h-9 text-sm tabular-nums"
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

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Alert Volume</label>
                <div className="flex items-center gap-3 px-3 h-10 rounded-md bg-secondary/50 border border-border">
                  {timerSettings.volume === 0 ? (
                    <IconVolumeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <IconVolume className="h-4 w-4 text-muted-foreground" />
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
                  <span className="text-xs font-mono text-muted-foreground w-9 text-right">
                    {Math.round(timerSettings.volume * 100)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setIsStartingFocus(false)}>
                  Cancel
                </Button>
                <Button
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
                  <IconPlayerPlay className="h-4 w-4 mr-1.5" />
                  {activeTimer ? 'Save Settings' : 'Start Session'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  // Active Focus Mode
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

    const modeLabels = {
      work: 'Pomodoro',
      shortBreak: 'Short Break',
      longBreak: 'Long Break',
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] animate-fade-in">
        <Card className="text-center space-y-8 max-w-lg w-full p-6 sm:p-10">
          <div className="space-y-6">
            {/* Mode Tabs */}
            <div className="inline-flex items-center p-1 rounded-lg bg-secondary border border-border">
              {(['work', 'shortBreak', 'longBreak'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    activeTimer.mode === m
                      ? m === 'work'
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-tertiary text-tertiary-foreground shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {modeLabels[m]}
                </button>
              ))}
            </div>

            <div className="py-2">
              <div
                className={`text-7xl sm:text-8xl font-mono font-semibold tracking-tight tabular-nums leading-none select-none transition-opacity ${
                  activeTimer.isPaused ? 'opacity-40' : 'opacity-100 text-foreground'
                }`}
              >
                {countdownTime.minutes}:{countdownTime.seconds}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              <Button
                size="lg"
                variant={activeTimer.isPaused ? 'default' : 'secondary'}
                className="w-40 h-11 font-medium"
                onClick={() => (activeTimer.isPaused ? resumeTimer() : pauseTimer())}
              >
                {activeTimer.isPaused ? (
                  <>
                    <IconPlayerPlay className="h-4 w-4 mr-1.5" />
                    Resume
                  </>
                ) : (
                  <>
                    <IconPlayerPause className="h-4 w-4 mr-1.5" />
                    Pause
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => setIsStartingFocus(true)}
                title="Configure durations"
              >
                <IconAdjustmentsHorizontal className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() => {
                  if (confirm('Reset timer for this mode?')) {
                    resetTimer()
                  }
                }}
                title="Reset timer"
              >
                <IconRotateClockwise className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-border space-y-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {activeTimer.mode === 'work' ? 'Current Focus' : 'Recovery Interval'}
              </span>
              {activeProject ? (
                <Badge variant="secondary" className="gap-2 px-3 py-1 text-xs">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeProject.color }}
                  />
                  {activeProject.name}
                </Badge>
              ) : (
                <Badge variant="outline">General Session</Badge>
              )}
              {activeTimer.description && (
                <p className="text-sm text-muted-foreground max-w-sm">{activeTimer.description}</p>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive"
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
              End Session
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Track your hours, active projects, and recent notes."
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-secondary/70 p-0.5 rounded-lg border border-border">
              <Button
                variant={view === 'overview' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 rounded-md text-xs"
                onClick={() => setView('overview')}
              >
                <IconLayoutList className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Overview</span>
              </Button>
              <Button
                variant={view === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 rounded-md text-xs"
                onClick={() => setView('calendar')}
              >
                <IconCalendarMonth className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Calendar</span>
              </Button>
            </div>

            <Button variant="tertiary" size="sm" onClick={() => setIsStartingFocus(true)}>
              <IconPlayerPlay className="h-3.5 w-3.5 mr-1.5" />
              Focus
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/notes/new')}
              title="New Note"
            >
              <IconNotes className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigate('/timesheet/new')}
              title="New Time Entry"
            >
              <IconPlus className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {view === 'overview' ? (
        <div className="space-y-6 animate-fade-in">
          <StatsCards stats={stats} />

          <div className="grid gap-6 md:grid-cols-2">
            <ProjectHoursChart stats={stats} />
            <TagHoursChart stats={stats} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-tight text-foreground text-left">
                  Books & Collections
                </h2>
                <p className="text-xs text-muted-foreground text-left">
                  Long-form documentation and notebooks
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/books')}
                className="text-xs"
              >
                View All
              </Button>
            </div>
            <BookDashboard books={booksData.slice(0, 6)} onDelete={(id) => deleteBook.mutate(id)} />
          </div>

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
          tasks={tasks}
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
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onEditTask={handleEditTask}
        />
      )}

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        defaultDate={taskDefaultDate}
        onSave={handleSaveTask}
        isSaving={createTask.isPending || updateTask.isPending}
      />

      {!isMobile && (
        <>
          <TimesheetSidePanel />
          <NotesSidePanel />
        </>
      )}
    </div>
  )
}
