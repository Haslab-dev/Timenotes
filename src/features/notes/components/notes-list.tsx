import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useNotesFilters } from '@/lib/hooks/use-filters'
import { usePagination } from '@/lib/hooks/use-pagination'

import { exportNotesToCsv } from '@/lib/utils/csv-export'
import { Download, Edit2, FileText, Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useNavigate } from 'react-router'

import { useNotes, useDeleteNote } from '../hooks/use-notes'
import { NotesFiltersComponent } from './notes-filters'

export function NotesList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { data: notes = [], isLoading } = useNotes()
  const { data: projects = [] } = useProjects()

  const handleNoteClick = (noteId: string) => {
    if (isMobile) {
      navigate(`/notes/${noteId}/edit`)
    } else {
      navigate(`/notes/${noteId}`)
    }
  }
  const deleteMutation = useDeleteNote()

  // Apply filters
  const { filters, filteredData, updateFilters, clearFilters, hasActiveFilters } =
    useNotesFilters(notes)

  // Apply pagination (10 items per page for notes)
  const {
    data: paginatedNotes,
    pagination,
    goToPage,

    setPageSize,
  } = usePagination(filteredData, 10)

  // Get unique tags from all notes for filter options
  const availableTags = useMemo(() => {
    if (!notes) return []
    const tags = new Set<string>()
    notes.forEach((note) => {
      note.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [notes])

  const handleDeleteNote = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteMutation.mutateAsync(id)
      } catch (error) {
        console.error('Failed to delete note:', error)
      }
    }
  }

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId)
  }

  const handleExportCsv = () => {
    exportNotesToCsv(filteredData, projects)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl sm:text-2xl font-bold px-0.5 text-left">Notes & Ideas</h2>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              className="w-full sm:w-auto h-10 shadow-sm"
              onClick={() => navigate('/notes/new')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
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
      </div>

      {/* Filters */}
      <NotesFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        availableTags={availableTags}
      />

      {/* Results Summary */}
      {filteredData.length !== notes.length && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredData.length} of {notes.length} notes
          {hasActiveFilters && (
            <span className="ml-2 font-medium">
              ({pagination.total} results match current filters)
            </span>
          )}
        </div>
      )}

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No notes yet</p>
          <Button onClick={() => navigate('/notes/new')}>Create your first note</Button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <div className="text-lg mb-2">No notes match your filters</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-20 md:pb-4">
          {/* Notes List */}
          <div className="space-y-3">
            {paginatedNotes.map((note) => {
              const project = note.projectId ? getProjectById(note.projectId) : null

              return (
                <div
                  key={note.id}
                  className="group border rounded-2xl p-3.5 sm:p-5 space-y-2 sm:space-y-3 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all bg-card cursor-pointer relative overflow-hidden text-left"
                  onClick={() => handleNoteClick(note.id)}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-all" />

                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {note.title}
                      </h3>
                      {project && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-950"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                            {project.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNoteClick(note.id)
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {note.content && (
                    <div
                      className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 relative z-10 break-words tiptap leading-[1.15]"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800 relative z-10">
                    <div className="flex flex-wrap gap-1">
                      {note.tags.length > 0 ? (
                        note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-zinc-400 font-medium">No tags</span>
                      )}
                    </div>
                    <div className="text-[10px] font-medium text-zinc-400">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

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
              pageSizeOptions={[10, 20, 50]}
            />
          )}
        </div>
      )}
    </div>
  )
}
