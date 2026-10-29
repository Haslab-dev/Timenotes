import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/lib/types'
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/types'
import {
  IconCalendar,
  IconClock,
  IconFlag,
  IconFolder,
  IconBell,
  IconChecklist,
} from '@tabler/icons-react'
import { format } from 'date-fns'

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task | null
  defaultDate?: Date
  onSave: (data: CreateTaskRequest | UpdateTaskRequest) => void
  isSaving: boolean
}

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultDate,
  onSave,
  isSaving,
}: TaskDialogProps) {
  const { data: projects = [] } = useProjects()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [projectId, setProjectId] = useState<string>('none')
  const [reminderMinutes, setReminderMinutes] = useState<string>('none')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '')
      setDueTime(task.dueTime || '')
      setPriority(task.priority)
      setProjectId(task.projectId || 'none')
      setReminderMinutes(task.reminderMinutes?.toString() || 'none')
    } else {
      setTitle('')
      setDescription('')
      setDueDate(defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '')
      setDueTime('')
      setPriority('medium')
      setProjectId('none')
      setReminderMinutes('none')
    }
  }, [task, defaultDate, open])

  useLayoutEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'inherit'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    const data: CreateTaskRequest | UpdateTaskRequest = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate + 'T00:00:00') : undefined,
      dueTime: dueTime || undefined,
      priority,
      projectId: projectId === 'none' ? undefined : projectId,
      reminderMinutes: reminderMinutes === 'none' ? undefined : parseInt(reminderMinutes),
    }

    onSave(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-6 sm:p-8">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <IconChecklist className="h-3.5 w-3.5 text-primary" />
            <span>Tasks</span>
            <span>/</span>
            <span className="text-foreground">{task ? 'Edit Task' : 'New Task'}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {task ? 'Update your task details' : 'Create a new task for your planner'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notion-style Large Borderless Title */}
          <div>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name..."
              required
              rows={1}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                }
              }}
              className="w-full min-h-0 text-2xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none p-0 overflow-hidden leading-tight"
            />
          </div>

          {/* Notion-style Property Rows */}
          <div className="py-2.5 border-y border-border/60 space-y-1">
            {/* Priority */}
            <div className="flex items-center min-h-8 text-xs">
              <div className="w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                <IconFlag className="h-3.5 w-3.5" />
                <span>Priority</span>
              </div>
              <div className="flex-1">
                <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 shadow-none bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs rounded-md focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              backgroundColor:
                                PRIORITY_COLORS[value as keyof typeof PRIORITY_COLORS],
                            }}
                          />
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Project */}
            <div className="flex items-center min-h-8 text-xs">
              <div className="w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                <IconFolder className="h-3.5 w-3.5" />
                <span>Project</span>
              </div>
              <div className="flex-1">
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 shadow-none bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs rounded-md focus:ring-0">
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">Empty</span>
                    </SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center min-h-8 text-xs">
              <div className="w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                <IconCalendar className="h-3.5 w-3.5" />
                <span>Due Date</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-7 rounded-md bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs text-foreground border-0 focus:outline-none focus:bg-secondary/60 cursor-pointer"
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="text-[11px] text-muted-foreground hover:text-foreground px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Due Time */}
            <div className="flex items-center min-h-8 text-xs">
              <div className="w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                <IconClock className="h-3.5 w-3.5" />
                <span>Time</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="h-7 rounded-md bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs text-foreground border-0 focus:outline-none focus:bg-secondary/60 cursor-pointer"
                />
                {dueTime && (
                  <button
                    type="button"
                    onClick={() => setDueTime('')}
                    className="text-[11px] text-muted-foreground hover:text-foreground px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Reminder */}
            <div className="flex items-center min-h-8 text-xs">
              <div className="w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                <IconBell className="h-3.5 w-3.5" />
                <span>Reminder</span>
              </div>
              <div className="flex-1">
                <Select value={reminderMinutes} onValueChange={setReminderMinutes}>
                  <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 shadow-none bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs rounded-md focus:ring-0">
                    <SelectValue placeholder="Empty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-muted-foreground">None</span>
                    </SelectItem>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="10">10 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notion-style Description / Page Body */}
          <div className="pt-1">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, sub-items, or details..."
              className="w-full min-h-[120px] bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 resize-y p-0 leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!title.trim() || isSaving}>
              {isSaving ? 'Saving...' : task ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
