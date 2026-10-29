import {
  IconLayoutDashboard,
  IconChecklist,
  IconFolder,
  IconClock,
  IconNotes,
  IconLogout,
  IconUser,
  IconSearch,
  IconPlayerPlay,
  IconPlus,
} from '@tabler/icons-react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import { useLogout } from '@/features/auth/hooks/use-auth'
import { RunningTimerBar } from '@/components/running-timer-bar'
import { CommandPalette } from '@/components/command-palette'
import { ScrollToTop } from '@/components/scroll-to-top'
import { Sidebar } from '@/components/sidebar'
import { useActiveTimer } from '@/features/timesheet/hooks/use-active-timer'
import { NotesSidePanel } from '@/features/notes/components/notes-side-panel'
import { TimesheetSidePanel } from '@/features/timesheet/components/timesheet-side-panel'
import { NotificationManager } from '@/features/tasks/components/notification-manager'
import { NotificationToastContainer } from '@/components/notification-toast'

const mobileNavItems = [
  { to: '/', label: 'Overview', icon: IconLayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: IconChecklist },
  { to: '/projects', label: 'Projects', icon: IconFolder },
  { to: '/timesheet', label: 'Time', icon: IconClock },
  { to: '/notes', label: 'Notes', icon: IconNotes },
]

export function MainLayout() {
  const { user } = useAuthContext()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const { startTimer, activeTimer } = useActiveTimer()

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (!activeTimer) {
          startTimer(undefined, '')
        }
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        navigate('/notes/new')
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [navigate, startTimer, activeTimer])

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logoutMutation.mutate()
    }
  }

  const triggerCommandPalette = () => {
    const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true })
    document.dispatchEvent(e)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="h-14 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-30">
          <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-8 gap-4">
            {/* Mobile Brand */}
            <div className="flex md:hidden items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <IconClock className="h-4 w-4" stroke={2} />
              </div>
              <span className="text-sm font-semibold tracking-tight text-foreground">
                TimeNotes
              </span>
            </div>

            {/* Desktop Search Trigger */}
            <div className="hidden md:flex items-center flex-1 max-w-sm">
              <button
                type="button"
                onClick={triggerCommandPalette}
                className="flex items-center justify-between w-full h-8 px-3 rounded-md border border-border bg-background/70 hover:bg-secondary/60 text-xs text-muted-foreground transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <IconSearch className="h-3.5 w-3.5" />
                  <span>Search or jump to...</span>
                </span>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-secondary text-secondary-foreground rounded border border-border">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right Toolbar */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={triggerCommandPalette}
                title="Search"
              >
                <IconSearch className="h-4 w-4" />
              </Button>

              {!activeTimer && (
                <Button
                  variant="tertiary"
                  size="sm"
                  className="hidden sm:inline-flex h-8 text-xs"
                  onClick={() => startTimer(undefined, '')}
                >
                  <IconPlayerPlay className="h-3.5 w-3.5" />
                  Start Timer
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex h-8 text-xs"
                onClick={() => navigate('/notes/new')}
              >
                <IconPlus className="h-3.5 w-3.5" />
                Note
              </Button>

              <div className="h-4 w-px bg-border mx-1 hidden sm:block" />

              <div className="flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-md bg-secondary/60 text-secondary-foreground text-xs font-medium">
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Sign out"
                >
                  <IconLogout className="h-4 w-4" />
                  <span className="hidden lg:inline ml-1.5">
                    {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <RunningTimerBar />

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8 pb-24 md:pb-10 min-w-0">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-2 py-2 pb-5">
        {mobileNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 w-16 py-1.5 rounded-md transition-colors',
                isActive
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" stroke={1.75} />
            <span className="text-[10px]">{label}</span>
          </NavLink>
        ))}
      </nav>

      <CommandPalette />
      <NotesSidePanel />
      <TimesheetSidePanel />
      <NotificationManager />
      <NotificationToastContainer />
      <ScrollToTop />
    </div>
  )
}
