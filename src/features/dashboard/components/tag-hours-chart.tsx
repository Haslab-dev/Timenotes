import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts'
import type { DashboardStats } from '@/lib/types'

interface TagHoursChartProps {
  stats: DashboardStats
}

export function TagHoursChart({ stats }: TagHoursChartProps) {
  if (stats.hoursPerTag.length === 0) {
    return (
      <div className="border rounded-xl p-4 sm:p-6 bg-card shadow-sm text-left">
        <h3 className="font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">
          Hours by Tag
        </h3>
        <div className="text-center py-8 text-muted-foreground">No tagged time entries yet</div>
      </div>
    )
  }

  const data = stats.hoursPerTag.map(({ tag, hours }) => ({
    tag,
    hours: Number(hours.toFixed(1)),
  }))

  return (
    <div className="border rounded-xl p-4 sm:p-6 bg-card shadow-sm text-left transition-transform hover:scale-[1.01]">
      <h3 className="font-semibold mb-6 text-muted-foreground uppercase tracking-wider text-xs">
        Hours by Tag
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--muted-foreground)/0.2)"
            />
            <XAxis dataKey="tag" axisLine={false} tickLine={false} dy={10} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => [`${value}h`, 'Hours']} />
            <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32}>
              <LabelList
                dataKey="hours"
                position="top"
                fill="currentColor"
                fontSize={12}
                formatter={(v: any) => `${v}h`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
