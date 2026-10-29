import { useNotesByTimeEntry } from '../../notes/hooks/use-notes'
import { IconNotes, IconLoader2 } from '@tabler/icons-react'
import { format } from 'date-fns'
import { useNavigate, useSearchParams } from 'react-router'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface LinkedNotesProps {
  timeEntryId: string
}

export function LinkedNotes({ timeEntryId }: LinkedNotesProps) {
  const { data: notes, isLoading } = useNotesByTimeEntry(timeEntryId)
  const navigate = useNavigate()
  const [_, setSearchParams] = useSearchParams()
  const isMobile = useIsMobile()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4">
        <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
        Loading linked notes...
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return null
  }

  return (
    <div className="space-y-2.5 pt-3 border-t border-border/60 mt-3">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        <IconNotes className="h-3.5 w-3.5 text-primary" />
        Linked Notes ({notes.length})
      </div>
      <div className="grid gap-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative flex flex-col p-3 rounded-lg bg-secondary/40 border border-border/60 hover:bg-secondary/70 hover:border-border transition-colors cursor-pointer"
            onClick={() => {
              if (isMobile) {
                navigate(`/notes/${note.id}/edit`)
              } else {
                setSearchParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('noteId', note.id)
                    return next
                  },
                  { replace: true }
                )
              }
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {note.title}
              </span>
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums shrink-0">
                {format(note.createdAt, 'HH:mm')}
              </span>
            </div>
            <div
              className="text-xs text-muted-foreground line-clamp-2 leading-tight tiptap"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
