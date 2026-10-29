import { useLocation, useNavigate } from 'react-router'
import { useCreateTimeEntry } from '../hooks/use-timesheet'
import { TimeEntryForm } from '../components/time-entry-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconArrowLeft } from '@tabler/icons-react'

export function NewTimeEntryPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const createMutation = useCreateTimeEntry()

  const defaultProjectId = location.state?.projectId

  const handleCreate = async (data: any) => {
    try {
      await createMutation.mutateAsync(data)
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
        <h1 className="text-xl font-semibold tracking-tight">New Time Entry</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <TimeEntryForm
            onSubmit={handleCreate}
            onCancel={() => navigate(-1)}
            isLoading={createMutation.isPending}
            defaultProjectId={defaultProjectId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
