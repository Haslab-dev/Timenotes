import { useNavigate, useParams } from 'react-router'
import { useEffect } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useTimeEntry, useUpdateTimeEntry } from '../hooks/use-timesheet'
import { TimeEntryForm } from '../components/time-entry-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconArrowLeft } from '@tabler/icons-react'

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
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Loading time entry...</div>
    )
  }

  if (!timeEntry) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">Time entry not found</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <IconArrowLeft className="h-4 w-4 mr-1.5" />
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <IconArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>
        <h1 className="text-xl font-semibold tracking-tight">Edit Time Entry</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <TimeEntryForm
            timeEntry={timeEntry}
            onSubmit={handleUpdate}
            onCancel={() => navigate(-1)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
