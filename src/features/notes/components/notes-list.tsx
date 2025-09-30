import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/pagination'
import { NoteForm } from './note-form'
import { NotesFiltersComponent } from './notes-filters'
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/use-notes'
import { useNotesFilters } from '@/lib/hooks/use-filters'
import { usePagination } from '@/lib/hooks/use-pagination'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { Note, CreateNoteRequest, UpdateNoteRequest } from '@/lib/types'

export function NotesList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)

  const { data: notes = [], isLoading } = useNotes()
  const { data: projects = [] } = useProjects()
  const createMutation = useCreateNote()
  const updateMutation = useUpdateNote()
  const deleteMutation = useDeleteNote()

  // Apply filters
  const {
    filters,
    filteredData,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  } = useNotesFilters(notes)

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
    notes.forEach(note => {
      note.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [notes])

  const handleCreateNote = async (data: CreateNoteRequest) => {
    try {
      await createMutation.mutateAsync(data)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const handleUpdateNote = async (data: UpdateNoteRequest) => {
    if (!editingNote) return
    
    try {
      await updateMutation.mutateAsync({ id: editingNote.id, data })
      setEditingNote(null)
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return
    }
    
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const getProjectById = (projectId: string) => {
    return projects.find(p => p.id === projectId)
  }

  const truncateContent = (content: string, limit = 150) => {
    if (content.length <= limit) return content
    return content.substring(0, limit) + '...'
  }

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading notes...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Notes & Ideas</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Note</DialogTitle>
            </DialogHeader>
            <NoteForm
              onSubmit={handleCreateNote}
              onCancel={() => setIsCreateDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create your first note</Button>
            </DialogTrigger>
          </Dialog>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            <div className="text-lg mb-2">No notes match your filters</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Notes Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedNotes.map((note) => {
            const project = note.projectId ? getProjectById(note.projectId) : null
            
            return (
              <div
                key={note.id}
                className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow bg-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{note.title}</h3>
                    {project && (
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="text-xs text-muted-foreground truncate">
                          {project.name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingNote(note)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {note.content && (
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {truncateContent(note.content)}
                  </p>
                )}
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Updated {new Date(note.updatedAt).toLocaleDateString()}
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

      {/* Edit Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <NoteForm
              note={editingNote}
              onSubmit={handleUpdateNote}
              onCancel={() => setEditingNote(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
