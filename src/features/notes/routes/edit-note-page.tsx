import { useNavigate, useParams } from 'react-router'
import { useEffect, useState, useMemo } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useNote, useUpdateNote } from '../hooks/use-notes'
import { NoteForm } from '../components/note-form'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconDownload,
  IconNotes,
  IconShare,
} from '@tabler/icons-react'
import { useTimeEntriesByProject } from '@/features/timesheet/hooks/use-timesheet'

export function EditNotePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { data: note, isLoading } = useNote(id!)
  const updateMutation = useUpdateNote()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isMobile && id) {
      navigate(`/notes/${id}`, { replace: true })
    }
  }, [isMobile, id, navigate])

  const { data: timeEntries = [] } = useTimeEntriesByProject(note?.projectId || '')

  const timeTrackedToday = useMemo(() => {
    if (!note?.projectId) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayEntries = timeEntries.filter((e) => {
      const entryDate = new Date(e.startTime)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === today.getTime()
    })

    const totalMinutes = todayEntries.reduce((acc, entry) => acc + entry.duration, 0)
    if (totalMinutes === 0) return null

    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours}h ${minutes}m`
  }, [timeEntries, note?.projectId])

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading note...</div>
  }

  if (!note) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Note not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <IconArrowLeft className="h-4 w-4 mr-1.5" />
          Go Back
        </Button>
      </div>
    )
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/shared/notes/${note.id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadMd = () => {
    const safeName = (note.title || 'untitled').replace(/[^a-z0-9-_ ]/gi, '').trim() || 'untitled'
    const blob = new Blob([note.content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeName}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleUpdate = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ id: note.id, data })
      navigate(-1)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(-1)}>
            <IconArrowLeft className="h-3.5 w-3.5 mr-1" />
            Notes
          </Button>
          <span>/</span>
          <span className="inline-flex items-center gap-1.5 text-foreground font-medium truncate">
            <IconNotes className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{note.title || 'Untitled'}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {timeTrackedToday && (
            <Badge variant="tertiary" className="gap-1.5">
              <IconClock className="h-3.5 w-3.5" />
              <span>Today: {timeTrackedToday}</span>
            </Badge>
          )}

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
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <NoteForm
            note={note}
            onSubmit={handleUpdate}
            onCancel={() => navigate(-1)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
