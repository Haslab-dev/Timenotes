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

interface ProjectHoursChartProps {
  stats: DashboardStats
}

export function ProjectHoursChart({ stats }: ProjectHoursChartProps) {
  if (stats.topProjects.length === 0) {
    return (
      <div className="border rounded-xl p-4 sm:p-6 bg-card shadow-sm text-left">
        <h3 className="font-semibold mb-4 text-zinc-400 uppercase tracking-wider text-xs">
          Top Projects This Month
        </h3>
        <div className="text-center py-8 text-muted-foreground">No time entries yet</div>
      </div>
    )
  }

  const data = stats.topProjects.map(({ project, totalHours }) => ({
    name: project.name,
    hours: Number(totalHours.toFixed(1)),
    color: project.color,
  }))

  return (
    <div className="relative overflow-hidden group bg-card border rounded-[32px] p-6 sm:p-8 shadow-xl shadow-primary/5 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 text-left">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

      <div className="relative z-10">
        <h3 className="font-black mb-8 text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
          Top Projects This Month
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="color-mix(in srgb, var(--muted-foreground), transparent 80%)"
              />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(value) => [`${value}h`, 'Hours']} />
              <Bar dataKey="hours" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
                <LabelList
                  dataKey="hours"
                  position="right"
                  fill="currentColor"
                  fontSize={12}
                  formatter={(v: any) => `${v}h`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 space-y-3">
          {stats.topProjects.map(({ project, totalHours, percentage }) => (
            <div key={project.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-md" style={{ backgroundColor: project.color }} />
                <span className="font-medium text-foreground">{project.name}</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                {totalHours.toFixed(1)}h{' '}
                <span className="opacity-50 ml-1">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
