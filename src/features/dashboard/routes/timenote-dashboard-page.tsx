import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { FileText, LayoutList, Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react'
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
  const { activeTimer } = useActiveTimer()
  const { elapsedSeconds } = useTimerTicker()
  const { data: projects = [] } = useProjects()
  const [view, setView] = useState<'overview' | 'calendar'>('overview')
  const [isStartingFocus, setIsStartingFocus] = useState(false)
  const { startTimer } = useActiveTimer()

  const [focusDetails, setFocusDetails] = useState({
    projectId: '',
    description: '',
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

  // Focus Mode
  if (activeTimer) {
    const activeProject = projects.find((p) => p.id === activeTimer.projectId)
    const hours = Math.floor(elapsedSeconds / 3600)
    const minutes = Math.floor((elapsedSeconds % 3600) / 60)
    const seconds = elapsedSeconds % 60

    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center space-y-8 max-w-xl w-full p-8 sm:p-12 rounded-[40px] bg-card border shadow-2xl shadow-primary/5 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-[0.2em] uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Focus Mode Active
            </div>
          </div>

          <div className="text-8xl sm:text-9xl font-mono font-bold tracking-tighter tabular-nums text-foreground drop-shadow-sm select-none">
            {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
            {minutes.toString().padStart(2, '0')}
            <span className="text-muted-foreground/30 ml-2">
              :{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-col items-center gap-4">
            {activeProject ? (
              <div className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-muted/30 border border-muted-foreground/10">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: activeProject.color }}
                />
                <span className="text-xl font-bold tracking-tight">{activeProject.name}</span>
              </div>
            ) : (
              <p className="text-muted-foreground text-xl font-medium italic opacity-50">
                No project selected
              </p>
            )}

            {activeTimer.description && (
              <p className="text-lg text-muted-foreground font-medium max-w-md">
                "{activeTimer.description}"
              </p>
            )}
          </div>

          <div className="pt-10 border-t border-muted/50 space-y-6">
            <div className="flex items-center justify-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Session Notes & Tasks
              </h3>
            </div>

            <div
              className="w-full min-h-[160px] p-6 rounded-[32px] bg-muted/20 border-2 border-dashed border-muted-foreground/10 text-left text-muted-foreground text-sm cursor-text hover:bg-muted/40 hover:border-primary/20 transition-all group flex flex-col items-center justify-center space-y-3"
              onClick={() => {
                navigate('/notes/new', {
                  state: {
                    projectId: activeTimer.projectId,
                    timeEntryId: activeTimer.id,
                    title: `Notes: ${activeTimer.description || activeProject?.name || 'Focus Session'}`,
                  },
                })
              }}
            >
              <div className="p-4 rounded-full bg-background shadow-sm group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-primary/40" />
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground/70">Click to capture ideas or tasks</p>
                <p className="text-[10px] font-medium text-muted-foreground mt-1">
                  Notes will be linked to this session
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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
                Prepare Focus Session
              </div>
              <h2 className="text-4xl font-black tracking-tight">Ready to focus?</h2>
            </div>

            <div className="space-y-6 text-left">
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

              <Button
                className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all"
                onClick={() => {
                  startTimer(focusDetails.projectId || undefined, focusDetails.description)
                  setIsStartingFocus(false)
                }}
              >
                Start Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-4 px-0.5">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5 text-left flex-1">
            <h1 className="text-3xl font-black tracking-tight">Dashboard</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wider">
              Overview & Tracking
            </p>
          </div>

          {isMobile && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsStartingFocus(true)}
              className="h-9 px-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95"
            >
              <Clock className="mr-2 h-3.5 w-3.5" />
              Start Focus Session
            </Button>
          )}
        </div>

        <div className="flex bg-muted/50 p-1 rounded-xl border shadow-inner w-full sm:w-auto overflow-hidden">
          <Button
            variant={view === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className={[
              'h-8 flex-1 sm:flex-none px-4 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer',
              view === 'overview' ? 'shadow-md' : 'text-muted-foreground hover:bg-muted',
            ].join(' ')}
            onClick={() => setView('overview')}
          >
            <LayoutList className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Overview View</span>
            <span className="sm:hidden ml-1.5">Overview</span>
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className={[
              'h-8 flex-1 sm:flex-none px-4 rounded-lg text-[10px] font-bold transition-all duration-200 cursor-pointer',
              view === 'calendar' ? 'shadow-md' : 'text-muted-foreground hover:bg-muted',
            ].join(' ')}
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Monthly Calendar</span>
            <span className="sm:hidden ml-1.5">Calendar</span>
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
