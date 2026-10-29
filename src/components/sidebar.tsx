import {
  IconLayoutDashboard,
  IconChecklist,
  IconFolder,
  IconClock,
  IconNotes,
  IconBook,
  IconPlayerPlay,
  IconPlus,
} from '@tabler/icons-react'
import { NavLink, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useActiveTimer } from '@/features/timesheet/hooks/use-active-timer'
import { useTimeEntriesByDateRange } from '@/features/timesheet/hooks/use-timesheet'
import { useMemo } from 'react'

const workspaceNavItems = [
  { to: '/', label: 'Dashboard', icon: IconLayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: IconChecklist },
  { to: '/projects', label: 'Projects', icon: IconFolder },
  { to: '/timesheet', label: 'Timesheet', icon: IconClock },
]

const knowledgeNavItems = [
  { to: '/notes', label: 'Notes', icon: IconNotes },
  { to: '/books', label: 'Books', icon: IconBook },
]

export function Sidebar() {
  const { startTimer, activeTimer } = useActiveTimer()
  const navigate = useNavigate()

  const todayRange = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [])

  const { data: todayEntries = [] } = useTimeEntriesByDateRange(todayRange)

  const todaySummary = useMemo(() => {
    const actualTodayEntries = todayEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      const today = new Date()
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      )
    })

    let totalMinutes = actualTodayEntries.reduce(
      (acc, entry) => acc + (Number(entry.duration) || 0),
      0
    )

    if (totalMinutes > 1440) {
      totalMinutes = 1440
    }

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.floor(totalMinutes % 60)
    const projectCount = new Set(actualTodayEntries.map((e) => e.projectId)).size

    return {
      tracked: `${hours}h ${minutes.toString().padStart(2, '0')}m`,
      projects: projectCount,
    }
  }, [todayEntries])

  const renderNavLink = ({
    to,
    label,
    icon: Icon,
  }: {
    to: string
    label: string
    icon: typeof IconLayoutDashboard
  }) => (
    <NavLink
      key={to}
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        [
          'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground font-medium shadow-2xs'
            : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 shrink-0" stroke={1.75} />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar shrink-0 sticky top-0 h-screen">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-border flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-2xs">
          <IconClock className="h-4 w-4" stroke={2} />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
            TimeNotes
          </span>
          <span className="text-[11px] text-muted-foreground mt-1 leading-none">
            Time & Knowledge
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-left">
            Workspace
          </div>
          <nav className="space-y-0.5">{workspaceNavItems.map(renderNavLink)}</nav>
        </div>

        <div className="space-y-1">
          <div className="px-3 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-left">
            Knowledge
          </div>
          <nav className="space-y-0.5">{knowledgeNavItems.map(renderNavLink)}</nav>
        </div>

        {/* Quick Actions */}
        <div className="space-y-1.5 pt-2 border-t border-border">
          <div className="px-3 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-left">
            Quick Actions
          </div>
          {!activeTimer && (
            <Button
              variant="tertiary"
              size="sm"
              className="w-full justify-start h-8 text-xs"
              onClick={() => startTimer(undefined, '')}
            >
              <IconPlayerPlay className="h-3.5 w-3.5 mr-2" />
              Start Focus Timer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/notes/new')}
          >
            <IconPlus className="h-3.5 w-3.5 mr-2" />
            New Note
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/timesheet/new')}
          >
            <IconClock className="h-3.5 w-3.5 mr-2" />
            Log Time Entry
          </Button>
        </div>
      </div>

      {/* Today's Tracked Footer Card */}
      <div className="p-3 border-t border-border">
        <div className="rounded-lg bg-secondary/60 border border-border/60 p-3.5 text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Tracked Today
            </span>
            <span className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <div className="text-lg font-semibold tabular-nums text-foreground">
            {todaySummary.tracked}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {todaySummary.projects} active {todaySummary.projects === 1 ? 'project' : 'projects'}
          </div>
        </div>
      </div>
    </aside>
  )
}
