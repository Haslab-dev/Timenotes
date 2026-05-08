import { useState } from 'react'
import { Plus, Edit2, Trash2, Clock, FileText, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  // Helper function to get project stats
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
    return <div className="text-center py-8 text-muted-foreground">Loading projects...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold px-0.5 text-left">Projects</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
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
          <Button
            variant="outline"
            size="default"
            onClick={handleExportCsv}
            disabled={projects.length === 0}
            className="w-full sm:w-auto h-9 sm:h-10 text-xs sm:text-sm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet</p>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create your first project</Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const stats = getProjectStats(project.id)
            return (
              <div
                key={project.id}
                className="group relative bg-card rounded-xl border p-4 sm:p-6 space-y-3 sm:space-y-4 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 hover:scale-[1.02] cursor-pointer text-left"
              >
                <Link to={`/projects/${project.id}`} className="absolute inset-0 z-10" />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-8 h-8 rounded-xl flex-shrink-0 shadow-sm flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.name.substring(0, 2).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex gap-1 relative z-20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setEditingProject(project)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Project Stats */}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="font-medium">{formatDuration(stats.totalMinutes)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="font-medium">{stats.notes}</span>
                  </div>
                  <div className="ml-auto">
                    <Badge variant="secondary" className="text-xs">
                      {stats.timeEntries} entries
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground">
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
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
