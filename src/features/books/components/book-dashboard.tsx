import { type Book } from '../types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconBook, IconPlus, IconTrash } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface BookDashboardProps {
  books: Book[]
  onDelete: (id: string) => void
  onCreateNew?: () => void
}

export function BookDashboard({ books, onDelete, onCreateNew }: BookDashboardProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  if (books.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12 border-dashed text-center">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
          <IconBook className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No books yet</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Start a new book to organize multi-page notes and chapters.
        </p>
        {onCreateNew && (
          <Button size="sm" onClick={onCreateNew}>
            <IconPlus className="h-4 w-4 mr-1.5" />
            Create First Book
          </Button>
        )}
      </Card>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {books.map((book) => (
          <Card
            key={book.id}
            onClick={() => navigate(`/books/${book.id}`)}
            className="flex items-center gap-4 p-4 hover:border-primary/40 transition-colors cursor-pointer"
          >
            <div className="w-11 h-14 bg-tertiary text-tertiary-foreground rounded-md flex items-center justify-center shrink-0 border border-border/60">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <IconBook className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{book.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Updated {new Date(book.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
      {books.map((book) => (
        <div
          key={book.id}
          className="group relative flex flex-col cursor-pointer"
          onClick={() => navigate(`/books/${book.id}`)}
        >
          <div className="aspect-[3/4] bg-secondary/50 relative rounded-xl overflow-hidden border border-border group-hover:border-primary/50 transition-colors">
            {book.thumbnail ? (
              <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-secondary/40">
                <div className="h-12 w-12 rounded-xl bg-tertiary text-tertiary-foreground flex items-center justify-center border border-border/60">
                  <IconBook className="h-6 w-6" />
                </div>
              </div>
            )}

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-md bg-background/90 backdrop-blur-sm border border-border hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this book?')) onDelete(book.id)
                }}
              >
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="pt-2.5 px-0.5 text-left">
            <h3 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
              {new Date(book.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
