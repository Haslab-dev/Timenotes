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
import { ChevronLeft, ChevronRight, Plus, AlertCircle, CalendarDays, List } from 'lucide-react'
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
    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[600px]">
      <div className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <div className="flex items-center gap-2 sm:gap-4">
            <h3 className="text-base sm:text-xl font-medium text-foreground min-w-[130px] sm:min-w-[150px] text-left">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md cursor-pointer"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 sm:h-8 px-2 sm:px-3 rounded-md text-[10px] sm:text-xs font-bold cursor-pointer"
                onClick={() => setCurrentMonth(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-md cursor-pointer"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-muted/50 p-0.5 rounded-lg border">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="icon"
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md ${viewMode === 'calendar' ? 'shadow-sm' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-md ${viewMode === 'list' ? 'shadow-sm' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              size="sm"
              className="h-7 sm:h-8 px-2 sm:px-3 text-xs font-bold rounded-lg"
              onClick={() => onAddTask(selectedDate)}
            >
              <Plus className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        </div>

        {viewMode === 'calendar' ? (
          <>
            <div className="grid grid-cols-7 bg-muted/5 border-b">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[9px] sm:text-[10px] font-bold text-muted-foreground tracking-widest border-r last:border-r-0"
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
                      'min-h-[80px] sm:min-h-[100px] border-r border-b relative cursor-pointer transition-colors last:border-r-0',
                      !isCurrentMonth ? 'bg-muted/5 opacity-40' : 'bg-card',
                      isSelected
                        ? 'bg-primary/[0.05] ring-2 ring-inset ring-primary/20 z-10'
                        : 'hover:bg-muted/10',
                    ].join(' ')}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="p-1 sm:p-1.5 flex flex-col h-full text-left">
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={[
                            'flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-[11px] font-bold rounded-full',
                            isToday(day)
                              ? 'bg-primary text-primary-foreground shadow-sm'
                              : isSelected
                                ? 'bg-primary/20 text-primary'
                                : 'text-muted-foreground',
                          ].join(' ')}
                        >
                          {format(day, 'd')}
                        </span>
                        {overdueCount > 0 && <AlertCircle className="h-3 w-3 text-destructive" />}
                      </div>

                      {hasTasks && (
                        <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                          {activeTasks.slice(0, 2).map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center gap-1 px-1 py-0.5 rounded-[3px]"
                              style={{
                                backgroundColor: `${PRIORITY_COLORS[task.priority]}15`,
                                borderLeft: `2px solid ${PRIORITY_COLORS[task.priority]}`,
                              }}
                            >
                              <span className="text-[8px] sm:text-[9px] font-semibold truncate text-foreground/80">
                                {task.title}
                              </span>
                            </div>
                          ))}
                          {activeTasks.length > 2 && (
                            <div className="text-[8px] sm:text-[9px] font-bold text-muted-foreground px-1">
                              +{activeTasks.length - 2} more
                            </div>
                          )}
                          {completedTasks.length > 0 && (
                            <div className="text-[8px] sm:text-[9px] text-muted-foreground/60 px-1">
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
                <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No tasks planned</p>
                <p className="text-xs text-muted-foreground/60">Create a task to see it here</p>
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
                              className={`text-xs font-bold uppercase tracking-wider ${
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
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              No Due Date
                            </span>
                          )}
                          {isOverdue && (
                            <Badge
                              variant="destructive"
                              className="text-[8px] h-4 px-1.5 font-bold"
                            >
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
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

      <div className="lg:w-80 border rounded-2xl bg-card shadow-sm flex flex-col transition-all overflow-hidden">
        <div className="p-3 sm:p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="text-left">
            <h4 className="font-bold text-xs sm:text-sm">{format(selectedDate, 'EEEE, MMM d')}</h4>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              {sortedDayTasks.length} task{sortedDayTasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 sm:h-8 px-2 sm:px-3 rounded-lg text-xs font-bold"
            onClick={() => onAddTask(selectedDate)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
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
              <CalendarDays className="h-10 w-10 text-muted-foreground/20 mb-2" />
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
            <div className="pt-4 border-t">
              <h5 className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
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
