import { Square, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useActiveTimer, useTimerTicker } from '@/features/timesheet/hooks/use-active-timer'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useCreateTimeEntry } from '@/features/timesheet/hooks/use-timesheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useNavigate } from 'react-router-dom'

export function RunningTimerBar() {
  const { activeTimer, stopTimer, updateTimer } = useActiveTimer()
  const { elapsedSeconds } = useTimerTicker()
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
    <div className="sticky top-[73px] sm:top-[76px] left-0 right-0 z-30 bg-zinc-900 dark:bg-zinc-950 text-zinc-100 border-b border-zinc-800 shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 gap-4">
        <div className="flex items-center gap-3 sm:gap-4 flex-1 overflow-hidden">
          {/* TRACKING Indicator */}
          <div className="hidden sm:flex items-center gap-2 pr-4 border-r border-zinc-700/50 shrink-0">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
              Tracking
            </span>
          </div>

          <Select value={activeTimer.projectId || undefined} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[140px] sm:w-[200px] h-8 text-sm bg-zinc-800/50 hover:bg-zinc-800 border-zinc-700 text-zinc-100 shrink-0 transition-colors">
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
            className="h-8 bg-transparent border-transparent hover:bg-zinc-800/30 focus-visible:bg-zinc-800/50 focus-visible:ring-1 focus-visible:ring-zinc-600 text-sm hidden sm:block flex-1 text-zinc-300 placeholder:text-zinc-600 transition-colors"
            placeholder="What are you working on?"
            value={description}
            onChange={handleDescriptionChange}
          />
        </div>

        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <div className="text-base sm:text-lg font-mono font-medium text-zinc-100 tabular-nums tracking-wide">
            {formatTime(elapsedSeconds)}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 sm:px-3 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700 transition-colors"
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
              <Plus className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Add Note</span>
            </Button>

            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-2 sm:px-4 text-xs bg-red-600/90 hover:bg-red-600 shadow-sm border-0 font-medium"
              onClick={handleStop}
              disabled={!activeTimer.projectId}
            >
              <Square className="h-3.5 w-3.5 sm:mr-1.5 fill-current" />
              <span className="hidden sm:inline">Stop</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors ml-1"
              onClick={handleCancel}
              title="Discard timer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
