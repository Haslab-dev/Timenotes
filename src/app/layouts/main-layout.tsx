import { LayoutDashboard, FolderOpen, Clock, FileText, LogOut, User } from 'lucide-react'
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

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/timesheet', label: 'Timesheet', icon: Clock },
  { to: '/notes', label: 'Notes', icon: FileText },
]

export function MainLayout() {
  const { user } = useAuthContext()
  const logoutMutation = useLogout()
  const navigate = useNavigate()
  const { startTimer, activeTimer } = useActiveTimer()

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return
      }

      // Space -> Start/Stop Timer
      if (e.code === 'Space') {
        e.preventDefault()
        if (!activeTimer) {
          startTimer(undefined, '')
        }
      }

      // N -> New Note
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <header className="border-b bg-card/90 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                TimeNotes
              </h1>
              <p className="hidden sm:block text-xs text-muted-foreground font-medium">
                Track time, manage projects, capture ideas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop User Menu */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{user?.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline ml-2">
                  {logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
                </span>
              </Button>
            </div>

            {/* Mobile User Menu */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <RunningTimerBar />

      <div className="mx-auto flex max-w-7xl gap-4 md:gap-8 px-2 sm:px-6 py-3 sm:py-8 pb-20 md:pb-8">
        <Sidebar />

        <main className="flex-1 space-y-6 sm:space-y-8 min-w-0">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-md border-t flex items-center justify-around px-2 py-3 pb-6 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex flex-col items-center justify-center gap-1 w-16 p-1 rounded-xl transition-all',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <CommandPalette />
      <NotesSidePanel />
      <TimesheetSidePanel />
      <ScrollToTop />
    </div>
  )
}
