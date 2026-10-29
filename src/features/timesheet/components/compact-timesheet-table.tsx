import { format } from 'date-fns'
import {
  IconNotes,
  IconPencil,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconTag,
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { TimeEntry } from '@/lib/types'
import { LinkedNotes } from './linked-notes'
import { LinkifiedText } from '@/components/ui/linkified-text'

interface CompactTimesheetTableProps {
  timeEntries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
  onDelete: (id: string) => void
}

export function CompactTimesheetTable({
  timeEntries,
  onEdit,
  onDelete,
}: CompactTimesheetTableProps) {
  const { data: projects } = useProjects()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return 'No Project'
    return projects?.find((p) => p.id === projectId)?.name || 'Unknown Project'
  }

  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return '#64748b'
    return projects?.find((p) => p.id === projectId)?.color || '#64748b'
  }

  const formatDuration = (minutes: any) => {
    const minsNum = Number(minutes) || 0
    const hours = Math.floor(minsNum / 60)
    const mins = minsNum % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm')
  }

  const formatDateString = (date: Date) => {
    return format(date, 'MMM dd, yyyy')
  }

  if (timeEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-sm font-medium text-foreground mb-1">No time entries found</div>
          <div className="text-xs">Start tracking your time to see entries here</div>
        </div>
      </div>
    )
  }

  const groupedEntries = timeEntries.reduce(
    (acc, entry) => {
      const dateStr = formatDateString(entry.startTime)
      if (!acc[dateStr]) {
        acc[dateStr] = { entries: [], totalDuration: 0 }
      }
      acc[dateStr].entries.push(entry)
      const duration = Number(entry.duration) || 0
      acc[dateStr].totalDuration += duration
      return acc
    },
    {} as Record<string, { entries: TimeEntry[]; totalDuration: number }>
  )

  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const maxDayDuration = 720

  return (
    <div className="space-y-6">
      {sortedDates.map((dateStr) => {
        const group = groupedEntries[dateStr]
        return (
          <div key={dateStr} className="space-y-2">
            <div className="flex items-center justify-between px-1 pb-1.5 border-b border-border">
              <h3 className="font-semibold text-sm text-foreground">{dateStr}</h3>
              <Badge variant="secondary" className="text-xs font-mono tabular-nums">
                {formatDuration(group.totalDuration)}
              </Badge>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shadow-2xs">
              {group.entries
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                .map((entry) => {
                  const widthPercent = Math.min(
                    100,
                    Math.max(6, (entry.duration / maxDayDuration) * 100)
                  )
                  const projectColor = getProjectColor(entry.projectId)
                  const isExpanded = expandedId === entry.id

                  return (
                    <div key={entry.id} className="flex flex-col">
                      <div
                        className={[
                          'group relative flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors',
                          isExpanded ? 'bg-secondary/40' : 'hover:bg-secondary/30',
                        ].join(' ')}
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <div className="shrink-0">
                          {isExpanded ? (
                            <IconChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <IconChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>

                        <div className="w-12 shrink-0 text-xs font-mono text-muted-foreground tabular-nums">
                          {formatTime(entry.startTime)}
                        </div>

                        <div className="flex-1 flex items-center gap-3 min-w-0">
                          {/* Visual Timeline Bar */}
                          <div
                            className="h-2 rounded-full opacity-85 shrink-0 hidden sm:block"
                            style={{
                              width: `${widthPercent}%`,
                              maxWidth: '180px',
                              minWidth: '10px',
                              backgroundColor: projectColor,
                            }}
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5 flex-1 min-w-0 text-left">
                            <span className="font-medium text-xs text-foreground truncate shrink-0 flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full sm:hidden"
                                style={{ backgroundColor: projectColor }}
                              />
                              {getProjectName(entry.projectId)}
                            </span>
                            {!isExpanded && entry.description && (
                              <span className="text-xs text-muted-foreground truncate">
                                {entry.description.replace(/<[^>]*>/g, ' ').trim()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <span className="text-xs font-semibold font-mono tabular-nums text-foreground">
                            {formatDuration(entry.duration)}
                          </span>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(entry)
                              }}
                            >
                              <IconPencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(entry.id)
                              }}
                            >
                              <IconTrash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-3.5 pt-2 bg-secondary/20 border-t border-border/60 text-left animate-in fade-in duration-150">
                          <div className="space-y-3">
                            {entry.description ? (
                              <div className="space-y-1">
                                <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                                  <IconNotes className="h-3 w-3" />
                                  Description
                                </div>
                                {entry.description.trim().startsWith('<') ? (
                                  <div
                                    className="text-xs text-foreground leading-relaxed tiptap prose prose-sm max-w-none dark:prose-invert"
                                    dangerouslySetInnerHTML={{ __html: entry.description }}
                                  />
                                ) : (
                                  <LinkifiedText
                                    text={entry.description}
                                    className="text-xs text-foreground whitespace-pre-wrap leading-relaxed"
                                  />
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">
                                No description provided
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-6">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                  <IconClock className="h-3 w-3" />
                                  Time Range
                                </div>
                                <div className="text-xs font-mono tabular-nums">
                                  {format(entry.startTime, 'HH:mm')} —{' '}
                                  {entry.endTime ? format(entry.endTime, 'HH:mm') : 'Ongoing'}
                                </div>
                              </div>

                              {entry.tags.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                    <IconTag className="h-3 w-3" />
                                    Tags
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {entry.tags.map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-[11px]">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <LinkedNotes timeEntryId={entry.id} />

                            <div className="pt-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => onEdit(entry)}
                              >
                                <IconPencil className="h-3 w-3 mr-1.5" />
                                Edit Entry
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
