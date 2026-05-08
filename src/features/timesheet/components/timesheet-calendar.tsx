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
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      color: projects.find((p) => p.id === projectId)?.color || '#6b7280',
    }))
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Google Style Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-medium text-foreground min-w-[150px]">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-md text-xs font-medium"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted/5 border-b">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-bold text-muted-foreground tracking-widest border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
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
                  'min-h-[100px] sm:min-h-[140px] border-r border-b relative cursor-pointer transition-colors hover:bg-muted/10 last:border-r-0',
                  !isCurrentMonth ? 'bg-muted/5 opacity-40' : 'bg-card',
                  isSelected ? 'bg-primary/[0.03]' : '',
                ].join(' ')}
                onClick={() => setSelectedDate(day)}
              >
                <div className="p-2 flex flex-col h-full">
                  <div className="flex justify-center mb-2">
                    <span
                      className={[
                        'flex items-center justify-center w-7 h-7 text-xs font-medium rounded-full',
                        isToday(day)
                          ? 'bg-primary text-primary-foreground font-bold shadow-md'
                          : isSelected
                            ? 'bg-secondary text-foreground font-bold'
                            : 'text-muted-foreground hover:bg-muted/50',
                      ].join(' ')}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Project Pills (Google Style) */}
                  <div className="space-y-1 overflow-hidden">
                    {displaySummaries.map((summary) => (
                      <div
                        key={summary.projectId}
                        className="group flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-bold text-white truncate shadow-sm transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: summary.color }}
                        title={`${summary.projectName}: ${formatDuration(summary.duration)}`}
                      >
                        <span className="truncate">{summary.projectName}</span>
                        <span className="ml-1 opacity-80 shrink-0">
                          {formatDuration(summary.duration)}
                        </span>
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="text-[10px] font-bold text-muted-foreground px-1.5 py-0.5">
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

      {/* Selected Day Details (Below Calendar) */}
      {selectedDate && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg">{format(selectedDate, 'EEEE, MMMM d')}</h4>
                <p className="text-xs text-muted-foreground font-medium">Daily Timeline</p>
              </div>
            </div>
            {selectedDayEntries.length > 0 && (
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-primary">
                  {formatDuration(
                    selectedDayEntries.reduce((acc, e) => acc + (Number(e.duration) || 0), 0)
                  )}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Total Tracked
                </span>
              </div>
            )}
          </div>

          {selectedDayEntries.length > 0 ? (
            <CompactTimesheetTable
              timeEntries={selectedDayEntries}
              onEdit={onSelectEntry}
              onDelete={() => {}}
            />
          ) : (
            <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-muted/50">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                <Clock className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground font-medium italic">
                Nothing tracked on this day
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
