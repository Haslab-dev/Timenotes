import { StatsCards } from '../components/stats-cards'
import { ProjectHoursChart } from '../components/project-hours-chart'
import { TagHoursChart } from '../components/tag-hours-chart'
import { RecentActivity } from '../components/recent-activity'
import { useTimeNoteDashboard } from '../hooks/use-timenote-dashboard'

export function TimeNoteDashboardPage() {
  const { data: stats, isLoading, error } = useTimeNoteDashboard()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to TimeNote</p>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to TimeNote</p>
        </div>
        <div className="text-center py-8 text-destructive">
          Error loading dashboard
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Track your time, manage projects, and capture ideas
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <ProjectHoursChart stats={stats} />
        <TagHoursChart stats={stats} />
      </div>

      {/* Recent Activity */}
      <RecentActivity stats={stats} />
    </div>
  )
}
