import { useLocation, useNavigate } from 'react-router'
import { useCreateNote } from '../hooks/use-notes'
import { NoteForm } from '../components/note-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { IconArrowLeft, IconNotes } from '@tabler/icons-react'

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
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => navigate(-1)}>
          <IconArrowLeft className="h-3.5 w-3.5 mr-1" />
          Notes
        </Button>
        <span>/</span>
        <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
          <IconNotes className="h-3.5 w-3.5 text-primary" />
          New Note
        </span>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          <NoteForm
            onSubmit={handleCreate}
            onCancel={() => navigate(-1)}
            isLoading={createMutation.isPending}
            defaultProjectId={defaultProjectId}
            defaultTitle={defaultTitle}
            defaultTimeEntryId={defaultTimeEntryId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
