import { LayoutDashboard, FolderOpen, Clock, FileText, LogOut, User, Menu, X } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import { useLogout } from '@/features/auth/hooks/use-auth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderOpen },
  { to: '/timesheet', label: 'Timesheet', icon: Clock },
  { to: '/notes', label: 'Notes', icon: FileText },
]

export function MainLayout() {
  const { user } = useAuthContext()
  const logoutMutation = useLogout()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      logoutMutation.mutate()
    }
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-4">
          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold">TimeNote</h1>
                <p className="hidden sm:block text-sm text-muted-foreground">Track time, manage projects, capture ideas</p>
              </div>
            </div>
          </div>
          
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
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={closeMobileMenu} />
          <nav className="fixed left-0 top-[73px] z-50 h-full w-64 bg-background border-r p-4 space-y-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  ].join(' ')
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            
            {/* Mobile User Info */}
            <div className="border-t pt-4 mt-6">
              <div className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </div>
            </div>
          </nav>
        </div>
      )}

      <div className="mx-auto flex max-w-6xl gap-8 px-4 sm:px-6 py-6 sm:py-10">
        {/* Desktop Navigation */}
        <nav className="hidden md:block w-52 space-y-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                ].join(' ')
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 space-y-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
