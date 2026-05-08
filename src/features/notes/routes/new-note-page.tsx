import { useLocation, useNavigate } from 'react-router-dom'
import { useCreateNote } from '../hooks/use-notes'
import { NoteForm } from '../components/note-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export function NewNotePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const createMutation = useCreateNote()

  const defaultProjectId = location.state?.projectId
  const defaultTitle = location.state?.title
  const defaultTimeEntryId = location.state?.timeEntryId

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
        <h1 className="text-2xl font-bold">New Note</h1>
      </div>

      <div className="bg-card rounded-2xl border p-6 shadow-sm">
        <NoteForm
          onSubmit={handleCreate}
          onCancel={() => navigate(-1)}
          isLoading={createMutation.isPending}
          defaultProjectId={defaultProjectId}
          defaultTitle={defaultTitle}
          defaultTimeEntryId={defaultTimeEntryId}
        />
      </div>
    </div>
  )
}
