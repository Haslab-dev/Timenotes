import { NotesList } from '../components/notes-list'
import { useParams, Navigate } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'

export function NotesPage() {
  const { id } = useParams()
  const isMobile = useIsMobile()

  // On mobile, clean path /notes/:id should redirect to edit page
  if (isMobile && id) {
    return <Navigate to={`/notes/${id}/edit`} replace />
  }

  return <NotesList />
}
