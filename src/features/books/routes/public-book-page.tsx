import { useParams, useSearchParams } from 'react-router'
import { usePublicBook, useBookPages } from '../hooks/use-books'
import { IconBook } from '@tabler/icons-react'
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
        <div className="w-12 h-12 bg-muted rounded-lg mb-4" />
        <div className="h-6 w-48 bg-muted rounded-md mb-2" />
        <div className="h-4 w-32 bg-muted rounded-md" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center space-y-3">
        <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-2">
          <IconBook className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Book Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-md">
          This book might be private or it may have been deleted.
        </p>
      </div>
    )
  }

  return <ShareableBookContent book={book} pages={allPages} pageParam={pageParam} />
}
