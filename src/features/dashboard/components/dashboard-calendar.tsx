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
import {
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconNotes,
  IconChecklist,
  IconPlus,
  IconX,
  IconCircleCheckFilled,
  IconCircle,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { TimeEntry, Note, Task } from '@/lib/types'
import { PRIORITY_COLORS } from '@/lib/types'

interface DashboardCalendarProps {
  timeEntries: TimeEntry[]
  notes: Note[]
  tasks: Task[]
  onSelectEntry: (entry: TimeEntry) => void
  onSelectNote: (note: Note) => void
  onAddTask: (date?: Date) => void
  onToggleTask: (task: Task) => void
  onEditTask: (task: Task) => void
}

export function DashboardCalendar({
  timeEntries,
  notes,
  tasks,
  onSelectEntry,
  onSelectNote,
  onAddTask,
  onToggleTask,
  onEditTask,
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

  const activityByDate = useMemo(() => {
    const map: Record<string, { entries: TimeEntry[]; notes: Note[]; tasks: Task[] }> = {}

    timeEntries.forEach((entry) => {
      const dateStr = format(entry.startTime, 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = { entries: [], notes: [], tasks: [] }
      map[dateStr].entries.push(entry)
    })

    notes.forEach((note) => {
      const dateStr = format(note.createdAt, 'yyyy-MM-dd')
      if (!map[dateStr]) map[dateStr] = { entries: [], notes: [], tasks: [] }
      map[dateStr].notes.push(note)
    })

    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateStr = format(task.dueDate, 'yyyy-MM-dd')
        if (!map[dateStr]) map[dateStr] = { entries: [], notes: [], tasks: [] }
        map[dateStr].tasks.push(task)
      }
    })

    return map
  }, [timeEntries, notes, tasks])

  const selectedDayActivity = useMemo(() => {
    if (!selectedDate) return { entries: [], notes: [], tasks: [] }
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return activityByDate[dateStr] || { entries: [], notes: [], tasks: [] }
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
      color: projects.find((p) => p.id === projectId)?.color || '#64748b',
    }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in min-h-[600px]">
      <div className="flex-1 bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
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
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
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
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
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
            const dayActivity = activityByDate[dateStr] || { entries: [], notes: [], tasks: [] }
            const projectSummaries = getProjectSummariesForDay(dayActivity.entries)
            const dayNotes = dayActivity.notes
            const dayTasks = dayActivity.tasks
            const activeTasks = dayTasks.filter(
              (t) => t.status !== 'completed' && t.status !== 'cancelled'
            )
            const completedTasks = dayTasks.filter((t) => t.status === 'completed')

            const totalDisplayCount =
              projectSummaries.length +
              (dayNotes.length > 0 ? 1 : 0) +
              (activeTasks.length > 0 ? 1 : 0)
            const displaySummaries = projectSummaries.slice(0, 1)
            const remainingCount =
              totalDisplayCount -
              displaySummaries.length -
              (dayNotes.length > 0 ? 1 : 0) -
              (activeTasks.length > 0 ? 1 : 0)

            return (
              <div
                key={day.toString()}
                className={[
                  'min-h-[96px] border-r border-b border-border relative cursor-pointer transition-colors last:border-r-0',
                  !isCurrentMonth ? 'bg-muted/20 opacity-45' : 'bg-card',
                  isSelected
                    ? 'bg-primary/[0.04] ring-1 ring-inset ring-primary/30 z-10'
                    : 'hover:bg-secondary/30',
                ].join(' ')}
                onClick={() => setSelectedDate(day)}
              >
                <div className="p-1.5 flex flex-col h-full text-left">
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
                        className="flex items-center justify-between px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary text-primary-foreground truncate"
                      >
                        <span className="truncate">{summary.projectName}</span>
                        <span className="ml-1 opacity-80 shrink-0">
                          {formatDuration(summary.duration)}
                        </span>
                      </div>
                    ))}

                    {dayNotes.length > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] font-medium truncate">
                        <IconNotes className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">
                          {dayNotes.length} Note{dayNotes.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {activeTasks.length > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-tertiary text-tertiary-foreground text-[10px] font-medium truncate">
                        <IconChecklist className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">
                          {activeTasks.length} Task{activeTasks.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {completedTasks.length > 0 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        {completedTasks.length} done
                      </div>
                    )}

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

      <div
        className={[
          'lg:w-80 border border-border rounded-xl bg-card shadow-xs flex flex-col transition-all overflow-hidden',
          selectedDate
            ? 'opacity-100 translate-x-0'
            : 'opacity-0 translate-x-4 pointer-events-none',
        ].join(' ')}
      >
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-semibold text-sm text-foreground">
              {selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''}
            </h4>
            <p className="text-xs text-muted-foreground">Day Summary</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md"
            onClick={() => setSelectedDate(null)}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Tasks Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IconChecklist className="h-3.5 w-3.5" />
                Tasks
              </h5>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onAddTask(selectedDate || undefined)}
              >
                <IconPlus className="h-3 w-3 mr-0.5" />
                Add
              </Button>
            </div>

            {selectedDayActivity.tasks.length > 0 ? (
              <div className="space-y-1.5">
                {selectedDayActivity.tasks.map((task) => {
                  const isCompleted = task.status === 'completed' || task.status === 'cancelled'
                  const isOverdue =
                    !isCompleted &&
                    task.dueDate &&
                    task.dueDate < new Date(new Date().toDateString())

                  return (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-lg border transition-colors text-left group ${
                        isCompleted
                          ? 'bg-muted/30 border-border/50 opacity-60'
                          : isOverdue
                            ? 'bg-destructive/5 border-destructive/30'
                            : 'bg-background border-border hover:bg-secondary/30'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleTask(task)
                          }}
                          className="mt-0.5 shrink-0 cursor-pointer"
                        >
                          {isCompleted ? (
                            <IconCircleCheckFilled className="h-4 w-4 text-primary" />
                          ) : (
                            <IconCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => onEditTask(task)}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                            />
                            <span
                              className={`text-xs font-medium truncate ${
                                isCompleted
                                  ? 'line-through text-muted-foreground'
                                  : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          {task.dueTime && (
                            <span className="text-[11px] text-muted-foreground ml-3">
                              {task.dueTime}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-left">No tasks scheduled</p>
            )}
          </div>

          {/* Time Entries Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IconClock className="h-3.5 w-3.5" />
                Time Entries
              </h5>
              <Badge variant="secondary" className="text-[11px]">
                {formatDuration(
                  selectedDayActivity.entries.reduce((acc, e) => acc + (Number(e.duration) || 0), 0)
                )}
              </Badge>
            </div>

            {selectedDayActivity.entries.length > 0 ? (
              <div className="space-y-1.5">
                {selectedDayActivity.entries.map((entry) => {
                  const project = projects.find((p) => p.id === entry.projectId)
                  return (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-lg border border-border bg-background hover:bg-secondary/30 transition-colors cursor-pointer text-left"
                      onClick={() => onSelectEntry(entry)}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: project?.color || '#64748b' }}
                        />
                        <span className="text-xs font-medium truncate flex-1">
                          {project?.name || 'No Project'}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground tabular-nums">
                          {formatDuration(entry.duration)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {entry.description?.replace(/<[^>]*>/g, ' ').trim() || 'No description'}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-left">No time tracked</p>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <IconNotes className="h-3.5 w-3.5" />
              Notes
            </h5>

            {selectedDayActivity.notes.length > 0 ? (
              <div className="space-y-1.5">
                {selectedDayActivity.notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-lg border border-border bg-tertiary/40 hover:bg-tertiary/70 transition-colors cursor-pointer text-left"
                    onClick={() => onSelectNote(note)}
                  >
                    <h6 className="text-xs font-medium line-clamp-1 mb-1 text-foreground">
                      {note.title}
                    </h6>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {format(note.createdAt, 'HH:mm')}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        Open
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-left">No notes created</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
