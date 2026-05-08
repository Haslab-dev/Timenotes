import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { FileText, LayoutList, Calendar as CalendarIcon } from 'lucide-react'
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
        <div className="text-center space-y-8 max-w-lg w-full p-6 sm:p-10 rounded-3xl bg-card border shadow-2xl shadow-primary/10 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-primary/20" />

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold tracking-widest uppercase">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Focus Mode Active
            </div>
          </div>

          <div className="text-7xl sm:text-8xl font-mono font-bold tracking-tighter tabular-nums text-foreground drop-shadow-sm">
            {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}
            <span className="text-muted-foreground/30 text-5xl sm:text-6xl">
              :{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          {activeProject ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 text-2xl font-bold">
                <div
                  className="w-4 h-4 rounded-full ring-4 ring-white shadow-sm"
                  style={{ backgroundColor: activeProject.color }}
                />
                {activeProject.name}
              </div>
              {activeTimer.description && (
                <p className="text-lg text-muted-foreground font-medium">
                  {activeTimer.description}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-xl">No project selected</p>
          )}

          <div className="pt-8 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Session Notes & Tasks
              </h3>
            </div>
            <div
              className="w-full min-h-[140px] p-5 rounded-2xl bg-muted/20 border-2 border-dashed border-muted-foreground/20 text-left text-muted-foreground text-sm cursor-text hover:bg-muted/40 hover:border-primary/30 transition-all group"
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
              <div className="flex flex-col items-center justify-center h-full py-4 text-center space-y-2">
                <div className="p-3 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors">
                  <FileText className="h-6 w-6 text-primary/40 group-hover:text-primary/60" />
                </div>
                <p>Click to capture ideas, tasks, or thoughts for this session...</p>
                <p className="text-[10px] font-bold text-primary/40">
                  These notes will be linked to this time entry
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-0.5">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Good to see you! Here's what's happening today.
          </p>
        </div>
        <div className="flex bg-muted p-1 rounded-lg self-start border shadow-sm">
          <Button
            variant={view === 'overview' ? 'default' : 'ghost'}
            size="sm"
            className={[
              'h-8 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer',
              view === 'overview' ? 'shadow-sm' : 'hover:bg-muted-foreground/10',
            ].join(' ')}
            onClick={() => setView('overview')}
          >
            <LayoutList className="h-3.5 w-3.5 mr-1.5" />
            Overview
          </Button>
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className={[
              'h-8 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer',
              view === 'calendar' ? 'shadow-sm' : 'hover:bg-muted-foreground/10',
            ].join(' ')}
            onClick={() => setView('calendar')}
          >
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            Calendar View
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
