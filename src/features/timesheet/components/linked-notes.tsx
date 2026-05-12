import { useNotesByTimeEntry } from '../../notes/hooks/use-notes'
import { FileText, Loader2 } from 'lucide-react'
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
        <Loader2 className="h-3 w-3 animate-spin" />
        Loading linked notes...
      </div>
    )
  }

  if (!notes || notes.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 pt-4 border-t border-muted/50 mt-4">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-wider">
        <FileText className="h-3 w-3" />
        Linked Notes ({notes.length})
      </div>
      <div className="grid gap-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="group relative flex flex-col p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer"
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
              <span className="text-sm font-bold text-primary truncate">{note.title}</span>
              <span className="text-[10px] text-primary/40 font-mono shrink-0">
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
