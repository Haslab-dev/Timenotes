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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

interface TagHoursChartProps {
  stats: DashboardStats
}

export function TagHoursChart({ stats }: TagHoursChartProps) {
  if (stats.hoursPerTag.length === 0) {
    return (
      <Card className="text-left">
        <CardHeader>
          <CardTitle>Hours by Tag</CardTitle>
          <CardDescription>Time breakdown by activity tag</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
            No tagged time entries yet
          </div>
        </CardContent>
      </Card>
    )
  }

  const data = stats.hoursPerTag.map(({ tag, hours }) => ({
    tag,
    hours: Number(hours.toFixed(1)),
  }))

  return (
    <Card className="text-left">
      <CardHeader className="pb-4">
        <CardTitle>Hours by Tag</CardTitle>
        <CardDescription>Time categorized by entry tags</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="tag"
                axisLine={false}
                tickLine={false}
                dy={8}
                tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
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
                formatter={(value: number) => [`${value}h`, 'Hours']}
              />
              <Bar dataKey="hours" fill="var(--chart-2)" radius={[4, 4, 0, 0]} barSize={28}>
                <LabelList
                  dataKey="hours"
                  position="top"
                  fill="var(--foreground)"
                  fontSize={11}
                  formatter={(v: any) => `${v}h`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
