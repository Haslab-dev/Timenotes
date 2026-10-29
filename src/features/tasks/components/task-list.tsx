import { format } from 'date-fns'
import {
  IconCircleCheckFilled,
  IconCircle,
  IconClock,
  IconTrash,
  IconPencil,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { Task } from '@/lib/types'
import { PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '@/lib/types'

interface TaskListProps {
  tasks: Task[]
  onToggleStatus: (task: Task) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  compact?: boolean
}

export function TaskList({
  tasks,
  onToggleStatus,
  onEdit,
  onDelete,
  compact = false,
}: TaskListProps) {
  const { data: projects = [] } = useProjects()

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <IconCircleCheckFilled className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-sm font-medium text-muted-foreground">No tasks yet</p>
        <p className="text-xs text-muted-foreground/70">Create a task to get started</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      {tasks.map((task) => {
        const project = projects.find((p) => p.id === task.projectId)
        const isOverdue =
          task.status !== 'completed' &&
          task.status !== 'cancelled' &&
          task.dueDate &&
          task.dueDate < new Date(new Date().toDateString())

        return (
          <div
            key={task.id}
            className={`group flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
              task.status === 'completed'
                ? 'bg-muted/30 border-border/50 opacity-60'
                : isOverdue
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-card border-border hover:bg-secondary/40'
            }`}
          >
            <button
              type="button"
              onClick={() => onToggleStatus(task)}
              className="mt-0.5 shrink-0 cursor-pointer transition-colors"
            >
              {task.status === 'completed' ? (
                <IconCircleCheckFilled className="h-4 w-4 text-primary" />
              ) : (
                <IconCircle className="h-4 w-4 text-muted-foreground hover:text-primary" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-medium truncate ${
                    task.status === 'completed'
                      ? 'line-through text-muted-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {task.title}
                </span>
                {task.status !== 'completed' && task.status !== 'pending' && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                    {STATUS_LABELS[task.status]}
                  </Badge>
                )}
              </div>

              {task.description && !compact && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-3 flex-wrap mt-1.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                  />
                  <span className="text-[11px] font-medium text-muted-foreground">
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>

                {task.dueDate && (
                  <div className="flex items-center gap-1">
                    <IconClock
                      className={`h-3 w-3 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
                    />
                    <span
                      className={`text-[11px] ${
                        isOverdue ? 'text-destructive font-semibold' : 'text-muted-foreground'
                      }`}
                    >
                      {format(task.dueDate, 'MMM d')}
                      {task.dueTime ? ` ${task.dueTime}` : ''}
                    </span>
                  </div>
                )}

                {project && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-[11px] text-muted-foreground">{project.name}</span>
                  </div>
                )}
              </div>
            </div>

            {!compact && (
              <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(task)}
                >
                  <IconPencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(task)}
                >
                  <IconTrash className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
