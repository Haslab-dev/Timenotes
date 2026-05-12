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
    <div className="space-y-6 max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-4 border-b pb-4 border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden h-9 w-9 shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex rounded-xl shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Note Detail
            </p>
            {timeTrackedToday && (
              <div className="flex sm:hidden items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/50">
                <Clock className="h-3 w-3" />
                {timeTrackedToday}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {timeTrackedToday && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider border border-indigo-100 dark:border-indigo-800/50">
              <Clock className="h-3.5 w-3.5" />
              <span>Worked today: {timeTrackedToday}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex rounded-xl border-zinc-200 dark:border-zinc-800"
            onClick={handleShare}
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Share className="h-4 w-4 mr-2" />}
            {copied ? 'Copied!' : 'Share'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden h-9 w-9 rounded-xl border-zinc-200 dark:border-zinc-800"
            onClick={handleShare}
          >
            {copied ? <Check className="h-4 w-4" /> : <Share className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-zinc-100 dark:border-zinc-800 p-4 sm:p-8 shadow-sm">
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
