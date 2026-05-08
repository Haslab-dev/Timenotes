import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { CreateNoteRequest, Note } from '@/lib/types'
import { useState } from 'react'
import { NoteEditor } from './note-editor'

interface NoteFormProps {
  note?: Note
  onSubmit: (data: CreateNoteRequest) => void
  onCancel: () => void
  isLoading?: boolean
  defaultProjectId?: string
  defaultTitle?: string
  defaultTimeEntryId?: string
}

export function NoteForm({
  note,
  onSubmit,
  onCancel,
  isLoading,
  defaultProjectId,
  defaultTitle,
  defaultTimeEntryId,
}: NoteFormProps) {
  const { data: projects = [] } = useProjects()

  const [title, setTitle] = useState(note?.title || defaultTitle || '')
  const [content, setContent] = useState(note?.content || '')
  const [projectId, setProjectId] = useState(note?.projectId || defaultProjectId || '__none__')
  const [timeEntryId] = useState(note?.timeEntryId || defaultTimeEntryId || '')
  const [tags, setTags] = useState(note?.tags.join(', ') || '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Please enter a title for the note')
      return
    }

    onSubmit({
      title: title.trim(),
      content: content || '',
      projectId: projectId === '__none__' || !projectId ? undefined : projectId,
      timeEntryId: timeEntryId || undefined,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter note title"
          required
          className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Content
        </Label>
        <NoteEditor
          content={content}
          onChange={setContent}
          placeholder="Write your note, ideas, or checklist here..."
        />
        <p className="text-[10px] text-zinc-400">
          Pro tip: Type <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">[]</code> then
          space to start a checklist.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="project"
            className="text-sm font-semibold text-zinc-700 dark:text-zinc-300"
          >
            Project (Optional)
          </Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="__none__">No project</SelectItem>
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
          <Label htmlFor="tags" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Tags
          </Label>
          <Input
            id="tags"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="idea, important, review"
            className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800"
          />
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-xl h-11 px-6 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || isLoading}
          className="rounded-xl h-11 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          {isLoading ? 'Saving...' : note ? 'Update Note' : 'Create Note'}
        </Button>
      </div>
    </form>
  )
}
