import { Clock, FolderOpen, FileText, Calendar } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Hours This Week',
      value: `${stats.totalHoursThisWeek.toFixed(1)}h`,
      icon: Clock,
      description: 'Time tracked this week'
    },
    {
      title: 'Hours This Month',
      value: `${stats.totalHoursThisMonth.toFixed(1)}h`,
      icon: Calendar,
      description: 'Time tracked this month'
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toString(),
      icon: FolderOpen,
      description: 'Total projects'
    },
    {
      title: 'Total Notes',
      value: stats.totalNotes.toString(),
      icon: FileText,
      description: 'Ideas and notes saved'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div key={card.title} className="border rounded-lg p-6 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {card.title}
              </p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
