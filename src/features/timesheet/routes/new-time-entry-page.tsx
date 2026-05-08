import { useLocation, useNavigate } from 'react-router-dom'
import { useCreateTimeEntry } from '../hooks/use-timesheet'
import { TimeEntryForm } from '../components/time-entry-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

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
    <div className="space-y-6 max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">New Time Entry</h1>
      </div>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <TimeEntryForm
          onSubmit={handleCreate}
          onCancel={() => navigate(-1)}
          isLoading={createMutation.isPending}
          defaultProjectId={defaultProjectId}
        />
      </div>
    </div>
  )
}
