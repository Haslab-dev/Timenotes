import { useState, useCallback } from 'react'
import {
  IconChecklist,
  IconPlus,
  IconAlertCircle,
  IconBell,
  IconBellOff,
  IconCircleCheck,
  IconClock,
  IconCalendarMonth,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TaskPlannerCalendar } from '../components/task-planner-calendar'
import { TaskList } from '../components/task-list'
import { TaskDialog } from '../components/task-dialog'
import {
  useTasks,
  useOverdueTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../hooks/use-tasks'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/lib/types'
import {
  getNotificationSettings,
  setBrowserNotifications,
  requestNotificationPermission,
} from '@/lib/utils/notification-settings'

export function TasksPage() {
  const { data: tasks = [] } = useTasks()
  const { data: overdueTasks = [] } = useOverdueTasks()
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  const initialSettings = getNotificationSettings()
  const [showDialog, setShowDialog] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [defaultDate, setDefaultDate] = useState<Date>()
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [notificationEnabled, setNotificationEnabled] = useState(
    initialSettings.browserNotifications
  )
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const handleAddTask = useCallback((date?: Date) => {
    setEditingTask(null)
    setDefaultDate(date || new Date())
    setShowDialog(true)
  }, [])

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setDefaultDate(undefined)
    setShowDialog(true)
  }, [])

  const handleToggleTask = useCallback(
    (task: Task) => {
      const newStatus = task.status === 'completed' ? 'pending' : 'completed'
      updateTask.mutate({ id: task.id, data: { status: newStatus } })
    },
    [updateTask]
  )

  const handleDeleteTask = useCallback(
    (task: Task) => {
      if (confirm(`Delete "${task.title}"?`)) {
        deleteTask.mutate(task.id)
      }
    },
    [deleteTask]
  )

  const handleSaveTask = useCallback(
    (data: CreateTaskRequest | UpdateTaskRequest) => {
      if (editingTask) {
        updateTask.mutate(
          { id: editingTask.id, data: data as UpdateTaskRequest },
          { onSuccess: () => setShowDialog(false) }
        )
      } else {
        createTask.mutate(data as CreateTaskRequest, {
          onSuccess: () => setShowDialog(false),
        })
      }
    },
    [editingTask, createTask, updateTask]
  )

  const handleNotificationToggle = async () => {
    if (notificationEnabled) {
      setNotificationEnabled(false)
      setBrowserNotifications(false)
    } else {
      const result = await requestNotificationPermission()
      const granted = result === 'granted'
      setNotificationEnabled(granted)
      setBrowserNotifications(granted)
    }
  }

  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  const completedTasks = tasks.filter((t) => t.status === 'completed')
  const totalTasks = tasks.length

  const filteredTasks = tasks
    .filter((task) => {
      if (statusFilter === 'active')
        return task.status !== 'completed' && task.status !== 'cancelled'
      if (statusFilter === 'completed') return task.status === 'completed'
      return true
    })
    .filter((task) => {
      if (priorityFilter === 'all') return true
      return task.priority === priorityFilter
    })

  const statusCounts = {
    total: totalTasks,
    active: activeTasks.length,
    completed: completedTasks.length,
    overdue: overdueTasks.length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Plan, schedule, and track your action items."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={notificationEnabled ? 'tertiary' : 'outline'}
              size="sm"
              onClick={handleNotificationToggle}
            >
              {notificationEnabled ? (
                <IconBell className="h-4 w-4 sm:mr-1.5" />
              ) : (
                <IconBellOff className="h-4 w-4 sm:mr-1.5" />
              )}
              <span className="hidden sm:inline">
                {notificationEnabled ? 'Alerts On' : 'Alerts Off'}
              </span>
            </Button>
            <Button size="sm" onClick={() => handleAddTask(new Date())}>
              <IconPlus className="h-4 w-4 sm:mr-1.5" />
              <span>New Task</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total Tasks</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <IconChecklist className="h-4 w-4" stroke={1.75} />
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums mt-2 text-foreground">
            {statusCounts.total}
          </p>
        </Card>

        <Card className="p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">In Progress</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <IconClock className="h-4 w-4" stroke={1.75} />
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums mt-2 text-primary">
            {statusCounts.active}
          </p>
        </Card>

        <Card className="p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Completed</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-tertiary text-tertiary-foreground">
              <IconCircleCheck className="h-4 w-4" stroke={1.75} />
            </div>
          </div>
          <p className="text-2xl font-semibold tabular-nums mt-2 text-foreground">
            {statusCounts.completed}
          </p>
        </Card>

        <Card className="p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Overdue</span>
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-md ${
                statusCounts.overdue > 0
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <IconAlertCircle className="h-4 w-4" stroke={1.75} />
            </div>
          </div>
          <p
            className={`text-2xl font-semibold tabular-nums mt-2 ${
              statusCounts.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {statusCounts.overdue}
          </p>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="inline-flex bg-secondary/70 p-0.5 rounded-lg border border-border">
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 rounded-md text-xs"
            onClick={() => setView('calendar')}
          >
            <IconCalendarMonth className="h-3.5 w-3.5 mr-1.5" />
            Calendar
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="h-7 px-3 rounded-md text-xs"
            onClick={() => setView('list')}
          >
            <IconChecklist className="h-3.5 w-3.5 mr-1.5" />
            List
          </Button>
        </div>

        {view === 'list' && (
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as 'all' | 'active' | 'completed')}
            >
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {view === 'calendar' ? (
        <TaskPlannerCalendar
          tasks={tasks}
          onAddTask={handleAddTask}
          onEditTask={handleEditTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      ) : (
        <Card className="p-4">
          <TaskList
            tasks={filteredTasks}
            onToggleStatus={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </Card>
      )}

      <TaskDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        task={editingTask}
        defaultDate={defaultDate}
        onSave={handleSaveTask}
        isSaving={createTask.isPending || updateTask.isPending}
      />
    </div>
  )
}
