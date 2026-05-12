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
    <div className="relative overflow-hidden group bg-card border rounded-[32px] p-6 sm:p-8 shadow-xl shadow-primary/5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 text-left">
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mb-16" />

      <div className="relative z-10">
        <h3 className="font-black mb-8 text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Hours by Tag
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="color-mix(in srgb, var(--muted-foreground), transparent 80%)"
              />
              <XAxis dataKey="tag" axisLine={false} tickLine={false} dy={10} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip formatter={(value: number) => [`${value}h`, 'Hours']} />
              <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32}>
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
    </div>
  )
}
