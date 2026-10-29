import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useNotesFilters } from '@/lib/hooks/use-filters'
import { usePagination } from '@/lib/hooks/use-pagination'
import { exportNotesToCsv } from '@/lib/utils/csv-export'
import {
  IconDownload,
  IconEdit,
  IconNotes,
  IconPlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { useNavigate } from 'react-router'

import { useNotes, useCreateNote, useDeleteNote } from '../hooks/use-notes'
import { NotesFiltersComponent } from './notes-filters'
import { ImportMarkdownDialog } from './import-markdown-dialog'

export function NotesList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { data: notes = [], isLoading } = useNotes()
  const { data: projects = [] } = useProjects()
  const createNote = useCreateNote()
  const deleteMutation = useDeleteNote()

  const [importOpen, setImportOpen] = useState(false)
  const [dragging, setDragging] = useState(false)

  const handleNoteClick = (noteId: string) => {
    if (isMobile) {
      navigate(`/notes/${noteId}/edit`)
    } else {
      navigate(`/notes/${noteId}`)
    }
  }

  const { filters, filteredData, updateFilters, clearFilters, hasActiveFilters } =
    useNotesFilters(notes)

  const {
    data: paginatedNotes,
    pagination,
    goToPage,
    setPageSize,
  } = usePagination(filteredData, 10)

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

  const handleDownloadMd = (title: string, content: string) => {
    const safeName = (title || 'untitled').replace(/[^a-z0-9-_ ]/gi, '').trim() || 'untitled'
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeName}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files ?? [])
    const importable = droppedFiles.filter((f) => /\.(md|markdown|mdx|txt)$/i.test(f.name))
    if (importable.length === 0) return
    for (const file of importable) {
      const content = await file.text()
      await createNote.mutateAsync({
        title:
          file.name
            .replace(/\.(md|markdown|mdx|txt)$/i, '')
            .replace(/[-_]+/g, ' ')
            .trim() || file.name,
        content,
        tags: ['markdown'],
      })
    }
  }

  const getProjectById = (projectId: string) => {
    return projects.find((p) => p.id === projectId)
  }

  const handleExportCsv = () => {
    exportNotesToCsv(filteredData, projects)
  }

  if (isLoading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Loading notes...</div>
  }

  return (
    <div
      className="flex flex-col gap-6"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <PageHeader
        title="Notes"
        description="Unified workspace for quick notes, markdown documents, and session logs."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={filteredData.length === 0}
            >
              <IconDownload className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <IconUpload className="h-4 w-4 mr-1.5" />
              Import .md
            </Button>
            <Button size="sm" onClick={() => navigate('/notes/new')}>
              <IconPlus className="h-4 w-4 mr-1.5" />
              New Note
            </Button>
          </>
        }
      />

      {dragging && (
        <div className="rounded-xl border border-dashed border-primary bg-tertiary/40 p-6 text-center text-sm font-medium text-tertiary-foreground">
          Drop <code>.md</code> files anywhere to import into Notes
        </div>
      )}

      <NotesFiltersComponent
        filters={filters}
        onFiltersChange={updateFilters}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        availableTags={availableTags}
      />

      {filteredData.length !== notes.length && (
        <div className="text-xs text-muted-foreground">
          Showing {filteredData.length} of {notes.length} notes
          {hasActiveFilters && (
            <span className="ml-2 font-medium">
              ({pagination.total} results match current filters)
            </span>
          )}
        </div>
      )}

      {notes.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-3">
            <IconNotes className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No notes yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Create a note or drop <code>.md</code> files to start organizing your knowledge.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <IconUpload className="h-4 w-4 mr-1.5" />
              Import .md
            </Button>
            <Button size="sm" onClick={() => navigate('/notes/new')}>
              <IconPlus className="h-4 w-4 mr-1.5" />
              Create Note
            </Button>
          </div>
        </Card>
      ) : filteredData.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="text-sm font-medium text-foreground mb-1">
            No notes match your filters
          </div>
          <div className="text-xs text-muted-foreground">Try adjusting your search criteria</div>
        </Card>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3 pb-20 md:pb-4">
          <div className="space-y-3">
            {paginatedNotes.map((note) => {
              const project = note.projectId ? getProjectById(note.projectId) : null

              return (
                <Card
                  key={note.id}
                  className="group p-4 sm:p-5 space-y-2.5 hover:border-primary/40 transition-colors cursor-pointer text-left"
                  onClick={() => handleNoteClick(note.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                        {note.title}
                      </h3>
                      {project && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: project.color }}
                          />
                          <span className="text-xs font-medium text-muted-foreground truncate">
                            {project.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Download .md"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownloadMd(note.title, note.content)
                        }}
                      >
                        <IconDownload className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        title="Edit Note"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleNoteClick(note.id)
                        }}
                      >
                        <IconEdit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete Note"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {note.content && (
                    <div
                      className="text-sm text-muted-foreground line-clamp-3 break-words tiptap leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60">
                    <div className="flex flex-wrap gap-1.5">
                      {note.tags.length > 0 ? (
                        note.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[11px] px-2 py-0">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No tags</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

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

      <ImportMarkdownDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  )
}
