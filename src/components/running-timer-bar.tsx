import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useActiveTimer, useTimerTicker } from '@/features/timesheet/hooks/use-active-timer'
import { useCreateTimeEntry } from '@/features/timesheet/hooks/use-timesheet'
import { IconPlus, IconPlayerStopFilled, IconX } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'

export function RunningTimerBar() {
  const { activeTimer, stopTimer, updateTimer } = useActiveTimer()
  const { totalWorkSeconds } = useTimerTicker()
  const { data: projects = [] } = useProjects()
  const createTimeEntryMutation = useCreateTimeEntry()
  const navigate = useNavigate()

  const [description, setDescription] = useState('')

  useEffect(() => {
    if (activeTimer) {
      setDescription(activeTimer.description || '')
    }
  }, [activeTimer?.description])

  if (!activeTimer) return null

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const handleStop = () => {
    const timer = stopTimer()
    if (timer && timer.projectId) {
      createTimeEntryMutation.mutate({
        id: timer.id,
        projectId: timer.projectId,
        description: description,
        startTime: timer.startTime,
        endTime: new Date(),
        tags: [],
      })
    }
  }

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to discard this timer?')) {
      stopTimer()
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value)
    updateTimer({ description: e.target.value })
  }

  const handleProjectChange = (projectId: string) => {
    updateTimer({ projectId })
  }

  return (
    <div className="sticky top-14 left-0 right-0 z-20 bg-tertiary/80 backdrop-blur-sm text-tertiary-foreground border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-8 py-2 gap-4">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-border shrink-0">
            <span className="h-2 w-2 rounded-full bg-tertiary-foreground animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Active Session
            </span>
          </div>

          <Select value={activeTimer.projectId || undefined} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[140px] sm:w-[190px] h-8 text-xs bg-card border-border text-foreground shrink-0">
              <SelectValue placeholder="Select Project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="h-8 bg-card/70 border-border text-xs hidden sm:block flex-1 text-foreground placeholder:text-muted-foreground"
            placeholder="What are you working on?"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="text-sm sm:text-base font-mono font-semibold text-foreground tabular-nums">
            {formatTime(totalWorkSeconds)}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs bg-card"
              onClick={() => {
                navigate('/notes/new', {
                  state: {
                    projectId: activeTimer.projectId,
                    timeEntryId: activeTimer.id,
                    title: `Notes for: ${description || 'Focus Session'}`,
                  },
                })
              }}
            >
              <IconPlus className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Add Note</span>
            </Button>

            <Button
              variant="default"
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={handleStop}
              disabled={!activeTimer.projectId}
            >
              <IconPlayerStopFilled className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Finish</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              onClick={handleCancel}
              title="Discard timer"
            >
              <IconX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
