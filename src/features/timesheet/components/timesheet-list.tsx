import { Plus, Clock, Download, LayoutList, Calendar as CalendarIcon } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { TimeEntryForm } from './time-entry-form'
import { CompactTimesheetTable } from './compact-timesheet-table'
import { TimesheetCalendar } from './timesheet-calendar'
import { TimesheetFiltersComponent } from './timesheet-filters'
import { useTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from '../hooks/use-timesheet'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useTimesheetFilters } from '@/lib/hooks/use-filters'
import { usePagination } from '@/lib/hooks/use-pagination'
import { exportTimeEntriesToCsv } from '@/lib/utils/csv-export'
import type { CreateTimeEntryRequest } from '@/lib/types'

export function TimesheetList() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [searchParams] = useSearchParams()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [view, setView] = useState<'list' | 'calendar'>('list')

  // Handle "Start New Timer" from Dashboard
  useEffect(() => {
    if (location.state?.openTimer) {
      if (isMobile) {
        navigate('/timesheet/new', { replace: true })
      } else {
        setIsCreateDialogOpen(true)
      }
    }
  }, [location.state, isMobile, navigate])

  const { data: timeEntries = [], isLoading } = useTimeEntries()
  const { data: projects = [] } = useProjects()

  // Handle URL params for editing a specific entry
  useEffect(() => {
    const timeEntryId = searchParams.get('timeEntryId')
    if (timeEntryId && isMobile) {
      // If on mobile, redirect to edit page
      navigate(`/timesheet/${timeEntryId}/edit`)
    }
  }, [searchParams, isMobile, navigate])
  const createMutation = useCreateTimeEntry()
  const deleteMutation = useDeleteTimeEntry()

  // Apply filters
  const { filters, filteredData, updateFilters, clearFilters, hasActiveFilters } =
    useTimesheetFilters(timeEntries)

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
    timeEntries.forEach((entry) => {
      entry.tags.forEach((tag) => tags.add(tag))
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

  const handleDeleteTimeEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete time entry:', error)
    }
  }

  const handleExportCsv = () => {
    exportTimeEntriesToCsv(filteredData, projects)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading timesheet...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold px-0.5 text-left">Timesheet</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex bg-muted p-1 rounded-lg self-start border shadow-sm">
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="sm"
              className={[
                'h-8 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer',
                view === 'list' ? 'shadow-sm' : 'hover:bg-muted-foreground/10',
              ].join(' ')}
              onClick={() => setView('list')}
            >
              <LayoutList className="h-3.5 w-3.5 mr-1.5" />
              List
            </Button>
            <Button
              variant={view === 'calendar' ? 'default' : 'ghost'}
              size="sm"
              className={[
                'h-8 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer',
                view === 'calendar' ? 'shadow-sm' : 'hover:bg-muted-foreground/10',
              ].join(' ')}
              onClick={() => setView('calendar')}
            >
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
              Calendar
            </Button>
          </div>

          <div className="flex-1" />

          {isMobile ? (
            <Button className="w-full h-10 shadow-sm" onClick={() => navigate('/timesheet/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Time Entry
            </Button>
          ) : (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto h-10">
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
          )}
          <Button
            variant="outline"
            size="default"
            onClick={handleExportCsv}
            disabled={filteredData.length === 0}
            className="w-full sm:w-auto h-10 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
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
      ) : view === 'list' ? (
        <div className="space-y-4">
          {/* Compact Table */}
          <CompactTimesheetTable
            timeEntries={paginatedTimeEntries}
            onEdit={(entry) => {
              if (isMobile) {
                navigate(`/timesheet/${entry.id}/edit`)
              } else {
                navigate(`/timesheet/${entry.id}`)
              }
            }}
            onDelete={handleDeleteTimeEntry}
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
      ) : (
        <TimesheetCalendar
          timeEntries={filteredData}
          onSelectEntry={(entry) => {
            if (isMobile) {
              navigate(`/timesheet/${entry.id}/edit`)
            } else {
              navigate(`/timesheet/${entry.id}`)
            }
          }}
        />
      )}
    </div>
  )
}
