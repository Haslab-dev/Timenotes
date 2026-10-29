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
  IconPlus,
  IconAlertCircle,
  IconCalendarMonth,
  IconList,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskList } from './task-list'
import type { Task } from '@/lib/types'
import { PRIORITY_COLORS } from '@/lib/types'

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

interface TaskPlannerCalendarProps {
  tasks: Task[]
  onAddTask: (date?: Date) => void
  onEditTask: (task: Task) => void
  onToggleTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onNavigateTask?: (taskId: string) => void
}

export function TaskPlannerCalendar({
  tasks,
  onAddTask,
  onEditTask,
  onToggleTask,
  onDeleteTask,
}: TaskPlannerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateStr = format(task.dueDate, 'yyyy-MM-dd')
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push(task)
      } else {
        if (!map['__no_date']) map['__no_date'] = []
        map['__no_date'].push(task)
      }
    })
    return map
  }, [tasks])

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayTasks = tasksByDate[selectedDateStr] || []
  const unassignedTasks = tasksByDate['__no_date'] || []

  const sortedDayTasks = useMemo(() => {
    const sorted = [...selectedDayTasks]
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    sorted.sort((a, b) => {
      const pA = priorityOrder[a.priority]
      const pB = priorityOrder[b.priority]
      if (pA !== pB) return pA - pB
      if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime)
      if (a.dueTime) return -1
      if (b.dueTime) return 1
      return 0
    })
    return sorted
  }, [selectedDayTasks])

  const noDateTasks = useMemo(() => {
    const sorted = [...unassignedTasks]
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    sorted.sort((a, b) => {
      const pA = priorityOrder[a.priority]
      const pB = priorityOrder[b.priority]
      return pA - pB
    })
    return sorted
  }, [unassignedTasks])

  const getTasksForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return tasksByDate[dateStr] || []
  }

  const getOverdueCountForDay = (day: Date): number => {
    const dayTasks = getTasksForDay(day)
    const today = new Date(new Date().toDateString())
    return dayTasks.filter(
      (t) => t.status !== 'completed' && t.status !== 'cancelled' && day < today
    ).length
  }

  const sortedTasksByDate = useMemo(() => {
    const grouped = new Map<string, Task[]>()
    const dated = tasks.filter((t) => t.dueDate)
    const noDate = tasks.filter((t) => !t.dueDate)

    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const sortFn = (a: Task, b: Task) => {
      const pA = priorityOrder[a.priority]
      const pB = priorityOrder[b.priority]
      if (pA !== pB) return pA - pB
      if (a.dueTime && b.dueTime) return a.dueTime.localeCompare(b.dueTime)
      if (a.dueTime) return -1
      if (b.dueTime) return 1
      return 0
    }

    dated.sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        const dateCmp = a.dueDate.getTime() - b.dueDate.getTime()
        if (dateCmp !== 0) return dateCmp
      }
      return sortFn(a, b)
    })

    dated.forEach((task) => {
      if (task.dueDate) {
        const key = format(task.dueDate, 'yyyy-MM-dd')
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(task)
      }
    })

    if (noDate.length > 0) {
      noDate.sort(sortFn)
      grouped.set('__no_date', noDate)
    }

    return grouped
  }, [tasks])

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
      <div className="flex-1 bg-card border border-border rounded-xl shadow-xs overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
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

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex bg-secondary/50 p-0.5 rounded-md border border-border">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={() => setViewMode('calendar')}
              >
                <IconCalendarMonth className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7 rounded-sm"
                onClick={() => setViewMode('list')}
              >
                <IconList className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button size="sm" className="h-8 text-xs" onClick={() => onAddTask(selectedDate)}>
              <IconPlus className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <>
            <div className="grid grid-cols-7 bg-secondary/30 border-b border-border">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-semibold text-muted-foreground tracking-wider border-r border-border last:border-r-0"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 flex-1">
              {calendarDays.map((day) => {
                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, monthStart)
                const dayTasks = getTasksForDay(day)
                const activeTasks = dayTasks.filter(
                  (t) => t.status !== 'completed' && t.status !== 'cancelled'
                )
                const completedTasks = dayTasks.filter((t) => t.status === 'completed')
                const overdueCount = getOverdueCountForDay(day)
                const hasTasks = dayTasks.length > 0

                return (
                  <div
                    key={day.toString()}
                    className={[
                      'min-h-[84px] sm:min-h-[100px] border-r border-b border-border relative cursor-pointer transition-colors last:border-r-0',
                      !isCurrentMonth ? 'bg-muted/20 opacity-45' : 'bg-card',
                      isSelected
                        ? 'bg-primary/[0.04] ring-1 ring-inset ring-primary/30 z-10'
                        : 'hover:bg-secondary/30',
                    ].join(' ')}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="p-1.5 flex flex-col h-full text-left">
                      <div className="flex justify-between items-start mb-1">
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
                        {overdueCount > 0 && (
                          <IconAlertCircle className="h-3.5 w-3.5 text-destructive" />
                        )}
                      </div>

                      {hasTasks && (
                        <div className="space-y-1 overflow-hidden">
                          {activeTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/70"
                              style={{
                                borderLeft: `2px solid ${PRIORITY_COLORS[task.priority]}`,
                              }}
                            >
                              <span className="text-[10px] font-medium truncate text-foreground">
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {activeTasks.length > 2 && (
                            <div className="text-[10px] font-medium text-muted-foreground px-1">
                              +{activeTasks.length - 2} more
                            </div>
                          )}
                          {completedTasks.length > 0 && (
                            <div className="text-[10px] text-muted-foreground px-1">
                              {completedTasks.length} done
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="p-4 overflow-y-auto max-h-[500px] sm:max-h-none">
            {sortedTasksByDate.size === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <IconCalendarMonth className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">No tasks planned</p>
                <p className="text-xs text-muted-foreground/70">Create a task to see it here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(sortedTasksByDate.entries()).map(([dateStr, dateTasks]) => {
                  const isNoDate = dateStr === '__no_date'
                  const date = isNoDate ? null : new Date(dateStr + 'T00:00:00')
                  const isOverdue = date && date < new Date(new Date().toDateString())
                  const todayTasks = dateTasks.filter(
                    (t) => t.status !== 'completed' && t.status !== 'cancelled'
                  )
                  const doneTasks = dateTasks.filter((t) => t.status === 'completed')

                  return (
                    <div key={dateStr}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {date ? (
                            <span
                              className={`text-xs font-semibold uppercase tracking-wider ${
                                isOverdue
                                  ? 'text-destructive'
                                  : isSameDay(date, new Date())
                                    ? 'text-primary'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {isSameDay(date, new Date())
                                ? 'Today'
                                : isSameDay(date, new Date(new Date().getTime() + 86400000))
                                  ? 'Tomorrow'
                                  : format(date, 'EEEE, MMM d')}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              No Due Date
                            </span>
                          )}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {todayTasks.length} active
                          {doneTasks.length > 0 && `, ${doneTasks.length} done`}
                        </span>
                      </div>
                      <TaskList
                        tasks={dateTasks}
                        onToggleStatus={onToggleTask}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lg:w-80 border border-border rounded-xl bg-card shadow-xs flex flex-col transition-all overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-semibold text-sm text-foreground">
              {format(selectedDate, 'EEEE, MMM d')}
            </h4>
            <p className="text-xs text-muted-foreground">
              {sortedDayTasks.length} task{sortedDayTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => onAddTask(selectedDate)}
          >
            <IconPlus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sortedDayTasks.length > 0 ? (
            <TaskList
              tasks={sortedDayTasks}
              onToggleStatus={onToggleTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              compact
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconCalendarMonth className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">No tasks for this day</p>
              <Button
                variant="link"
                size="sm"
                className="text-xs mt-1"
                onClick={() => onAddTask(selectedDate)}
              >
                Add a task
              </Button>
            </div>
          )}

          {noDateTasks.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 text-left">
                Unscheduled ({noDateTasks.length})
              </h5>
              <TaskList
                tasks={noDateTasks}
                onToggleStatus={onToggleTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                compact
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
