import { useState } from 'react'
import {
  ArrowLeft,
  Clock,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Download,
  LayoutList,
  Calendar as CalendarIcon,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
        <div className="text-muted-foreground">
          <div className="text-lg mb-2">Project not found</div>
          <Link to="/projects">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Calculate project statistics
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
    { key: 'overview' as const, label: 'Overview', icon: FileText },
    { key: 'timesheet' as const, label: 'Time Entries', icon: Clock, count: totalEntries },
    { key: 'notes' as const, label: 'Notes', icon: FileText, count: totalNotes },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link to="/projects">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm text-white font-bold text-xl"
              style={{ backgroundColor: project.color }}
            >
              {project.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-left">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none h-9">
                <Edit2 className="h-4 w-4 mr-2" />
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
            className="text-destructive hover:text-destructive flex-1 sm:flex-none h-9"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Stats Cards - More compact on mobile */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card rounded-xl border p-3 sm:p-6 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            Hours
          </div>
          <div className="text-sm sm:text-2xl font-bold text-left">
            {formatDuration(totalMinutes)}
          </div>
        </div>

        <div className="bg-card rounded-xl border p-3 sm:p-6 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            Entries
          </div>
          <div className="text-sm sm:text-2xl font-bold text-left">{totalEntries}</div>
        </div>

        <div className="bg-card rounded-xl border p-3 sm:p-6 space-y-1 sm:space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
            Notes
          </div>
          <div className="text-sm sm:text-2xl font-bold text-left">{totalNotes}</div>
        </div>
      </div>

      {/* Tabs - Horizontal scroll on mobile */}
      <div className="border-b overflow-x-auto no-scrollbar">
        <div className="flex min-w-max sm:space-x-8 px-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-2 py-4 px-4 sm:px-1 text-sm font-medium border-b-2 transition-all whitespace-nowrap',
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
                  className="ml-1 text-[10px] h-4.5 px-1.5"
                >
                  {count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-slide-up">
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
              {/* Recent Time Entries */}
              <div className="bg-gradient-to-br from-card to-muted/10 rounded-xl border p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base">Recent Time Entries</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {isMobile ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="w-full h-9 shadow-sm bg-primary hover:bg-primary/90"
                        onClick={() =>
                          navigate('/timesheet/new', { state: { projectId: project.id } })
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                      </Button>
                    ) : (
                      <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="w-auto h-9">
                            <Plus className="h-4 w-4 mr-2" />
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
                </div>

                {projectTimeEntries.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No time entries yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {projectTimeEntries.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="group">
                        {/* Mobile Card Layout */}
                        <div
                          className="sm:hidden bg-background/50 rounded-lg border p-3 space-y-2.5 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            if (isMobile) {
                              navigate(`/timesheet/${entry.id}/edit`)
                            } else {
                              setSearchParams({ timeEntryId: entry.id })
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium break-words line-clamp-2 mb-1">
                                {entry.description || 'No description'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(entry.startTime, 'MMM dd, yyyy')}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-primary/10 rounded-full px-2.5 py-1">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="text-xs font-medium text-primary whitespace-nowrap">
                                {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div
                          className="hidden sm:flex items-start justify-between py-2 border-b last:border-b-0 gap-3 hover:bg-muted/30 transition-colors duration-200 rounded-md px-2 cursor-pointer"
                          onClick={() => {
                            if (isMobile) {
                              navigate(`/timesheet/${entry.id}/edit`)
                            } else {
                              setSearchParams({ timeEntryId: entry.id })
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="text-sm font-medium break-words line-clamp-2">
                              {entry.description || 'No description'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(entry.startTime, 'MMM dd, yyyy')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-secondary/50 rounded-full px-2.5 py-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                              {Math.floor(entry.duration / 60)}h {entry.duration % 60}m
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Notes */}
              <div className="bg-gradient-to-br from-card to-muted/10 rounded-xl border p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base">Recent Notes</h3>
                  </div>
                  <Button
                    onClick={() => navigate('/notes/new', { state: { projectId: project.id } })}
                    size="sm"
                    variant={isMobile ? 'default' : 'outline'}
                    className="w-full sm:w-auto h-9 shadow-sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                </div>

                {projectNotes.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No notes yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {projectNotes.slice(0, 3).map((note) => (
                      <div key={note.id} className="group">
                        {/* Mobile Card Layout */}
                        <div
                          className="sm:hidden bg-background/50 rounded-lg border p-3 space-y-2.5 hover:shadow-md transition-all duration-200 cursor-pointer"
                          onClick={() => {
                            if (isMobile) {
                              navigate(`/notes/${note.id}/edit`)
                            } else {
                              setSearchParams({ noteId: note.id })
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate mb-1">{note.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(note.createdAt, 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                          {note.content && (
                            <div className="bg-muted/30 rounded-md p-2 ml-1">
                              <div className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                                {note.content}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Desktop Layout */}
                        <div
                          className="hidden sm:block py-2 border-b last:border-b-0 hover:bg-muted/30 transition-colors duration-200 rounded-md px-2 cursor-pointer"
                          onClick={() => {
                            if (isMobile) {
                              navigate(`/notes/${note.id}/edit`)
                            } else {
                              setSearchParams({ noteId: note.id })
                            }
                          }}
                        >
                          <div className="space-y-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="text-sm font-medium truncate flex-1 min-w-0">
                                {note.title}
                              </div>
                              <span className="text-xs text-muted-foreground bg-secondary/30 rounded-full px-2 py-0.5 whitespace-nowrap">
                                {format(note.createdAt, 'MMM dd, yyyy')}
                              </span>
                            </div>
                            {note.content && (
                              <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-muted/20 rounded-md p-2">
                                {note.content}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timesheet' && (
          <div className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Time Entries</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {isMobile ? (
                  <Button
                    className="w-full h-9 shadow-sm"
                    onClick={() => navigate('/timesheet/new', { state: { projectId: project.id } })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Time Entry
                  </Button>
                ) : (
                  <Dialog open={isTimeEntryDialogOpen} onOpenChange={setIsTimeEntryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto h-9">
                        <Plus className="h-4 w-4 mr-2" />
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTimesheet}
                  disabled={projectTimeEntries.length === 0}
                  className="w-full sm:w-auto h-9"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>

                <div className="flex bg-muted p-1 rounded-lg self-start border shadow-sm">
                  <Button
                    variant={timesheetView === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className={[
                      'h-8 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer',
                      timesheetView === 'list' ? 'shadow-sm' : 'hover:bg-muted-foreground/10',
                    ].join(' ')}
                    onClick={() => setTimesheetView('list')}
                  >
                    <LayoutList className="h-3.5 w-3.5 mr-1.5" />
                    List
                  </Button>
                  <Button
                    variant={timesheetView === 'calendar' ? 'default' : 'ghost'}
                    size="sm"
                    className={[
                      'h-8 px-4 rounded-md text-xs font-bold transition-all duration-200 cursor-pointer',
                      timesheetView === 'calendar' ? 'shadow-sm' : 'hover:bg-muted-foreground/10',
                    ].join(' ')}
                    onClick={() => setTimesheetView('calendar')}
                  >
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                    Calendar
                  </Button>
                </div>
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notes</h3>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={() => navigate('/notes/new', { state: { projectId: project.id } })}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Note
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleExportNotes}
                  disabled={projectNotes.length === 0}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {projectNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-card rounded-lg border p-4 sm:p-6 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => {
                    if (isMobile) {
                      navigate(`/notes/${note.id}/edit`)
                    } else {
                      setSearchParams({ noteId: note.id })
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold">{note.title}</h4>
                    <div className="text-xs text-muted-foreground">
                      {format(note.createdAt, 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content}
                  </div>
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {projectNotes.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No notes for this project yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
