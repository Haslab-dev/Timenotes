import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { CreateNoteRequest, Note } from '@/lib/types'
import { useState, useRef, useLayoutEffect, type KeyboardEvent } from 'react'
import { NoteEditor } from './note-editor'
import { IconFolder, IconTags, IconClock, IconX, IconPlus } from '@tabler/icons-react'

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
  const [tagList, setTagList] = useState<string[]>(note?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [error, setError] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'inherit'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

  const addTag = (raw: string) => {
    const cleaned = raw.trim().replace(/,/g, '')
    if (cleaned && !tagList.includes(cleaned)) {
      setTagList((prev) => [...prev, cleaned])
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setTagList((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    } else if (e.key === 'Backspace' && !tagInput && tagList.length > 0) {
      removeTag(tagList[tagList.length - 1])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a title for the note')
      return
    }

    const finalTags = [...tagList]
    if (tagInput.trim()) {
      tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .forEach((t) => {
          if (!finalTags.includes(t)) finalTags.push(t)
        })
    }

    onSubmit({
      title: title.trim(),
      content: content || '',
      projectId: projectId === '__none__' || !projectId ? undefined : projectId,
      timeEntryId: timeEntryId || undefined,
      tags: finalTags,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Notion-style Large Borderless Title */}
      <div>
        <textarea
          id="title"
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          required
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
            }
          }}
          className="w-full min-h-0 text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none p-0 overflow-hidden leading-tight"
        />
      </div>

      {/* Notion-style Compact Property Rows */}
      <div className="py-2.5 border-y border-border/60 space-y-1">
        {/* Project Property Row */}
        <div className="flex items-center min-h-8 text-xs">
          <div className="w-28 sm:w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
            <IconFolder className="h-3.5 w-3.5" />
            <span>Project</span>
          </div>
          <div className="flex-1 min-w-0">
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="h-7 w-auto min-w-[140px] max-w-xs border-0 shadow-none bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs rounded-md focus:ring-0">
                <SelectValue placeholder="Empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
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

        {/* Tags Property Row */}
        <div className="flex items-start sm:items-center min-h-8 text-xs py-0.5">
          <div className="w-28 sm:w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium pt-1 sm:pt-0">
            <IconTags className="h-3.5 w-3.5" />
            <span>Tags</span>
          </div>
          <div className="flex-1 flex flex-wrap items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-secondary/40 transition-colors min-h-7">
            {tagList.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 text-[11px] font-medium pl-2 pr-1 py-0 h-5"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground hover:text-foreground rounded-xs p-0.5"
                >
                  <IconX className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
            <div className="inline-flex items-center gap-1 flex-1 min-w-[110px]">
              {tagList.length === 0 && !tagInput && (
                <IconPlus className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              )}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput)
                }}
                placeholder={tagList.length === 0 ? 'Add tags (press Enter)...' : 'Add tag...'}
                className="w-full bg-transparent border-0 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none py-0.5"
              />
            </div>
          </div>
        </div>

        {/* Updated / Time Entry Property Row */}
        {(note?.updatedAt || timeEntryId) && (
          <div className="flex items-center min-h-7 text-xs">
            <div className="w-28 sm:w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
              <IconClock className="h-3.5 w-3.5" />
              <span>{timeEntryId ? 'Time Entry' : 'Last edited'}</span>
            </div>
            <div className="flex-1 px-2 text-xs text-muted-foreground">
              {timeEntryId ? (
                <Badge variant="tertiary" className="text-[11px]">
                  Linked to session
                </Badge>
              ) : (
                note?.updatedAt && new Date(note.updatedAt).toLocaleString()
              )}
            </div>
          </div>
        )}
      </div>

      {/* Notion-style Editor Surface */}
      <div>
        <NoteEditor
          content={content}
          onChange={setContent}
          placeholder="Press '[] ' for a checklist, or start writing your note..."
          variant="notion"
        />
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-2.5">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          Markdown & checklists supported
        </span>
        <div className="flex items-center gap-2 ml-auto">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={!title.trim() || isLoading}>
            {isLoading ? 'Saving...' : note ? 'Save Changes' : 'Create Note'}
          </Button>
        </div>
      </div>
    </form>
  )
}
