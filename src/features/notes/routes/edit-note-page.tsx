import { useNavigate, useParams } from 'react-router'
import { useEffect, useState } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useNote, useUpdateNote } from '../hooks/use-notes'
import { NoteForm } from '../components/note-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Check, Clock, Share } from 'lucide-react'
import { useTimeEntriesByProject } from '@/features/timesheet/hooks/use-timesheet'
import { useMemo } from 'react'

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

  // Fetch time entries for the project if note has one
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
    return <div className="p-8 text-center text-muted-foreground">Loading note...</div>
  }

  if (!note) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Note not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
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

  const handleUpdate = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ id: note.id, data })
      navigate(-1)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Note</h1>
        </div>
        <div className="flex items-center gap-2">
          {timeTrackedToday && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Clock className="h-4 w-4" />
              Worked on: {timeTrackedToday} today
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleShare}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Share className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Share'}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <NoteForm
          note={note}
          onSubmit={handleUpdate}
          onCancel={() => navigate(-1)}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  )
}
