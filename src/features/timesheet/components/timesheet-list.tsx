import {
  IconPlus,
  IconClock,
  IconDownload,
  IconLayoutList,
  IconCalendarMonth,
} from '@tabler/icons-react'
import { useState, useMemo, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { useSearchParams, useNavigate, useLocation } from 'react-router'
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

  useEffect(() => {
    const timeEntryId = searchParams.get('timeEntryId')
    if (timeEntryId && isMobile) {
      navigate(`/timesheet/${timeEntryId}/edit`)
    }
  }, [searchParams, isMobile, navigate])

  const createMutation = useCreateTimeEntry()
  const deleteMutation = useDeleteTimeEntry()

  const { filters, filteredData, updateFilters, clearFilters, hasActiveFilters } =
    useTimesheetFilters(timeEntries)

  const {
    data: paginatedTimeEntries,
    pagination,
    goToPage,
    setPageSize,
  } = usePagination(filteredData, 25)

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
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">Loading timesheet...</div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheet"
        description="Review, filter, and manage your logged time entries."
        badge={<Badge variant="secondary">{timeEntries.length}</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex bg-secondary/70 p-0.5 rounded-lg border border-border">
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 rounded-md text-xs"
                onClick={() => setView('list')}
              >
                <IconLayoutList className="h-3.5 w-3.5 mr-1.5" />
                List
              </Button>
              <Button
                variant={view === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 rounded-md text-xs"
                onClick={() => setView('calendar')}
              >
                <IconCalendarMonth className="h-3.5 w-3.5 mr-1.5" />
                Calendar
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filteredData.length === 0}
            >
              <IconDownload className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>

            {isMobile ? (
              <Button size="sm" onClick={() => navigate('/timesheet/new')}>
                <IconPlus className="h-4 w-4 mr-1.5" />
                Add Entry
              </Button>
            ) : (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <IconPlus className="h-4 w-4 mr-1.5" />
                    Add Entry
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
          </div>
        }
      />

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
        <div className="text-xs text-muted-foreground text-left">
          Showing <strong className="font-medium text-foreground">{filteredData.length}</strong> of{' '}
          <strong className="font-medium text-foreground">{timeEntries.length}</strong> time entries
        </div>
      )}

      {timeEntries.length === 0 ? (
        <Card className="p-12 text-center">
          <IconClock className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No time entries yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Start a focus session or log a manual entry to track your work.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <IconPlus className="h-4 w-4 mr-1.5" />
                Add your first time entry
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">
            <div className="text-sm font-medium text-foreground mb-1">
              No time entries match your filters
            </div>
            <div className="text-xs">Try adjusting your search criteria</div>
          </div>
        </Card>
      ) : view === 'list' ? (
        <div className="space-y-4">
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
