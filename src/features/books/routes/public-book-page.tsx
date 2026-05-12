import { useParams, useSearchParams } from 'react-router'
import { usePublicBook, useBookPages } from '../hooks/use-books'
import { BookOpen } from 'lucide-react'
import { ShareableBookContent } from '../components/shareable-book-content'

export function PublicBookPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const pageParam = searchParams.get('page')

  const { data: book, isLoading: isLoadingBook } = usePublicBook(id!)
  const { data: allPages = [], isLoading: isLoadingPages } = useBookPages(id!)

  if (isLoadingBook || isLoadingPages) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 animate-pulse">
        <div className="w-16 h-16 bg-muted rounded-full mb-4" />
        <div className="h-8 w-48 bg-muted rounded-lg mb-2" />
        <div className="h-4 w-32 bg-muted rounded-lg" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <BookOpen className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-black">Book Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          This book might be private or it may have been deleted.
        </p>
      </div>
    )
  }

  return <ShareableBookContent book={book} pages={allPages} pageParam={pageParam} />
}
