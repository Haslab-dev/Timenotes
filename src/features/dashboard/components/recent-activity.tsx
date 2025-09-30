import { Clock, FileText } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'
import { useProjects } from '@/features/projects/hooks/use-projects'

interface RecentActivityProps {
  stats: DashboardStats
}

export function RecentActivity({ stats }: RecentActivityProps) {
  const { data: projects = [] } = useProjects()

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Recent Time Entries */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h3 className="font-semibold">Recent Time Entries</h3>
        </div>
        
        {stats.recentTimeEntries.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No time entries yet
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentTimeEntries.map((entry) => {
              const project = getProjectById(entry.projectId)
              return (
                <div key={entry.id} className="flex items-start gap-3">
                  {project && (
                    <div
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {project?.name || 'Unknown Project'}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDuration(entry.duration)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(entry.startTime)}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {entry.description}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Notes */}
      <div className="border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h3 className="font-semibold">Recent Notes</h3>
        </div>
        
        {stats.recentNotes.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No notes yet
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentNotes.map((note) => {
              const project = note.projectId ? getProjectById(note.projectId) : null
              return (
                <div key={note.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    {project && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                    )}
                    <p className="text-sm font-medium truncate">{note.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </p>
                  {note.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {note.content.substring(0, 100)}
                      {note.content.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
