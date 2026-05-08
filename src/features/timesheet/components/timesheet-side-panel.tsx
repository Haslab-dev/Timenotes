import { useSearchParams, useParams, useLocation, useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { TimeEntryForm } from './time-entry-form'
import { useUpdateTimeEntry, useTimeEntry } from '../hooks/use-timesheet'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import type { UpdateTimeEntryRequest } from '@/lib/types'

export function TimesheetSidePanel() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: pathId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const isMobile = useIsMobile()

  // Detect ID from search param OR from clean path /timesheet/:id
  const isTimesheetPath =
    location.pathname.startsWith('/timesheet/') && !location.pathname.endsWith('/edit')
  const timeEntryId = searchParams.get('timeEntryId') || (isTimesheetPath ? pathId : null)

  const { data: timeEntry, isLoading } = useTimeEntry(timeEntryId || '')
  const updateMutation = useUpdateTimeEntry()

  const isOpen = !!timeEntryId && !isMobile

  const handleClose = () => {
    if (pathId && isTimesheetPath) {
      navigate('/timesheet', { replace: true })
    } else {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.delete('timeEntryId')
          return next
        },
        { replace: true }
      )
    }
  }

  const handleUpdate = async (data: UpdateTimeEntryRequest) => {
    if (!timeEntryId) return
    try {
      await updateMutation.mutateAsync({ id: timeEntryId, data })
      handleClose() // Timesheet entries are usually smaller edits, closing might be better?
      // Or keep it open. Let's keep it open for now for consistency with notes if preferred,
      // but usually editing an entry is a "done" action.
      // Actually, let's close it to match standard "edit" behavior if it's a modal replacement.
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Edit Time Entry</SheetTitle>
        </SheetHeader>

        {timeEntryId && isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : timeEntry ? (
          <TimeEntryForm
            timeEntry={timeEntry}
            onSubmit={handleUpdate}
            onCancel={handleClose}
            isLoading={updateMutation.isPending}
          />
        ) : (
          <div className="text-center py-12 text-muted-foreground">Entry not found</div>
        )}
      </SheetContent>
    </Sheet>
  )
}
