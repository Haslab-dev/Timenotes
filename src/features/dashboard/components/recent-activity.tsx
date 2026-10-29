import {
  IconClock,
  IconNotes,
  IconActivity,
  IconChevronDown,
  IconChevronRight,
  IconTag,
} from '@tabler/icons-react'
import type { DashboardStats } from '@/lib/types'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useMemo, useState } from 'react'
import { isToday, isYesterday, format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface RecentActivityProps {
  stats: DashboardStats
  onViewNote: (note: any) => void
  onEditEntry: (entry: any) => void
}

export function RecentActivity({ stats, onViewNote, onEditEntry }: RecentActivityProps) {
  const { data: projects = [] } = useProjects()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatTemporalDate = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, 'HH:mm')}`
    } else if (isYesterday(date)) {
      return 'Yesterday'
    } else {
      return format(date, 'MMM dd')
    }
  }

  const timelineItems = useMemo(() => {
    const items: Array<{ id: string; type: 'time' | 'note'; timestamp: Date; data: any }> = []

    stats.recentTimeEntries.forEach((entry) => {
      items.push({
        id: `time-${entry.id}`,
        type: 'time',
        timestamp: new Date(entry.startTime),
        data: entry,
      })
    })

    stats.recentNotes.forEach((note) => {
      items.push({
        id: `note-${note.id}`,
        type: 'note',
        timestamp: new Date(note.updatedAt),
        data: note,
      })
    })

    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
  }, [stats])

  return (
    <Card className="text-left col-span-full">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconActivity className="h-4 w-4 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="mt-1">
              Latest logged time entries and workspace notes
            </CardDescription>
          </div>
          <Badge variant="secondary">{timelineItems.length} events</Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {timelineItems.length === 0 ? (
          <div className="text-center py-12">
            <IconActivity className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-muted-foreground text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {timelineItems.map((item) => {
              const isTime = item.type === 'time'
              const data = item.data
              const project = data.projectId ? getProjectById(data.projectId) : null
              const Icon = isTime ? IconClock : IconNotes
              const isExpanded = expandedId === item.id

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        isTime
                          ? 'bg-primary/10 text-primary'
                          : 'bg-tertiary text-tertiary-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" stroke={1.75} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-foreground">
                          {isTime ? (
                            <>
                              Logged{' '}
                              <span className="font-semibold text-primary tabular-nums">
                                {formatDuration(data.duration)}
                              </span>
                            </>
                          ) : (
                            <>
                              Note{' '}
                              <span className="font-semibold text-foreground">"{data.title}"</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {project && (
                            <Badge variant="secondary" className="gap-1.5 font-medium">
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: project.color }}
                              />
                              {project.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatTemporalDate(item.timestamp)}
                          </span>
                          {isExpanded ? (
                            <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {!isExpanded && (data.description || data.content) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {(isTime ? data.description : data.content)
                            ?.replace(/<[^>]*>/g, ' ')
                            .trim()}
                        </p>
                      )}

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border space-y-3 animate-in fade-in duration-150">
                          {(data.description || data.content) && (
                            <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {(isTime ? data.description : data.content)
                                ?.replace(/<[^>]*>/g, ' ')
                                .trim()}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            {data.tags && data.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {data.tags.map((tag: string) => (
                                  <Badge key={tag} variant="outline" className="text-[11px]">
                                    <IconTag className="h-2.5 w-2.5 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <div />
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                isTime ? onEditEntry(data) : onViewNote(data)
                              }}
                            >
                              {isTime ? 'Edit Entry' : 'Open Note'}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
