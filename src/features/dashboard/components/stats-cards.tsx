import { Clock, FolderOpen, Calendar } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'
import { formatDuration } from '@/lib/utils'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Today',
      value: formatDuration(Math.round(stats.totalHoursToday * 60)),
      icon: Clock,
      description: `${stats.activeProjectsToday} project${stats.activeProjectsToday === 1 ? '' : 's'} tracked today`,
    },
    {
      title: 'Hours This Week',
      value: formatDuration(Math.round(stats.totalHoursThisWeek * 60)),
      icon: Clock,
      description: 'Time tracked this week',
    },
    {
      title: 'Hours This Month',
      value: formatDuration(Math.round(stats.totalHoursThisMonth * 60)),
      icon: Calendar,
      description: 'Time tracked this month',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: FolderOpen,
      description: 'Total projects',
    },
  ]

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        const isPrimary = index === 0
        return (
          <div
            key={card.title}
            className={`border rounded-xl p-4 sm:p-6 space-y-2 shadow-sm text-left transition-transform hover:scale-[1.02] ${isPrimary ? 'bg-primary text-primary-foreground border-primary/20 md:col-span-2 lg:col-span-1' : 'bg-card'}`}
          >
            <div className="flex items-center justify-between">
              <p
                className={`text-sm font-medium ${isPrimary ? 'text-primary-foreground/70 uppercase tracking-wider text-xs' : 'text-muted-foreground'}`}
              >
                {card.title}
              </p>
              <Icon
                className={`h-4 w-4 ${isPrimary ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}
              />
            </div>
            <div>
              <div
                className={`font-bold ${isPrimary ? 'text-4xl tracking-tight text-primary-foreground' : 'text-2xl'}`}
              >
                {card.value}
              </div>
              <p
                className={`text-xs mt-1 ${isPrimary ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}
              >
                {card.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
