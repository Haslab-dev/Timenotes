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
import { ChevronLeft, ChevronRight, Clock, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { TimeEntry, Note } from '@/lib/types'
// import { CompactTimesheetTable } from '@/features/timesheet/components/compact-timesheet-table'

interface DashboardCalendarProps {
  timeEntries: TimeEntry[]
  notes: Note[]
  onSelectEntry: (entry: TimeEntry) => void
  onSelectNote: (note: Note) => void
}

export function DashboardCalendar({
  timeEntries,
  notes,
  onSelectEntry,
  onSelectNote,
}: DashboardCalendarProps) {
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

  const activityByDate = useMemo(() => {
    const map: Record<string, { entries: TimeEntry[]; notes: Note[] }> = {}

    timeEntries.forEach((entry) => {
      const dateStr = format(entry.startTime, 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = { entries: [], notes: [] }
      map[dateStr].entries.push(entry)
    })

    notes.forEach((note) => {
      const dateStr = format(note.createdAt, 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = { entries: [], notes: [] }
      map[dateStr].notes.push(note)
    })

    return map
  }, [timeEntries, notes])

  const selectedDayActivity = useMemo(() => {
    if (!selectedDate) return { entries: [], notes: [] }
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return activityByDate[dateStr] || { entries: [], notes: [] }
  }, [selectedDate, activityByDate])

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
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 min-h-[600px]">
      <div className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-medium text-foreground min-w-[150px] text-left">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md cursor-pointer"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 rounded-md text-xs font-bold cursor-pointer"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-md cursor-pointer"
                onClick={nextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grid Header */}
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

        {/* Grid Cells */}
        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayActivity = activityByDate[dateStr] || { entries: [], notes: [] }
            const projectSummaries = getProjectSummariesForDay(dayActivity.entries)
            const dayNotes = dayActivity.notes

            const totalDisplayCount = projectSummaries.length + (dayNotes.length > 0 ? 1 : 0)
            const displaySummaries = projectSummaries.slice(0, 2)
            const remainingCount =
              totalDisplayCount - displaySummaries.length - (dayNotes.length > 0 ? 1 : 0)

            return (
              <div
                key={day.toString()}
                className={[
                  'min-h-[100px] border-r border-b relative cursor-pointer transition-colors last:border-r-0',
                  !isCurrentMonth ? 'bg-muted/5 opacity-40' : 'bg-card',
                  isSelected
                    ? 'bg-primary/[0.05] ring-2 ring-inset ring-primary/20 z-10'
                    : 'hover:bg-muted/10',
                ].join(' ')}
                onClick={() => setSelectedDate(day)}
              >
                <div className="p-1.5 flex flex-col h-full text-left">
                  <div className="flex justify-start mb-1.5">
                    <span
                      className={[
                        'flex items-center justify-center w-6 h-6 text-[11px] font-bold rounded-full',
                        isToday(day)
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : isSelected
                            ? 'bg-primary/20 text-primary'
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
                        className="flex items-center justify-between px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold text-white truncate shadow-sm"
                        style={{ backgroundColor: summary.color }}
                      >
                        <span className="truncate">{summary.projectName}</span>
                        <span className="ml-1 opacity-80 shrink-0">
                          {formatDuration(summary.duration)}
                        </span>
                      </div>
                    ))}

                    {dayNotes.length > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-indigo-500 text-[9px] font-bold text-white truncate shadow-sm">
                        <FileText className="h-2.5 w-2.5" />
                        <span className="truncate">
                          {dayNotes.length} Note{dayNotes.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {remainingCount > 0 && (
                      <div className="text-[9px] font-bold text-muted-foreground px-1 py-0.5">
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

      {/* Side Panel */}
      <div
        className={[
          'lg:w-80 border rounded-2xl bg-card shadow-sm flex flex-col transition-all overflow-hidden',
          selectedDate
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-4 pointer-events-none',
        ].join(' ')}
      >
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-bold text-sm">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''}
            </h4>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Day Summary
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={() => setSelectedDate(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Time Entries Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Time Entries
              </h5>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {formatDuration(
                  selectedDayActivity.entries.reduce((acc, e) => acc + (Number(e.duration) || 0), 0)
                )}
              </span>
            </div>

            {selectedDayActivity.entries.length > 0 ? (
              <div className="space-y-2">
                {selectedDayActivity.entries.map((entry) => {
                  const project = projects.find((p) => p.id === entry.projectId)
                  return (
                    <div
                      key={entry.id}
                      className="p-2 rounded-lg border bg-background/50 hover:bg-background transition-colors cursor-pointer text-left group"
                      onClick={() => onSelectEntry(entry)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project?.color || '#ccc' }}
                        />
                        <span className="text-[11px] font-bold truncate flex-1">
                          {project?.name || 'No Project'}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatDuration(entry.duration)}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-1 italic">
                        {entry.description || 'No description'}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic text-left">No time tracked</p>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="h-3 w-3" />
              Notes
            </h5>

            {selectedDayActivity.notes.length > 0 ? (
              <div className="space-y-2">
                {selectedDayActivity.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2 rounded-lg border border-indigo-100 dark:border-indigo-900/30 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.08] transition-colors cursor-pointer text-left"
                    onClick={() => onSelectNote(note)}
                  >
                    <h6 className="text-[11px] font-bold line-clamp-1 mb-1">{note.title}</h6>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-muted-foreground">
                        {format(note.createdAt, 'HH:mm')}
                      </span>
                      <Badge variant="outline" className="text-[8px] h-3.5 px-1 font-bold">
                        Details
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground italic text-left">No notes created</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
