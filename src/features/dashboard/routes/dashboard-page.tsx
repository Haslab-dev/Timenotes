import { IconRefresh } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { SummaryCard } from '../components/summary-card'
import { useDashboardSummary } from '../hooks/use-dashboard-summary'

export function DashboardPage() {
  const { data, isLoading, isError, refetch, isRefetching } = useDashboardSummary()

  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Snapshot of your workspace activity and time allocation."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            <IconRefresh
              className={`mr-1.5 h-4 w-4 ${isRefetching || isLoading ? 'animate-spin' : ''}`}
            />
            {isRefetching || isLoading ? 'Refreshing' : 'Refresh'}
          </Button>
        }
      />

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
