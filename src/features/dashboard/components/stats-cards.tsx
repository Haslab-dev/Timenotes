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
      description: `${stats.activeProjectsToday} projects`,
      accent: 'bg-blue-500',
    },
    {
      title: 'This Week',
      value: formatDuration(Math.round(stats.totalHoursThisWeek * 60)),
      icon: Calendar,
      description: 'Weekly summary',
      accent: 'bg-emerald-500',
    },
    {
      title: 'This Month',
      value: formatDuration(Math.round(stats.totalHoursThisMonth * 60)),
      icon: Clock,
      description: 'Monthly total',
      accent: 'bg-purple-500',
    },
    {
      title: 'Active',
      value: stats.activeProjects.toString(),
      icon: FolderOpen,
      description: 'Total projects',
      accent: 'bg-orange-500',
    },
  ]

  return (
    <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.title}
            className="group relative bg-card border rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left overflow-hidden"
          >
            {/* Accent Bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.accent} opacity-40 group-hover:opacity-100 transition-opacity`}
            />

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  {card.title}
                </span>
                <Icon className="h-4 w-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black tracking-tighter text-foreground tabular-nums">
                  {card.value}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-60">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
