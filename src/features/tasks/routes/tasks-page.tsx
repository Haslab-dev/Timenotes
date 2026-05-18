import { useState, useCallback } from 'react'
import {
  ListTodo,
  Plus,
  AlertCircle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-12 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 px-1">
        <div className="space-y-1 text-left">
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-2 sm:gap-3">
            <ListTodo className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Task Planner
          </h1>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">
            Plan, schedule, and track your tasks
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className={`h-8 px-2 sm:px-3 text-xs font-bold rounded-lg transition-all ${
              notificationEnabled
                ? 'border-primary/30 text-primary bg-primary/5'
                : 'text-muted-foreground'
            }`}
            onClick={handleNotificationToggle}
          >
            {notificationEnabled ? (
              <Bell className="h-3.5 w-3.5 sm:mr-1" />
            ) : (
              <BellOff className="h-3.5 w-3.5 sm:mr-1" />
            )}
            <span className="hidden sm:inline">{notificationEnabled ? 'On' : 'Off'}</span>
          </Button>
          <Button
            size="sm"
            className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-bold rounded-lg"
            onClick={() => handleAddTask(new Date())}
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 px-1">
        <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total
            </span>
            <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/40" />
          </div>
          <p className="text-xl sm:text-2xl font-black mt-1">{statusCounts.total}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Active
            </span>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black mt-1 text-blue-500">{statusCounts.active}</p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Done
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black mt-1 text-green-500">
            {statusCounts.completed}
          </p>
        </div>
        <div className="bg-card border rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Overdue
            </span>
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
          </div>
          <p
            className={`text-xl sm:text-2xl font-black mt-1 ${overdueTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
          >
            {statusCounts.overdue}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
        <div className="flex bg-muted/50 p-1 rounded-xl border shadow-inner overflow-hidden">
          <Button
            variant={view === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 sm:h-8 px-2 sm:px-4 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              view === 'calendar' ? 'shadow-md' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setView('calendar')}
          >
            <BarChart3 className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">Calendar</span>
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            className={`h-7 sm:h-8 px-2 sm:px-4 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              view === 'list' ? 'shadow-md' : 'text-muted-foreground hover:bg-muted'
            }`}
            onClick={() => setView('list')}
          >
            <ListTodo className="h-3.5 w-3.5 sm:mr-1.5" />
            <span className="hidden sm:inline">List</span>
          </Button>
        </div>

        {view === 'list' && (
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
              className="h-8 rounded-lg border bg-background px-2 text-xs font-medium text-muted-foreground outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2 text-xs font-medium text-muted-foreground outline-none"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
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
        <div className="bg-card border rounded-2xl shadow-sm p-3 sm:p-4">
          <TaskList
            tasks={filteredTasks}
            onToggleStatus={handleToggleTask}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        </div>
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
