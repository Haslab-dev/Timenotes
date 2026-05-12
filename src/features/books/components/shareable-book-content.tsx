import { BookOpen } from 'lucide-react'
import { useMemo } from 'react'
import { BookViewer } from './book-viewer'
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
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black tracking-[0.2em] uppercase">
          Published Book
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
          {book.title}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground font-medium">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
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

      <div className="max-w-4xl mx-auto px-4 pb-32">
        <BookViewer
          pages={filteredPages}
          onUpdatePage={() => {}}
          defaultViewMode="scroll"
          showControls={false}
          readOnly={true}
        />
      </div>

      <footer className="border-t py-12 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 font-black text-lg">
            <div className="p-1.5 rounded-lg bg-primary text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            TimeNotes
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            Captured with TimeNotes Dashboard
          </p>
        </div>
      </footer>
    </div>
  )
}
