import { IconBook } from '@tabler/icons-react'
import { useMemo } from 'react'
import { BookViewer } from './book-viewer'
import { Badge } from '@/components/ui/badge'
import type { Book, BookPage } from '../types'

interface ShareableBookContentProps {
  book: Pick<Book, 'title' | 'updatedAt'>
  pages: BookPage[]
  pageParam?: string | null
}

export function ShareableBookContent({ book, pages, pageParam }: ShareableBookContentProps) {
  const filteredPages = useMemo(() => {
    if (!pageParam) return pages

    const pageNum = Number.parseInt(pageParam, 10)
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return pages
    }

    const exactMatch = pages.filter((page) => Number(page.pageNumber) === pageNum)
    if (exactMatch.length > 0) {
      return exactMatch
    }

    const sortedPages = [...pages].sort((a, b) => Number(a.pageNumber) - Number(b.pageNumber))
    const pageByPosition = sortedPages[pageNum - 1]

    return pageByPosition ? [pageByPosition] : []
  }, [pages, pageParam])

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary flex flex-col">
      <div className="max-w-4xl w-full mx-auto px-6 pt-16 pb-8 space-y-4">
        <Badge variant="tertiary">Published Book</Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {book.title}
        </h1>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {pageParam ? `Page ${pageParam}` : `${pages.length} Chapters`}
          </div>
          <span>•</span>
          <time>
            {new Date(book.updatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 pb-20 flex-1">
        <BookViewer
          pages={filteredPages}
          onUpdatePage={() => {}}
          defaultViewMode="scroll"
          showControls={false}
          readOnly={true}
        />
      </div>

      <footer className="border-t py-8 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="p-1 rounded-md bg-primary text-primary-foreground">
              <IconBook className="h-3.5 w-3.5" />
            </div>
            TimeNotes
          </div>
          <span>Captured with TimeNotes</span>
        </div>
      </footer>
    </div>
  )
}
