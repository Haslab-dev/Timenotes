import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { SummaryCard } from '../components/summary-card'
import { useDashboardSummary } from '../hooks/use-dashboard-summary'

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useDashboardSummary()

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back 👋</h2>
          <p className="text-sm text-muted-foreground">
            Here is a quick snapshot of your product workstream.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefetching || isLoading ? 'animate-spin' : ''}`}
          />
          {isRefetching || isLoading ? 'Refreshing' : 'Refresh data'}
        </Button>
      </div>

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          We could not load your dashboard data. Try again shortly.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active projects"
          value={isLoading ? '—' : (data?.activeProjects ?? '—')}
        />
        <SummaryCard
          title="Hours this week"
          value={isLoading ? '—' : Math.round(data?.totalHoursThisWeek ?? 0) + 'h'}
        />
        <SummaryCard
          title="Hours this month"
          value={isLoading ? '—' : Math.round(data?.totalHoursThisMonth ?? 0) + 'h'}
        />
        <SummaryCard
          title="Today’s focus"
          value={<span className="text-base font-medium leading-6">{data?.totalNotes ?? '—'}</span>}
          description="Automated based on your upcoming agenda."
        />
      </div>
    </section>
  )
}
