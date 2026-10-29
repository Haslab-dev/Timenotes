import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { DashboardStats } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface ProjectHoursChartProps {
  stats: DashboardStats
}

export function ProjectHoursChart({ stats }: ProjectHoursChartProps) {
  if (stats.topProjects.length === 0) {
    return (
      <Card className="text-left">
        <CardHeader>
          <CardTitle>Top Projects This Month</CardTitle>
          <CardDescription>Distribution of tracked hours by project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
            No time entries recorded this month
          </div>
        </CardContent>
      </Card>
    )
  }

  const data = stats.topProjects.map(({ project, totalHours }) => ({
    name: project.name,
    hours: Number(totalHours.toFixed(1)),
    color: project.color,
  }))

  return (
    <Card className="text-left">
      <CardHeader className="pb-4">
        <CardTitle>Top Projects This Month</CardTitle>
        <CardDescription>Tracked time allocation across active projects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 36, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                width={90}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <Tooltip
                cursor={{ fill: 'var(--secondary)', opacity: 0.4 }}
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value}h`, 'Hours']}
              />
              <Bar dataKey="hours" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={22}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || 'var(--primary)'} />
                ))}
                <LabelList
                  dataKey="hours"
                  position="right"
                  fill="var(--foreground)"
                  fontSize={11}
                  formatter={(v: any) => `${v}h`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 pt-3 border-t border-border">
          {stats.topProjects.map(({ project, totalHours, percentage }) => (
            <div key={project.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="font-medium text-foreground truncate">{project.name}</span>
              </div>
              <div className="text-muted-foreground font-mono tabular-nums shrink-0">
                {totalHours.toFixed(1)}h{' '}
                <span className="text-muted-foreground/70 ml-1">({percentage.toFixed(0)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
