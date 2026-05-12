import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, List, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BookPage } from '../types'
import { BookEditor } from './book-editor'
import { useIsMobile } from '@/lib/hooks/use-mobile'

interface BookViewerProps {
  pages: BookPage[]
  onUpdatePage: (id: string, content: string) => void
  defaultViewMode?: 'page' | 'scroll'
  showControls?: boolean
  readOnly?: boolean
  onPageChange?: (index: number) => void
}

export function BookViewer({
  pages,
  onUpdatePage,
  defaultViewMode = 'page',
  showControls = true,
  readOnly = false,
  onPageChange,
}: BookViewerProps) {
  const [viewMode, setViewMode] = useState<'page' | 'scroll'>(defaultViewMode)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  useEffect(() => {
    onPageChange?.(currentPageIndex)
  }, [currentPageIndex, onPageChange])

  const isMobile = useIsMobile()

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber)

  const nextPage = () => {
    if (currentPageIndex < sortedPages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
    }
  }

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
  }

  if (pages.length === 0) {
    return <div className="text-center py-20 text-muted-foreground">No pages in this book yet.</div>
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-between p-4 border-b bg-card sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'page' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('page')}
              className="rounded-full"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Per Page
            </Button>
            <Button
              variant={viewMode === 'scroll' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('scroll')}
              className="rounded-full"
            >
              <List className="h-4 w-4 mr-2" />
              Scroll
            </Button>
          </div>

          {viewMode === 'page' && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {currentPageIndex + 1} of {sortedPages.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevPage}
                  disabled={currentPageIndex === 0}
                  className="h-8 w-8 rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextPage}
                  disabled={currentPageIndex === sortedPages.length - 1}
                  className="h-8 w-8 rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto bg-card">
        {viewMode === 'page' ? (
          <div className="relative h-full overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageIndex}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="h-full flex flex-col p-0 sm:p-8 max-w-5xl mx-auto"
                drag={isMobile ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) nextPage()
                  if (info.offset.x > 100) prevPage()
                }}
              >
                <div className="flex-1 flex flex-col gap-6">
                  <BookEditor
                    initialContent={sortedPages[currentPageIndex].content}
                    onChange={(content) => onUpdatePage(sortedPages[currentPageIndex].id, content)}
                    editable={!readOnly}
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col gap-12 p-0 sm:p-8 max-w-5xl mx-auto pb-20">
            {sortedPages.map((page) => (
              <div key={page.id} className="flex flex-col gap-6 border-b pb-12 last:border-0">
                <BookEditor
                  initialContent={page.content}
                  onChange={(content) => onUpdatePage(page.id, content)}
                  editable={!readOnly}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
