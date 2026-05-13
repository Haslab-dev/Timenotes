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
import { ChevronLeft, ChevronRight, Clock, FileText, ListTodo, Plus, X } from 'lucide-react'
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
      color: projects.find((p) => p.id === projectId)?.color || '#6b7280',
    }))
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500 min-h-[600px]">
      <div className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
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
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
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
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

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

        <div className="grid grid-cols-7 flex-1">
          {calendarDays.map((day) => {
            const isSelected = selectedDate && isSameDay(day, selectedDate)
            const isCurrentMonth = isSameMonth(day, monthStart)
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayActivity = activityByDate[dateStr] || { entries: [], notes: [], tasks: [] }
            const projectSummaries = getProjectSummariesForDay(dayActivity.entries)
            const dayNotes = dayActivity.notes
            const dayTasks = dayActivity.tasks
            const activeTasks = dayTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
            const completedTasks = dayTasks.filter((t) => t.status === 'completed')

            const totalDisplayCount = projectSummaries.length + (dayNotes.length > 0 ? 1 : 0) + (activeTasks.length > 0 ? 1 : 0)
            const displaySummaries = projectSummaries.slice(0, 1)
            const remainingCount = totalDisplayCount - displaySummaries.length - (dayNotes.length > 0 ? 1 : 0) - (activeTasks.length > 0 ? 1 : 0)

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

                    {activeTasks.length > 0 && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-amber-500 text-[9px] font-bold text-white truncate shadow-sm">
                        <ListTodo className="h-2.5 w-2.5" />
                        <span className="truncate">
                          {activeTasks.length} Task{activeTasks.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}

                    {completedTasks.length > 0 && (
                      <div className="text-[8px] text-muted-foreground/60 px-1">
                        {completedTasks.length} done
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
          {/* Tasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <ListTodo className="h-3 w-3" />
                Tasks
              </h5>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 rounded-md text-[9px] font-bold"
                onClick={() => onAddTask(selectedDate || undefined)}
              >
                <Plus className="h-3 w-3 mr-0.5" />
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
                      className={`p-2 rounded-lg border transition-colors text-left group ${
                        isCompleted
                          ? 'bg-muted/20 border-muted/30 opacity-60'
                          : isOverdue
                            ? 'bg-red-500/5 border-red-200 dark:border-red-900/30'
                            : 'bg-background/50 border-border hover:bg-background'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onToggleTask(task) }}
                          className="mt-0.5 shrink-0"
                        >
                          {isCompleted ? (
                            <svg className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="h-3.5 w-3.5 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onEditTask(task)}>
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                            />
                            <span
                              className={`text-[10px] font-semibold truncate ${
                                isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>
                          {task.dueTime && (
                            <span className="text-[8px] text-muted-foreground ml-[18px]">
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
              <p className="text-[10px] text-muted-foreground italic text-left">No tasks scheduled</p>
            )}
          </div>

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
