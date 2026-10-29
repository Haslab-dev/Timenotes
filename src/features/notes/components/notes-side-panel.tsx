import { useSearchParams, useParams, useLocation, useNavigate } from 'react-router'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { NoteForm } from './note-form'
import { useNote, useUpdateNote } from '../hooks/use-notes'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import type { UpdateNoteRequest } from '@/lib/types'
import { IconCheck, IconDownload, IconNotes, IconShare } from '@tabler/icons-react'
import { useState } from 'react'

export function NotesSidePanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: pathId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isMobile = useIsMobile()

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

  const handleDownloadMd = () => {
    if (!note) return
    const safeName = (note.title || 'untitled').replace(/[^a-z0-9-_ ]/gi, '').trim() || 'untitled'
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeName}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto px-6 sm:px-8">
        <SheetHeader className="mb-4 pr-10 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground truncate">
              <IconNotes className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Notes</span>
              <span>/</span>
              <span className="text-foreground truncate">{note?.title || 'Untitled'}</span>
            </SheetTitle>
            {note && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={handleDownloadMd}
                  title="Download .md"
                >
                  <IconDownload className="h-3.5 w-3.5 mr-1" />
                  .md
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleShare}>
                  {copied ? (
                    <IconCheck className="h-3.5 w-3.5 mr-1" />
                  ) : (
                    <IconShare className="h-3.5 w-3.5 mr-1" />
                  )}
                  {copied ? 'Copied!' : 'Share'}
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary" />
          </div>
        ) : note ? (
          <NoteForm
            note={note}
            onSubmit={handleUpdate}
            onCancel={handleClose}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <div className="text-center py-12 text-sm text-muted-foreground">Note not found</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
