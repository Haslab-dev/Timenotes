import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useDeleteTimeEntry } from '../hooks/use-timesheet'
import type { TimeEntry } from '@/lib/types'

interface CompactTimesheetTableProps {
  timeEntries: TimeEntry[]
  onEdit: (entry: TimeEntry) => void
}

export function CompactTimesheetTable({ timeEntries, onEdit }: CompactTimesheetTableProps) {
  const { data: projects } = useProjects()
  const deleteTimeEntry = useDeleteTimeEntry()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getProjectName = (projectId: string | undefined) => {
    if (!projectId) return 'No Project'
    return projects?.find(p => p.id === projectId)?.name || 'Unknown Project'
  }

  const getProjectColor = (projectId: string | undefined) => {
    if (!projectId) return '#6b7280'
    return projects?.find(p => p.id === projectId)?.color || '#6b7280'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm')
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd')
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) return
    
    setDeletingId(id)
    try {
      await deleteTimeEntry.mutateAsync(id)
    } finally {
      setDeletingId(null)
    }
  }

  if (timeEntries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <div className="text-lg mb-2">No time entries found</div>
          <div className="text-sm">Start tracking your time to see entries here</div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table - Hidden on mobile */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="w-20">Date</TableHead>
              <TableHead className="w-24">Time</TableHead>
              <TableHead className="w-20">Duration</TableHead>
              <TableHead className="min-w-32">Project</TableHead>
              <TableHead className="min-w-48">Description</TableHead>
              <TableHead className="w-32">Tags</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeEntries.map((entry) => (
              <TableRow key={entry.id} className="h-12">
                <TableCell className="py-2 text-sm">
                  {formatDate(entry.startTime)}
                </TableCell>
                
                <TableCell className="py-2 text-sm font-mono">
                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                </TableCell>
                
                <TableCell className="py-2 text-sm font-medium">
                  {formatDuration(entry.duration)}
                </TableCell>
                
                <TableCell className="py-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getProjectColor(entry.projectId) }}
                    />
                    <span className="text-sm font-medium truncate">
                      {getProjectName(entry.projectId)}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell className="py-2">
                  <div className="text-sm text-muted-foreground truncate max-w-48">
                    {entry.description || 'No description'}
                  </div>
                </TableCell>
                
                <TableCell className="py-2">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.length > 0 ? (
                      entry.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs h-5 px-1">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">No tags</span>
                    )}
                    {entry.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs h-5 px-1">
                        +{entry.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        disabled={deletingId === entry.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEdit(entry)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(entry.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card Layout - Shown only on mobile */}
      <div className="md:hidden space-y-3">
        {timeEntries.map((entry) => (
          <div
            key={entry.id}
            className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-sm transition-shadow"
          >
            {/* Header with Date, Duration and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">
                  {formatDate(entry.startTime)}
                </div>
                <div className="text-sm text-muted-foreground font-mono">
                  {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs h-6 px-2">
                  {formatDuration(entry.duration)}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      disabled={deletingId === entry.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onEdit(entry)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDelete(entry.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Project */}
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getProjectColor(entry.projectId) }}
              />
              <span className="text-sm font-medium">
                {getProjectName(entry.projectId)}
              </span>
            </div>

            {/* Description */}
            {entry.description && (
              <div className="text-sm text-muted-foreground">
                {entry.description}
              </div>
            )}

            {/* Tags */}
            {entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs h-5 px-2">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
