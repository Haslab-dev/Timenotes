import { IconClock, IconCalendarStats, IconCalendarMonth, IconFolder } from '@tabler/icons-react'
import type { DashboardStats } from '@/lib/types'
import { formatDuration } from '@/lib/utils'
import { Card } from '@/components/ui/card'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Today',
      value: formatDuration(Math.round(stats.totalHoursToday * 60)),
      icon: IconClock,
      description: `${stats.activeProjectsToday} active ${stats.activeProjectsToday === 1 ? 'project' : 'projects'}`,
      tone: 'bg-primary/10 text-primary',
    },
    {
      title: 'This Week',
      value: formatDuration(Math.round(stats.totalHoursThisWeek * 60)),
      icon: IconCalendarStats,
      description: '7-day cumulative',
      tone: 'bg-secondary text-secondary-foreground',
    },
    {
      title: 'This Month',
      value: formatDuration(Math.round(stats.totalHoursThisMonth * 60)),
      icon: IconCalendarMonth,
      description: 'Monthly total',
      tone: 'bg-secondary text-secondary-foreground',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: IconFolder,
      description: 'Workspace total',
      tone: 'bg-tertiary text-tertiary-foreground',
    },
  ]

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className="p-4 sm:p-5 text-left transition-colors hover:border-primary/30"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <div className={`flex h-7 w-7 items-center justify-center rounded-md ${card.tone}`}>
                  <Icon className="h-4 w-4" stroke={1.75} />
                </div>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground tabular-nums">
                  {card.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
