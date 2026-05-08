import { format } from 'date-fns'
import { FileText } from 'lucide-react'
import { Edit2, Trash2, ChevronDown, ChevronRight, Clock, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { TimeEntry } from '@/lib/types'
import { LinkedNotes } from './linked-notes'

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
    if (!projectId) return '#6b7280'
    return projects?.find((p) => p.id === projectId)?.color || '#6b7280'
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
          <div className="text-lg mb-2">No time entries found</div>
          <div className="text-sm">Start tracking your time to see entries here</div>
        </div>
      </div>
    )
  }

  // Group by date
  const groupedEntries = timeEntries.reduce(
    (acc, entry) => {
      const dateStr = formatDateString(entry.startTime)
      if (!acc[dateStr]) {
        acc[dateStr] = { entries: [], totalDuration: 0 }
      }
      acc[dateStr].entries.push(entry)
      // Safely parse duration to number
      const duration = Number(entry.duration) || 0
      acc[dateStr].totalDuration += duration
      return acc
    },
    {} as Record<string, { entries: TimeEntry[]; totalDuration: number }>
  )

  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Max duration in a day to scale the timeline blocks relative to 12 hours (720 mins) or max day duration
  const maxDayDuration = 720

  return (
    <div className="space-y-8">
      {sortedDates.map((dateStr) => {
        const group = groupedEntries[dateStr]
        return (
          <div key={dateStr} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-lg">{dateStr}</h3>
              <div className="text-sm font-medium text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
                Total: {formatDuration(group.totalDuration)}
              </div>
            </div>

            <div className="space-y-2">
              {group.entries
                .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
                .map((entry) => {
                  const widthPercent = Math.min(
                    100,
                    Math.max(5, (entry.duration / maxDayDuration) * 100)
                  )
                  const projectColor = getProjectColor(entry.projectId)
                  const isExpanded = expandedId === entry.id

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col rounded-lg border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div
                        className={[
                          'group relative flex items-center gap-4 p-3 sm:p-4 cursor-pointer transition-colors',
                          isExpanded ? 'bg-accent/20' : 'hover:bg-accent/30',
                        ].join(' ')}
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      >
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="w-14 flex-shrink-0 text-sm font-mono text-muted-foreground">
                          {formatTime(entry.startTime)}
                        </div>

                        <div className="flex-1 flex items-center gap-4 min-w-0">
                          {/* Visual Timeline Block */}
                          <div
                            className="h-6 rounded-md opacity-80 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:block relative overflow-hidden"
                            style={{
                              width: `${widthPercent}%`,
                              maxWidth: '280px',
                              minWidth: '8px',
                              backgroundColor: projectColor,
                            }}
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 flex-1 min-w-0">
                            <span
                              className="font-bold text-sm truncate shrink-0"
                              style={{ color: projectColor }}
                            >
                              {getProjectName(entry.projectId)}
                            </span>
                            {!isExpanded && entry.description && (
                              <span className="text-sm text-muted-foreground truncate italic">
                                — {entry.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="text-sm font-bold tabular-nums">
                            {formatDuration(entry.duration)}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(entry)
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(entry.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-4 pb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="space-y-2.5 pt-2 border-t border-muted/50">
                            {entry.description ? (
                              <div className="space-y-0.5">
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                  <FileText className="h-3 w-3" />
                                  Description
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-tight">
                                  {entry.description.replace(/\n\s*\n/g, '\n')}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">
                                No description provided
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                  <Clock className="h-3 w-3" />
                                  Time Range
                                </div>
                                <div className="text-xs font-medium">
                                  {format(entry.startTime, 'HH:mm')} —{' '}
                                  {entry.endTime ? format(entry.endTime, 'HH:mm') : 'Ongoing'}
                                </div>
                              </div>

                              {entry.tags.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <Tag className="h-3 w-3" />
                                    Tags
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {entry.tags.map((tag) => (
                                      <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="text-[10px] h-5 px-2 bg-muted/50 border-none font-semibold"
                                      >
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <LinkedNotes timeEntryId={entry.id} />

                            <div className="pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                onClick={() => onEdit(entry)}
                              >
                                <Edit2 className="h-3 w-3 mr-2" />
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
