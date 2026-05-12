import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBooks, useCreateBook, useDeleteBook } from '../hooks/use-books'
import { BookDashboard } from '../components/book-dashboard'
import { useNavigate } from 'react-router'

export function BooksPage() {
  const navigate = useNavigate()
  const { data: books = [], isLoading } = useBooks()
  const createBook = useCreateBook()
  const deleteBook = useDeleteBook()

  const handleCreateBook = async () => {
    const title = window.prompt('Enter book title', 'My New Book')
    if (title) {
      const book = await createBook.mutateAsync({ title })
      navigate(`/books/${book.id}`)
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Books</h1>
          <p className="text-muted-foreground">Manage your collections and stories</p>
        </div>
        <Button
          onClick={handleCreateBook}
          className="rounded-2xl h-12 px-6 font-bold shadow-lg shadow-primary/20"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Book
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading books...</div>
      ) : (
        <BookDashboard books={books} onDelete={(id) => deleteBook.mutate(id)} />
      )}
    </div>
  )
}
