import { useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useTimeEntry, useUpdateTimeEntry } from '../hooks/use-timesheet'
import { TimeEntryForm } from '../components/time-entry-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function EditTimeEntryPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { data: timeEntry, isLoading } = useTimeEntry(id!)
  const updateMutation = useUpdateTimeEntry()

  useEffect(() => {
    if (!isMobile && id) {
      navigate(`/timesheet/${id}`, { replace: true })
    }
  }, [isMobile, id, navigate])

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading time entry...</div>
  }

  if (!timeEntry) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">Time entry not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const handleUpdate = async (data: any) => {
    try {
      await updateMutation.mutateAsync({ id: timeEntry.id, data })
      navigate(-1)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Time Entry</h1>
      </div>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <TimeEntryForm
          timeEntry={timeEntry}
          onSubmit={handleUpdate}
          onCancel={() => navigate(-1)}
          isLoading={updateMutation.isPending}
        />
      </div>
    </div>
  )
}
