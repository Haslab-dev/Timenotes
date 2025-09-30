import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { DashboardStats } from '@/lib/types'

interface ProjectHoursChartProps {
  stats: DashboardStats
}

export function ProjectHoursChart({ stats }: ProjectHoursChartProps) {
  if (stats.topProjects.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Top Projects This Month</h3>
        <div className="text-center py-8 text-muted-foreground">
          No time entries yet
        </div>
      </div>
    )
  }

  const data = stats.topProjects.map(({ project, totalHours }) => ({
    name: project.name,
    hours: totalHours,
    color: project.color,
  }))

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Top Projects This Month</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => {
                const { name, value } = props
                return `${name}: ${Number(value).toFixed(1)}h`
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="hours"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`${Number(value).toFixed(1)}h`, 'Hours']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {stats.topProjects.map(({ project, totalHours, percentage }) => (
          <div key={project.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span>{project.name}</span>
            </div>
            <div className="text-muted-foreground">
              {totalHours.toFixed(1)}h ({percentage.toFixed(1)}%)
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
