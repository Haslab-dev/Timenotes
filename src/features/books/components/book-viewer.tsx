import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  IconBook,
  IconChevronLeft,
  IconChevronRight,
  IconPhoto,
  IconList,
  IconFileText,
  IconPlus,
  IconLayoutSidebar,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { ImageUploadPopover } from '@/components/ui/image-upload'
import type { BookPage } from '../types'
import { BookEditor, type BookEditorHandle } from './book-editor'
import { useIsMobile } from '@/lib/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface BookViewerProps {
  pages: BookPage[]
  onUpdatePage: (id: string, content: string) => void
  onUpdatePageTitle?: (id: string, title: string) => void
  onAddPage?: () => void
  defaultViewMode?: 'page' | 'scroll'
  showControls?: boolean
  readOnly?: boolean
  onPageChange?: (index: number) => void
}

function EditablePageTitle({
  page,
  readOnly,
  onUpdateTitle,
}: {
  page: BookPage
  readOnly: boolean
  onUpdateTitle?: (title: string) => void
}) {
  const [title, setTitle] = useState(page.title || '')

  useEffect(() => {
    setTitle(page.title || '')
  }, [page.id, page.title])

  if (readOnly) {
    return (
      <div className="mb-4 pb-3 border-b border-border/60">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
          Page {page.pageNumber}
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {page.title || `Page ${page.pageNumber}`}
        </h2>
      </div>
    )
  }

  return (
    <div className="mb-4 pb-3 border-b border-border/60">
      <div className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground mb-1">
        <span>Page {page.pageNumber}</span>
        <span>·</span>
        <span>Type &apos;/&apos; below for commands</span>
      </div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          const trimmed = title.trim() || `Page ${page.pageNumber}`
          setTitle(trimmed)
          if (trimmed !== page.title) {
            onUpdateTitle?.(trimmed)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur()
          }
        }}
        placeholder={`Page ${page.pageNumber} title...`}
        className="w-full text-2xl sm:text-3xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/40 bg-transparent border-0 focus:outline-none focus:ring-0 p-0"
      />
    </div>
  )
}

export function BookViewer({
  pages,
  onUpdatePage,
  onUpdatePageTitle,
  onAddPage,
  defaultViewMode = 'page',
  showControls = true,
  readOnly = false,
  onPageChange,
}: BookViewerProps) {
  const [viewMode, setViewMode] = useState<'page' | 'scroll'>(defaultViewMode)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const editorsRef = useRef<Record<string, BookEditorHandle | null>>({})

  useEffect(() => {
    onPageChange?.(currentPageIndex)
  }, [currentPageIndex, onPageChange])

  const isMobile = useIsMobile()

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber)
  const safeIndex = Math.min(currentPageIndex, Math.max(sortedPages.length - 1, 0))
  const currentPage = sortedPages[safeIndex]

  const handleInsertImage = (url: string, fileName: string) => {
    const targetId = activePageId ?? currentPage?.id
    const handle = (targetId && editorsRef.current[targetId]) || null
    handle?.insertImage(url, fileName)
  }

  const nextPage = () => {
    if (safeIndex < sortedPages.length - 1) {
      setCurrentPageIndex(safeIndex + 1)
    }
  }

  const prevPage = () => {
    if (safeIndex > 0) {
      setCurrentPageIndex(safeIndex - 1)
    }
  }

  if (pages.length === 0) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-sm text-muted-foreground">No pages in this book yet.</p>
        {onAddPage && (
          <Button size="sm" variant="outline" onClick={onAddPage}>
            <IconPlus className="h-4 w-4 mr-1.5" />
            Create First Page
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {showControls && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-secondary/30 sticky top-0 z-20">
          <div className="flex items-center gap-2">
            {!isMobile && (
              <Button
                type="button"
                variant={showSidebar ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowSidebar(!showSidebar)}
                title="Toggle Pages Sidebar"
              >
                <IconLayoutSidebar className="h-4 w-4" />
              </Button>
            )}
            <div className="inline-flex items-center rounded-lg border border-border bg-background p-0.5">
              <Button
                variant={viewMode === 'page' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('page')}
                className="h-7 px-2.5 text-xs"
              >
                <IconBook className="h-3.5 w-3.5 mr-1.5" />
                Page
              </Button>
              <Button
                variant={viewMode === 'scroll' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('scroll')}
                className="h-7 px-2.5 text-xs"
              >
                <IconList className="h-3.5 w-3.5 mr-1.5" />
                Scroll
              </Button>
            </div>
            {!readOnly && (
              <ImageUploadPopover
                trigger={
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs">
                    <IconPhoto className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Insert Image</span>
                  </Button>
                }
                onUploaded={handleInsertImage}
              />
            )}
          </div>

          {viewMode === 'page' && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {safeIndex + 1} / {sortedPages.length}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevPage}
                  disabled={safeIndex === 0}
                  className="h-7 w-7"
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextPage}
                  disabled={safeIndex === sortedPages.length - 1}
                  className="h-7 w-7"
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden bg-card">
        {/* Notion-style Pages Tree Sidebar */}
        {showControls && !isMobile && showSidebar && (
          <aside className="w-56 shrink-0 border-r border-border bg-secondary/20 flex flex-col overflow-y-auto p-2.5">
            <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Pages</span>
              {onAddPage && !readOnly && (
                <button
                  type="button"
                  onClick={onAddPage}
                  className="hover:text-foreground p-0.5 rounded"
                  title="New Page"
                >
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-0.5 mt-1">
              {sortedPages.map((page, idx) => {
                const isActive = viewMode === 'page' && idx === safeIndex
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => {
                      setCurrentPageIndex(idx)
                      if (viewMode === 'scroll') {
                        document
                          .getElementById(`book-page-${page.id}`)
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-left transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    )}
                  >
                    <IconFileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{page.title || `Page ${page.pageNumber}`}</span>
                  </button>
                )
              })}
            </div>
          </aside>
        )}

        {/* Main Editor / Reader Canvas */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'page' && currentPage ? (
            <div className="relative h-full overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPage.id}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col p-6 sm:p-10 max-w-3xl mx-auto"
                  drag={isMobile ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -100) nextPage()
                    if (info.offset.x > 100) prevPage()
                  }}
                >
                  <EditablePageTitle
                    page={currentPage}
                    readOnly={readOnly}
                    onUpdateTitle={(newTitle) => onUpdatePageTitle?.(currentPage.id, newTitle)}
                  />
                  <div
                    className="flex-1 flex flex-col"
                    onFocus={() => setActivePageId(currentPage.id)}
                  >
                    <BookEditor
                      ref={(handle) => {
                        editorsRef.current[currentPage.id] = handle ?? null
                      }}
                      initialContent={currentPage.content}
                      onChange={(content) => onUpdatePage(currentPage.id, content)}
                      editable={!readOnly}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col gap-12 p-6 sm:p-10 max-w-3xl mx-auto pb-20">
              {sortedPages.map((page) => (
                <div
                  id={`book-page-${page.id}`}
                  key={page.id}
                  className="flex flex-col border-b border-border pb-10 last:border-0"
                  onFocus={() => setActivePageId(page.id)}
                >
                  <EditablePageTitle
                    page={page}
                    readOnly={readOnly}
                    onUpdateTitle={(newTitle) => onUpdatePageTitle?.(page.id, newTitle)}
                  />
                  <BookEditor
                    ref={(handle) => {
                      editorsRef.current[page.id] = handle ?? null
                    }}
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
    </div>
  )
}
