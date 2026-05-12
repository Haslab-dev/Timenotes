import { useSearchParams, useParams, useLocation, useNavigate } from 'react-router'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NoteForm } from './note-form'
import { useNote, useUpdateNote } from '../hooks/use-notes'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import type { UpdateNoteRequest } from '@/lib/types'
import { Check, Share } from 'lucide-react'
import { useState } from 'react'

export function NotesSidePanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: pathId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isMobile = useIsMobile()

  // Detect ID from search param OR from clean path /notes/:id
  // But only use pathId if we are on a notes route and it's not '/new' or '/edit'
  const isNotesPath =
    location.pathname.startsWith('/notes/') &&
    !location.pathname.endsWith('/edit') &&
    !location.pathname.endsWith('/new')
  const noteId = searchParams.get('noteId') || (isNotesPath ? pathId : null)

  const { data: note, isLoading } = useNote(noteId || '')
  const updateMutation = useUpdateNote()
  const [copied, setCopied] = useState(false)

  const isOpen = !!noteId && !isMobile

  const handleClose = () => {
    if (pathId && isNotesPath) {
      navigate('/notes', { replace: true })
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('noteId')
          return next
        },
        { replace: true }
      )
    }
  }

  const handleUpdate = async (data: UpdateNoteRequest) => {
    if (!noteId) return
    try {
      await updateMutation.mutateAsync({ id: noteId, data })
      // Keep it open or close? User might want to keep editing.
      // Usually keeping it open is fine.
    } catch (err) {
      console.error(err)
    }
  }

  const handleShare = async () => {
    if (!note) return

    const url = `${window.location.origin}/shared/notes/${note.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6 pr-12">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="truncate">Edit Note</SheetTitle>
            {note && (
              <Button variant="outline" size="sm" className="shrink-0" onClick={handleShare}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Share className="h-4 w-4 mr-2" />}
                {copied ? 'Copied!' : 'Share'}
              </Button>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : note ? (
          <NoteForm
            note={note}
            onSubmit={handleUpdate}
            onCancel={handleClose}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">Note not found</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
