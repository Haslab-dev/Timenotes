import type { ReactNode } from 'react'

type SummaryCardProps = {
  title: string
  value: ReactNode
  description?: string
}

export function SummaryCard({ title, value, description }: SummaryCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <div className="mt-4 text-3xl font-semibold">{value}</div>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}
