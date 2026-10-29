import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns'
import { IconChevronLeft, IconChevronRight, IconClock } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { TimeEntry } from '@/lib/types'
import { CompactTimesheetTable } from './compact-timesheet-table'

interface TimesheetCalendarProps {
  timeEntries: TimeEntry[]
  onSelectEntry: (entry: TimeEntry) => void
}

export function TimesheetCalendar({ timeEntries, onSelectEntry }: TimesheetCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const { data: projects = [] } = useProjects()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  })

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const entriesByDate = useMemo(() => {
    const map: Record<string, TimeEntry[]> = {}
    timeEntries.forEach((entry) => {
      const dateStr = format(entry.startTime, 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = []
      map[dateStr].push(entry)
    })
    return map
  }, [timeEntries])

  const selectedDayEntries = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return entriesByDate[dateStr] || []
  }, [selectedDate, entriesByDate])

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getProjectSummariesForDay = (dayEntries: TimeEntry[]) => {
    const summaries: Record<string, number> = {}
    dayEntries.forEach((entry) => {
      if (entry.projectId) {
        summaries[entry.projectId] =
          (summaries[entry.projectId] || 0) + (Number(entry.duration) || 0)
      }
    })
    return Object.entries(summaries).map(([projectId, duration]) => ({
      projectId,
      duration,
      projectName: projects.find((p) => p.id === projectId)?.name || 'Unknown',
      color: projects.find((p) => p.id === projectId)?.color || '#64748b',
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-foreground min-w-[140px] text-left">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center bg-secondary/50 rounded-md p-0.5 border border-border">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={prevMonth}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 rounded-sm text-xs font-medium"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={nextMonth}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>Today</span>
          </div>
        </div>

        <div className="grid grid-cols-7 bg-secondary/30 border-b border-border">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-semibold text-muted-foreground tracking-wider border-r border-border last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayEntries = entriesByDate[dateStr] || []
            const projectSummaries = getProjectSummariesForDay(dayEntries)
            const displaySummaries = projectSummaries.slice(0, 3)
            const remainingCount = projectSummaries.length - displaySummaries.length

            return (
              <div
                key={day.toString()}
                className={[
                  'min-h-[96px] sm:min-h-[120px] border-r border-b border-border relative cursor-pointer transition-colors hover:bg-secondary/30 last:border-r-0',
                  !isCurrentMonth ? 'bg-muted/20 opacity-45' : 'bg-card',
                  isSelected ? 'bg-primary/[0.04] ring-1 ring-inset ring-primary/30' : '',
                ].join(' ')}
                onClick={() => setSelectedDate(day)}
              >
                <div className="p-1.5 flex flex-col h-full">
                  <div className="flex justify-start mb-1.5">
                    <span
                      className={[
                        'flex items-center justify-center w-6 h-6 text-xs font-medium rounded-md',
                        isToday(day)
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : isSelected
                            ? 'bg-secondary text-secondary-foreground font-semibold'
                            : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1 overflow-hidden">
                    {displaySummaries.map((summary) => (
                      <div
                        key={summary.projectId}
                        className="flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate"
                        style={{ backgroundColor: summary.color }}
                        title={`${summary.projectName}: ${formatDuration(summary.duration)}`}
                      >
                        <span className="truncate">{summary.projectName}</span>
                        <span className="ml-1 opacity-85 shrink-0">
                          {formatDuration(summary.duration)}
                        </span>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="text-[10px] font-medium text-muted-foreground px-1">
                        + {remainingCount} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDate && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2.5 text-left">
              <div className="p-2 rounded-lg bg-primary/10">
                <IconClock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-foreground">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </h4>
                <p className="text-xs text-muted-foreground">Daily Timeline</p>
              </div>
            </div>
            {selectedDayEntries.length > 0 && (
              <Badge variant="tertiary" className="text-xs font-mono tabular-nums">
                Total:{' '}
                {formatDuration(
                  selectedDayEntries.reduce((acc, e) => acc + (Number(e.duration) || 0), 0)
                )}
              </Badge>
            )}
          </div>

          {selectedDayEntries.length > 0 ? (
            <CompactTimesheetTable
              timeEntries={selectedDayEntries}
              onEdit={onSelectEntry}
              onDelete={() => {}}
            />
          ) : (
            <Card className="text-center py-12 border-dashed">
              <IconClock className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Nothing tracked on this day</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
