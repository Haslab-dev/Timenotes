import { LayoutDashboard, FolderOpen, Clock, FileText, Play, Plus, Search } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useActiveTimer } from '@/features/timesheet/hooks/use-active-timer'
import { useTimeEntriesByDateRange } from '@/features/timesheet/hooks/use-timesheet'
import { useMemo } from 'react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/timesheet', label: 'Timesheet', icon: Clock },
  { to: '/notes', label: 'Notes', icon: FileText },
]

export function Sidebar() {
  const { startTimer, activeTimer } = useActiveTimer()
  const navigate = useNavigate()

  // Get today's bounds
  const todayRange = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }, [])

  const { data: todayEntries = [] } = useTimeEntriesByDateRange(todayRange)

  const todaySummary = useMemo(() => {
    // Filter to ensure we only count entries that are actually "Today" in local time
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

    // Overflow protection: realistic daily limit (24 hours = 1440 mins)
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

  return (
    <aside className="hidden md:flex w-48 flex-col gap-6 shrink-0">
      <nav className="space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:scale-[1.01] hover:shadow-sm',
              ].join(' ')
            }
          >
            <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="rounded-xl bg-card border p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Today
          </h3>
          <div className="flex flex-col gap-1">
            <span className="text-xl font-bold text-foreground">{todaySummary.tracked}</span>
            <span className="text-xs text-muted-foreground">
              {todaySummary.projects} projects tracked
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
          Quick Actions
        </h3>
        {!activeTimer && (
          <Button
            variant="outline"
            className="w-full justify-start text-sm h-9 border-primary/20 hover:bg-primary/5"
            onClick={() => startTimer(undefined, '')}
          >
            <Play className="mr-2 h-4 w-4 text-primary" />
            Start timer
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start text-sm h-9"
          onClick={() => navigate('/notes/new')}
        >
          <Plus className="mr-2 h-4 w-4" />
          New note
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm h-9 text-muted-foreground"
          onClick={() => {
            const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
            document.dispatchEvent(e)
          }}
        >
          <Search className="mr-2 h-4 w-4" />
          Search (Cmd+K)
        </Button>
      </div>
    </aside>
  )
}
