import { useSearchParams, useParams, useLocation, useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { NoteForm } from './note-form'
import { useNote, useUpdateNote } from '../hooks/use-notes'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import type { UpdateNoteRequest } from '@/lib/types'

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Note</SheetTitle>
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
