import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { CreateTimeEntryRequest, TimeEntry } from '@/lib/types'

interface TimeEntryFormProps {
  timeEntry?: TimeEntry
  onSubmit: (data: CreateTimeEntryRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TimeEntryForm({ timeEntry, onSubmit, onCancel, isLoading }: TimeEntryFormProps) {
  const { data: projects = [] } = useProjects()
  
  const [projectId, setProjectId] = useState(timeEntry?.projectId || '')
  const [description, setDescription] = useState(timeEntry?.description || '')
  const [startTime, setStartTime] = useState(
    timeEntry?.startTime 
      ? formatDateTimeLocal(timeEntry.startTime)
      : formatDateTimeLocal(new Date())
  )
  const [endTime, setEndTime] = useState(
    timeEntry?.endTime 
      ? formatDateTimeLocal(timeEntry.endTime)
      : formatDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000)) // 1 hour later
  )
  const [tags, setTags] = useState(timeEntry?.tags.join(', ') || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectId || !startTime || !endTime) return

    const startDate = new Date(startTime)
    const endDate = new Date(endTime)

    if (endDate <= startDate) {
      alert('End time must be after start time')
      return
    }

    onSubmit({
      projectId,
      description: description.trim() || undefined,
      startTime: startDate,
      endTime: endDate,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
    })
  }

  const getDuration = () => {
    if (!startTime || !endTime) return ''
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diff = end.getTime() - start.getTime()
    if (diff <= 0) return ''
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project">Project</Label>
        <Select value={projectId} onValueChange={setProjectId} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you work on?"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
          />
        </div>
      </div>

      {getDuration() && (
        <div className="text-sm text-muted-foreground">
          Duration: {getDuration()}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="meeting, development, design (comma separated)"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!projectId || !startTime || !endTime || isLoading}>
          {isLoading ? 'Saving...' : timeEntry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  )
}

function formatDateTimeLocal(date: Date): string {
  // Format date for datetime-local input
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
