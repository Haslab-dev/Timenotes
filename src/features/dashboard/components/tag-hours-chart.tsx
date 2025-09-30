import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { DashboardStats } from '@/lib/types'

interface TagHoursChartProps {
  stats: DashboardStats
}

export function TagHoursChart({ stats }: TagHoursChartProps) {
  if (stats.hoursPerTag.length === 0) {
    return (
      <div className="border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Hours by Tag</h3>
        <div className="text-center py-8 text-muted-foreground">
          No tagged time entries yet
        </div>
      </div>
    )
  }

  const data = stats.hoursPerTag.map(({ tag, hours }) => ({
    tag,
    hours: Number(hours.toFixed(1)),
  }))

  return (
    <div className="border rounded-lg p-6">
      <h3 className="font-semibold mb-4">Hours by Tag</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="tag" />
            <YAxis />
            <Tooltip formatter={(value: number) => [`${value}h`, 'Hours']} />
            <Bar dataKey="hours" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
