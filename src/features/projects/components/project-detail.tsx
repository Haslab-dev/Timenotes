import { useState } from 'react'
import {
  IconArrowLeft,
  IconClock,
  IconNotes,
  IconPlus,
  IconPencil,
  IconTrash,
  IconDownload,
  IconUpload,
  IconLayoutList,
  IconCalendarMonth,
} from '@tabler/icons-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useProjects, useUpdateProject, useDeleteProject } from '../hooks/use-projects'
import {
  useTimeEntries,
  useCreateTimeEntry,
  useDeleteTimeEntry,
} from '@/features/timesheet/hooks/use-timesheet'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { ImportMarkdownDialog } from '@/features/notes/components/import-markdown-dialog'
import { ProjectForm } from './project-form'
import { CompactTimesheetTable } from '@/features/timesheet/components/compact-timesheet-table'
import { TimesheetCalendar } from '@/features/timesheet/components/timesheet-calendar'
import { TimeEntryForm } from '@/features/timesheet/components/time-entry-form'
import { exportTimeEntriesToCsv, exportNotesToCsv } from '@/lib/utils/csv-export'
import { formatDuration } from '@/lib/utils'
import type { UpdateProjectRequest, CreateTimeEntryRequest } from '@/lib/types'
import { format } from 'date-fns'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'overview' | 'timesheet' | 'notes'>('overview')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isTimeEntryDialogOpen, setIsTimeEntryDialogOpen] = useState(false)
  const [isImportMdOpen, setIsImportMdOpen] = useState(false)
  const [timesheetView, setTimesheetView] = useState<'list' | 'calendar'>('list')

  const { data: projects } = useProjects()
  const { data: timeEntries = [] } = useTimeEntries()
  const { data: notes = [] } = useNotes()

  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()
  const createTimeEntryMutation = useCreateTimeEntry()
  const deleteTimeEntryMutation = useDeleteTimeEntry()

  const project = projects?.find((p) => p.id === projectId)
  const projectTimeEntries = timeEntries.filter((entry) => entry.projectId === projectId)
  const projectNotes = notes.filter((note) => note.projectId === projectId)

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground space-y-3">
          <div className="text-base font-medium">Project not found</div>
          <Link to="/projects">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalMinutes = projectTimeEntries.reduce(
    (sum, entry) => sum + (Number(entry.duration) || 0),
    0
  )
  const totalEntries = projectTimeEntries.length
  const totalNotes = projectNotes.length

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    try {
      await updateMutation.mutateAsync({ id: project.id, data })
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure? This will delete all associated time entries and notes.')) {
      return
    }

    try {
      await deleteMutation.mutateAsync(project.id)
      navigate('/projects')
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleCreateTimeEntry = async (data: CreateTimeEntryRequest) => {
    try {
      const entryData = { ...data, projectId: project.id }
      await createTimeEntryMutation.mutateAsync(entryData)
      setIsTimeEntryDialogOpen(false)
    } catch (error) {
      console.error('Failed to create time entry:', error)
    }
  }

  const handleDeleteTimeEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time entry?')) {
      return
    }

    try {
      await deleteTimeEntryMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete time entry:', error)
    }
  }

  const handleExportTimesheet = () => {
    exportTimeEntriesToCsv(projectTimeEntries, [project], `${project.name}-timesheet-export.csv`)
  }

  const handleExportNotes = () => {
    exportNotesToCsv(projectNotes, [project], `${project.name}-notes-export.csv`)
  }

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: IconNotes },
    { key: 'timesheet' as const, label: 'Time Entries', icon: IconClock, count: totalEntries },
    { key: 'notes' as const, label: 'Notes', icon: IconNotes, count: totalNotes },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/projects">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <IconArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-sm shrink-0"
            style={{ backgroundColor: project.color }}
          >
            {project.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 text-left">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground truncate">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <IconPencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <ProjectForm
                project={project}
                onSubmit={handleUpdateProject}
                onCancel={() => setIsEditDialogOpen(false)}
                isLoading={updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteProject}
            disabled={deleteMutation.isPending}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <IconTrash className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-left">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Total Hours</span>
            <IconClock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-2 text-foreground">
            {formatDuration(totalMinutes)}
          </div>
        </Card>

        <Card className="p-4 text-left">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Time Entries</span>
            <IconClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-2 text-foreground">
            {totalEntries}
          </div>
        </Card>

        <Card className="p-4 text-left">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>Notes</span>
            <IconNotes className="h-4 w-4 text-tertiary-foreground" />
          </div>
          <div className="text-xl sm:text-2xl font-semibold tabular-nums mt-2 text-foreground">
            {totalNotes}
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-border overflow-x-auto no-scrollbar">
        <div className="flex min-w-max gap-6">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer',
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== undefined && (
                <Badge
                  variant={activeTab === key ? 'default' : 'secondary'}
                  className="text-[10px] h-4 px-1.5"
                >
                  {count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Time Entries */}
            <Card className="p-5 space-y-4 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <IconClock className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">Recent Time Entries</h3>
                </div>
                {isMobile ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate('/timesheet/new', { state: { projectId: project.id } })}
                  >
                    <IconPlus className="h-3.5 w-3.5 mr-1" />
                    Add Entry
                  </Button>
                ) : (
                  <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <IconPlus className="h-3.5 w-3.5 mr-1" />
                        Add Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>Add Time Entry for {project.name}</DialogTitle>
                      </DialogHeader>
                      <TimeEntryForm
                        onSubmit={handleCreateTimeEntry}
                        onCancel={() => setIsTimeEntryDialogOpen(false)}
                        isLoading={createTimeEntryMutation.isPending}
                        defaultProjectId={project.id}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>

              {projectTimeEntries.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <IconClock className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No time entries yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {projectTimeEntries.slice(0, 5).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between py-2.5 gap-3 hover:bg-secondary/30 transition-colors rounded-md px-2 cursor-pointer"
                      onClick={() => {
                        if (isMobile) {
                          navigate(`/timesheet/${entry.id}/edit`)
                        } else {
                          setSearchParams({ timeEntryId: entry.id })
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="text-xs font-medium text-foreground line-clamp-1">
                          {entry.description?.replace(/<[^>]*>/g, ' ').trim() || 'No description'}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {format(entry.startTime, 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <Badge variant="secondary" className="tabular-nums text-[11px]">
                        {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Notes */}
            <Card className="p-5 space-y-4 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-tertiary">
                    <IconNotes className="h-4 w-4 text-tertiary-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">Recent Notes</h3>
                </div>
                <Button
                  onClick={() => navigate('/notes/new', { state: { projectId: project.id } })}
                  size="sm"
                  variant="outline"
                >
                  <IconPlus className="h-3.5 w-3.5 mr-1" />
                  Add Note
                </Button>
              </div>

              {projectNotes.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <IconNotes className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No notes yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {projectNotes.slice(0, 5).map((note) => (
                    <div
                      key={note.id}
                      className="py-2.5 hover:bg-secondary/30 transition-colors rounded-md px-2 cursor-pointer space-y-1"
                      onClick={() => {
                        if (isMobile) {
                          navigate(`/notes/${note.id}/edit`)
                        } else {
                          setSearchParams({ noteId: note.id })
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium text-foreground truncate">
                          {note.title}
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {format(note.createdAt, 'MMM dd')}
                        </span>
                      </div>
                      {note.content && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {note.content.replace(/<[^>]*>/g, ' ').trim()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'timesheet' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex bg-secondary/70 p-0.5 rounded-lg border border-border">
                <Button
                  variant={timesheetView === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 rounded-md text-xs"
                  onClick={() => setTimesheetView('list')}
                >
                  <IconLayoutList className="h-3.5 w-3.5 mr-1.5" />
                  List
                </Button>
                <Button
                  variant={timesheetView === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 rounded-md text-xs"
                  onClick={() => setTimesheetView('calendar')}
                >
                  <IconCalendarMonth className="h-3.5 w-3.5 mr-1.5" />
                  Calendar
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTimesheet}
                  disabled={projectTimeEntries.length === 0}
                >
                  <IconDownload className="h-4 w-4 mr-1.5" />
                  Export CSV
                </Button>
                {isMobile ? (
                  <Button
                    size="sm"
                    onClick={() => navigate('/timesheet/new', { state: { projectId: project.id } })}
                  >
                    <IconPlus className="h-4 w-4 mr-1.5" />
                    Add Time Entry
                  </Button>
                ) : (
                  <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <IconPlus className="h-4 w-4 mr-1.5" />
                        Add Time Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Time Entry for {project.name}</DialogTitle>
                      </DialogHeader>
                      <TimeEntryForm
                        onSubmit={handleCreateTimeEntry}
                        onCancel={() => setIsTimeEntryDialogOpen(false)}
                        isLoading={createTimeEntryMutation.isPending}
                        defaultProjectId={project.id}
                      />
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {timesheetView === 'list' ? (
              <CompactTimesheetTable
                timeEntries={projectTimeEntries}
                onEdit={(entry) => {
                  if (isMobile) {
                    navigate(`/timesheet/${entry.id}/edit`)
                  } else {
                    navigate(`/timesheet/${entry.id}`)
                  }
                }}
                onDelete={handleDeleteTimeEntry}
              />
            ) : (
              <TimesheetCalendar
                timeEntries={projectTimeEntries}
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
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportNotes}
                disabled={projectNotes.length === 0}
              >
                <IconDownload className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsImportMdOpen(true)}>
                <IconUpload className="h-4 w-4 mr-1.5" />
                Import .md
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/notes/new', { state: { projectId: project.id } })}
              >
                <IconPlus className="h-4 w-4 mr-1.5" />
                New Note
              </Button>
            </div>
            <div className="grid gap-3">
              {projectNotes.map((note) => (
                <Card
                  key={note.id}
                  className="p-4 cursor-pointer hover:border-primary/40 transition-colors text-left"
                  onClick={() => {
                    if (isMobile) {
                      navigate(`/notes/${note.id}/edit`)
                    } else {
                      setSearchParams({ noteId: note.id })
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <h4 className="font-semibold text-sm">{note.title}</h4>
                    <div className="text-xs text-muted-foreground">
                      {format(note.createdAt, 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {note.content.replace(/<[^>]*>/g, ' ').trim()}
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-[11px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
              {projectNotes.length === 0 && (
                <Card className="p-12 text-center">
                  <IconNotes className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No notes for this project yet</p>
                </Card>
              )}
            </div>
            <ImportMarkdownDialog
              open={isImportMdOpen}
              onOpenChange={setIsImportMdOpen}
              defaultProjectId={project.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}
