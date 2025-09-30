import { useState, useMemo } from 'react'
import { Plus, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { TimeEntryForm } from './time-entry-form'
import { CompactTimesheetTable } from './compact-timesheet-table'
import { TimesheetFiltersComponent } from './timesheet-filters'
import { useTimeEntries, useCreateTimeEntry, useUpdateTimeEntry } from '../hooks/use-timesheet'
import { useTimesheetFilters } from '@/lib/hooks/use-filters'
import { usePagination } from '@/lib/hooks/use-pagination'
import type { TimeEntry, CreateTimeEntryRequest, UpdateTimeEntryRequest } from '@/lib/types'

export function TimesheetList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null)

  const { data: timeEntries = [], isLoading } = useTimeEntries()
  const createMutation = useCreateTimeEntry()
  const updateMutation = useUpdateTimeEntry()

  // Apply filters
  const {
    filters,
    filteredData,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  } = useTimesheetFilters(timeEntries)

  // Apply pagination (25 items per page for compact view)
  const {
    data: paginatedTimeEntries,
    pagination,
    goToPage,

    setPageSize,
  } = usePagination(filteredData, 25)

  // Get unique tags from all time entries for filter options
  const availableTags = useMemo(() => {
    if (!timeEntries) return []
    const tags = new Set<string>()
    timeEntries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [timeEntries])

  const handleCreateTimeEntry = async (data: CreateTimeEntryRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create time entry:', error)
    }
  }

  const handleUpdateTimeEntry = async (data: UpdateTimeEntryRequest) => {
    if (!editingTimeEntry) return
    
    try {
      await updateMutation.mutateAsync({ id: editingTimeEntry.id, data })
      setEditingTimeEntry(null)
    } catch (error) {
      console.error('Failed to update time entry:', error)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading timesheet...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Timesheet</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Time Entry</DialogTitle>
            </DialogHeader>
            <TimeEntryForm
              onSubmit={handleCreateTimeEntry}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <TimesheetFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        availableTags={availableTags}
      />

      {/* Results Summary */}
      {filteredData.length !== timeEntries.length && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {timeEntries.length} time entries
          {hasActiveFilters && (
            <span className="ml-2 font-medium">
              ({pagination.total} results match current filters)
            </span>
          )}
        </div>
      )}

      {timeEntries.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No time entries yet</p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add your first time entry</Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <div className="text-lg mb-2">No time entries match your filters</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Compact Table */}
          <CompactTimesheetTable 
            timeEntries={paginatedTimeEntries} 
            onEdit={setEditingTimeEntry} 
          />

          {/* Pagination */}
          {filteredData.length > 0 && (
            <Pagination
              page={pagination.page}
              pageSize={pagination.pageSize}
              total={pagination.total}
              totalPages={pagination.totalPages}
              hasNext={pagination.hasNext}
              hasPrevious={pagination.hasPrevious}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTimeEntry} onOpenChange={() => setEditingTimeEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          {editingTimeEntry && (
            <TimeEntryForm
              timeEntry={editingTimeEntry}
              onSubmit={handleUpdateTimeEntry}
              onCancel={() => setEditingTimeEntry(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
