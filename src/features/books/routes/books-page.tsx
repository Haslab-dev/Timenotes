import { useState } from 'react'
import { IconBook, IconPhoto, IconPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageUploadPopover } from '@/components/ui/image-upload'
import { useBooks, useCreateBook, useDeleteBook } from '../hooks/use-books'
import { BookDashboard } from '../components/book-dashboard'
import { useNavigate } from 'react-router'

export function BooksPage() {
  const navigate = useNavigate()
  const { data: books = [], isLoading } = useBooks()
  const createBook = useCreateBook()
  const deleteBook = useDeleteBook()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [thumbnail, setThumbnail] = useState('')

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalTitle = title.trim() || 'Untitled Book'
    const book = await createBook.mutateAsync({
      title: finalTitle,
      thumbnail: thumbnail.trim() || undefined,
    })
    setDialogOpen(false)
    setTitle('')
    setThumbnail('')
    navigate(`/books/${book.id}`)
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Books"
        description="Write structured long-form notebooks, documentation, and journals."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <IconPlus className="mr-1.5 h-4 w-4" />
            New Book
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-20 text-sm text-muted-foreground">Loading books...</div>
      ) : (
        <BookDashboard
          books={books}
          onDelete={(id) => deleteBook.mutate(id)}
          onCreateNew={() => setDialogOpen(true)}
        />
      )}

      {/* Notion-style New Book Modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg p-6 sm:p-8">
          <DialogHeader className="pb-1">
            <DialogTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <IconBook className="h-3.5 w-3.5 text-primary" />
              <span>Books</span>
              <span>/</span>
              <span className="text-foreground">New Book</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Create a new multi-page book or notebook
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBook} className="space-y-4">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Untitled Book"
                autoFocus
                className="w-full text-2xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
              />
            </div>

            <div className="py-2.5 border-y border-border/60 space-y-1">
              <div className="flex items-center min-h-8 text-xs">
                <div className="w-32 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
                  <IconPhoto className="h-3.5 w-3.5" />
                  <span>Cover Image</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  <ImageUploadPopover
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {thumbnail ? 'Change cover' : '+ Add cover image'}
                      </Button>
                    }
                    onUploaded={(url) => setThumbnail(url)}
                  />
                  {thumbnail && (
                    <button
                      type="button"
                      onClick={() => setThumbnail('')}
                      className="text-[11px] text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {thumbnail && (
              <div className="relative h-32 w-full rounded-lg overflow-hidden border border-border bg-secondary/30">
                <img src={thumbnail} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Books contain multiple pages with a Notion-style `/` block editor (headings, lists,
              images, timestamps).
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={createBook.isPending}>
                {createBook.isPending ? 'Creating...' : 'Create Book'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
