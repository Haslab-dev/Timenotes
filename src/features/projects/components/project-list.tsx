import { useState } from 'react'
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconClock,
  IconNotes,
  IconDownload,
  IconFolder,
} from '@tabler/icons-react'
import { Link } from 'react-router'
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
import { ProjectForm } from './project-form'
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '../hooks/use-projects'
import { useTimeEntries } from '@/features/timesheet/hooks/use-timesheet'
import { useNotes } from '@/features/notes/hooks/use-notes'
import { exportProjectsToCsv } from '@/lib/utils/csv-export'
import { formatDuration } from '@/lib/utils'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/lib/types'

export function ProjectList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useProjects()
  const { data: timeEntries = [] } = useTimeEntries()
  const { data: notes = [] } = useNotes()
  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()
  const deleteMutation = useDeleteProject()

  const getProjectStats = (projectId: string) => {
    const projectTimeEntries = timeEntries.filter((entry) => entry.projectId === projectId)
    const projectNotes = notes.filter((note) => note.projectId === projectId)
    const totalMinutes = projectTimeEntries.reduce(
      (sum, entry) => sum + (Number(entry.duration) || 0),
      0
    )

    return {
      timeEntries: projectTimeEntries.length,
      notes: projectNotes.length,
      totalMinutes,
    }
  }

  const handleCreateProject = async (data: CreateProjectRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create project:', error)
    }
  }

  const handleUpdateProject = async (data: UpdateProjectRequest) => {
    if (!editingProject) return

    try {
      await updateMutation.mutateAsync({ id: editingProject.id, data })
      setEditingProject(null)
    } catch (error) {
      console.error('Failed to update project:', error)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all associated time entries and notes.')) {
      return
    }

    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleExportCsv = () => {
    exportProjectsToCsv(projects, timeEntries, notes)
  }

  if (isLoading) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">Loading projects...</div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organize your workstreams, time tracking, and documentation."
        badge={<Badge variant="secondary">{projects.length}</Badge>}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={projects.length === 0}
            >
              <IconDownload className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <IconPlus className="h-4 w-4 mr-1.5" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                </DialogHeader>
                <ProjectForm
                  onSubmit={handleCreateProject}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {projects.length === 0 ? (
        <Card className="p-12 text-center">
          <IconFolder className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No projects yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create a project to start tracking time and organizing notes.
          </p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <IconPlus className="h-4 w-4 mr-1.5" />
                Create your first project
              </Button>
            </DialogTrigger>
          </Dialog>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const stats = getProjectStats(project.id)
            return (
              <Card
                key={project.id}
                className="group relative p-5 space-y-4 hover:border-primary/40 transition-colors cursor-pointer text-left flex flex-col justify-between"
              >
                <Link to={`/projects/${project.id}`} className="absolute inset-0 z-10" />

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Created {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 relative z-20">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEditingProject(project)
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconClock className="h-3.5 w-3.5 text-primary" />
                    <span className="font-medium text-foreground tabular-nums">
                      {formatDuration(stats.totalMinutes)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <IconNotes className="h-3.5 w-3.5" />
                    <span className="font-medium text-foreground tabular-nums">{stats.notes}</span>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="secondary" className="text-[11px]">
                      {stats.timeEntries} {stats.timeEntries === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingProject} onOpenChange={() => setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              project={editingProject}
              onSubmit={handleUpdateProject}
              onCancel={() => setEditingProject(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
