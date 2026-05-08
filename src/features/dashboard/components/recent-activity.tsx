import { Clock, FileText, Activity } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { isToday, isYesterday, format } from 'date-fns'

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
      return format(date, 'HH:mm')
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
    <div className="border rounded-xl p-4 sm:p-6 bg-card shadow-sm text-left col-span-full">
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-lg">Activity Feed</h3>
      </div>

      {timelineItems.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {timelineItems.map((item) => {
            const isTime = item.type === 'time'
            const data = item.data
            const project = data.projectId ? getProjectById(data.projectId) : null
            const Icon = isTime ? Clock : FileText

            return (
              <div
                key={item.id}
                className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card bg-muted shadow shrink-0 md:order-1 md:group-odd:-ml-5 md:group-even:-mr-5 z-10 transition-transform group-hover:scale-110">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div
                  className={[
                    'w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border bg-card/50 hover:bg-card shadow-sm hover:shadow-md transition-all cursor-pointer',
                    expandedId === item.id ? 'ring-2 ring-primary/20 bg-card' : '',
                  ].join(' ')}
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
                      {formatTemporalDate(item.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      {project && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: project.color }}
                        >
                          {project.name}
                        </span>
                      )}
                      {expandedId === item.id ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </div>
                  </div>

                  <div className="text-sm font-medium text-foreground">
                    {isTime ? (
                      <>
                        Logged{' '}
                        <span className="font-bold text-primary">
                          {formatDuration(data.duration)}
                        </span>
                        {project ? ` to ${project.name}` : ''}
                      </>
                    ) : (
                      <>
                        Added note <span className="font-bold text-primary">"{data.title}"</span>
                        {project ? ` to ${project.name}` : ''}
                      </>
                    )}
                  </div>

                  {expandedId === item.id ? (
                    <div className="mt-4 pt-3 border-t border-muted/50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                      {(data.description || data.content) && (
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-snug italic">
                          {isTime ? data.description : data.content}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-4">
                        {data.tags && data.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {data.tags.map((tag: string) => (
                              <div
                                key={tag}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold text-muted-foreground"
                              >
                                <Tag className="h-2.5 w-2.5" />
                                {tag}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            className="text-xs font-bold text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              isTime ? onEditEntry(data) : onViewNote(data)
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    (data.description || data.content) && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        {isTime ? data.description : data.content}
                      </p>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
