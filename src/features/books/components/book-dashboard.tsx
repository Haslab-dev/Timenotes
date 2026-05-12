import { type Book } from '../types'
import { Button } from '@/components/ui/button'
import { BookOpen as BookIcon, Trash } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface BookDashboardProps {
  books: Book[]
  onDelete: (id: string) => void
}

export function BookDashboard({ books, onDelete }: BookDashboardProps) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-3xl bg-muted/20">
        <BookIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
        <p className="text-muted-foreground font-medium">No books yet</p>
        <Button variant="outline" className="mt-4 rounded-xl" onClick={() => navigate('/books')}>
          Create your first book
        </Button>
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-3">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => navigate(`/books/${book.id}`)}
            className="flex items-center gap-4 p-4 bg-card border rounded-2xl active:scale-[0.98] transition-all"
          >
            <div className="w-12 h-16 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              {book.thumbnail ? (
                <img
                  src={book.thumbnail}
                  alt={book.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold truncate">{book.title}</h3>
              <p className="text-xs text-muted-foreground">
                Updated {new Date(book.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
      {books.map((book) => (
        <div
          key={book.id}
          className="group relative flex flex-col cursor-pointer transition-all duration-500 hover:-translate-y-1.5"
          onClick={() => navigate(`/books/${book.id}`)}
        >
          <div className="aspect-[3/4] bg-muted/30 relative rounded-xl overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 border border-zinc-100 dark:border-zinc-800">
            {book.thumbnail ? (
              <img
                src={book.thumbnail}
                alt={book.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900">
                <BookIcon className="h-8 w-8 text-zinc-400 group-hover:scale-110 transition-transform duration-500" />
              </div>
            )}

            {/* Actions */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-destructive hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Delete this book?')) onDelete(book.id)
                }}
              >
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className="pt-3 px-1 text-left">
            <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {book.title}
            </h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 font-bold">
              {new Date(book.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
