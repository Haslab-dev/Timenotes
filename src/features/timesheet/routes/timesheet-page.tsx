import { TimesheetList } from '../components/timesheet-list'
import { useParams, Navigate } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'

export function TimesheetPage() {
  const { id } = useParams()
  const isMobile = useIsMobile()

  // On mobile, clean path /timesheet/:id should redirect to edit page
  if (isMobile && id) {
    return <Navigate to={`/timesheet/${id}/edit`} replace />
  }

  return <TimesheetList />
}
