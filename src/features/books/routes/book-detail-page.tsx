import { useParams, useNavigate } from 'react-router'
import {
  IconArrowLeft,
  IconPlus,
  IconDownload,
  IconFileText,
  IconShare,
  IconCheck,
  IconBook,
  IconPhoto,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import {
  useBook,
  useBookPages,
  useUpdateBook,
  useUpdatePage,
  useCreatePage,
} from '../hooks/use-books'
import { BookViewer } from '../components/book-viewer'
import { ShareableBookContent } from '../components/shareable-book-content'
import { exportBookToPDF } from '../utils/pdf-export'
import { Input } from '@/components/ui/input'
import { ImageUploadPopover } from '@/components/ui/image-upload'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: book, isLoading: isLoadingBook } = useBook(id!)
  const { data: pages = [], isLoading: isLoadingPages } = useBookPages(id!)
  const updateBook = useUpdateBook()
  const updatePage = useUpdatePage()
  const createPage = useCreatePage()
  const [copied, setCopied] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [sharePageInput, setSharePageInput] = useState('1')
  const [bookTitle, setBookTitle] = useState('')

  useEffect(() => {
    if (book) {
      setBookTitle(book.title)
    }
  }, [book])

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber)
  const currentPageNumber = sortedPages[currentPageIndex]?.pageNumber ?? 1

  const handleBookTitleBlur = () => {
    if (!book) return
    const trimmed = bookTitle.trim() || 'Untitled Book'
    setBookTitle(trimmed)
    if (trimmed !== book.title) {
      updateBook.mutate({ id: book.id, data: { title: trimmed } })
    }
  }

  const handleShare = (pageNum?: number) => {
    let url = `${window.location.origin}/shared/books/${id}`
    if (pageNum !== undefined) {
      url += `?page=${pageNum}`
    }
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShareSpecificPage = () => {
    const pageNum = Number.parseInt(sharePageInput, 10)
    if (Number.isNaN(pageNum) || pageNum < 1) {
      return
    }

    handleShare(pageNum)
  }

  const handleAddPage = async () => {
    await createPage.mutateAsync({
      bookId: id!,
      title: `Chapter ${pages.length + 1}`,
      content: '[]',
      pageNumber: pages.length + 1,
    })
    setCurrentPageIndex(pages.length)
  }

  const handleExportPDF = async () => {
    if (book) {
      await exportBookToPDF(book.title)
    }
  }

  if (isLoadingBook || isLoadingPages) {
    return <div className="text-center py-20 text-sm text-muted-foreground">Loading book...</div>
  }

  if (!book) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-destructive font-semibold">Book not found</div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          If you just created this book, please ensure you have applied the database schema to your
          Turso database.
        </p>
        <Button variant="outline" onClick={() => navigate('/books')}>
          Go back to Books
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-card border rounded-xl overflow-hidden">
      {/* Notion-style Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 border-b bg-card gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/books')}
            className="h-7 px-2 text-xs text-muted-foreground shrink-0"
          >
            <IconArrowLeft className="h-3.5 w-3.5 mr-1" />
            Books
          </Button>
          <span className="text-muted-foreground text-xs">/</span>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <IconBook className="h-4 w-4 text-primary shrink-0" />
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              onBlur={handleBookTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
              }}
              placeholder="Untitled Book"
              className="text-sm sm:text-base font-semibold text-foreground bg-transparent border-0 rounded px-1.5 py-0.5 hover:bg-secondary/60 focus:bg-secondary/60 focus:outline-none min-w-[120px] max-w-xs truncate transition-colors"
            />
            <Badge variant="secondary" className="text-[11px] shrink-0">
              {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 justify-end">
          <ImageUploadPopover
            trigger={
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <IconPhoto className="h-3.5 w-3.5 sm:mr-1.5" />
                <span className="hidden md:inline">Cover</span>
              </Button>
            }
            onUploaded={(url) => updateBook.mutate({ id: book.id, data: { thumbnail: url } })}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {copied ? (
                  <IconCheck className="h-3.5 w-3.5 mr-1.5 text-primary" />
                ) : (
                  <IconShare className="h-3.5 w-3.5 mr-1.5" />
                )}
                <span>{copied ? 'Copied!' : 'Share'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 p-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Sharing Options
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleShare()} className="cursor-pointer py-2">
                <IconBook className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Full Book</span>
                  <span className="text-xs text-muted-foreground">
                    Share all chapters in blog mode
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleShare(currentPageNumber)}
                className="cursor-pointer py-2"
              >
                <IconFileText className="mr-2 h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium text-sm">Current Page Only</span>
                  <span className="text-xs text-muted-foreground">
                    Share page {currentPageNumber} as a single post
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 space-y-2">
                <div className="text-xs font-medium text-muted-foreground">Share Specific Page</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(pages.length, 1)}
                    value={sharePageInput}
                    onChange={(event) => setSharePageInput(event.target.value)}
                    className="h-8 text-xs"
                    placeholder="Page #"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={handleShareSpecificPage}
                    disabled={
                      Number.isNaN(Number.parseInt(sharePageInput, 10)) ||
                      Number.parseInt(sharePageInput, 10) < 1
                    }
                  >
                    Copy
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Available pages: 1 to {Math.max(pages.length, 1)}
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleAddPage}>
            <IconPlus className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">New Page</span>
          </Button>
          <Button variant="default" size="sm" className="h-8 text-xs" onClick={handleExportPDF}>
            <IconDownload className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        <BookViewer
          pages={pages}
          onUpdatePage={(pageId, content) => updatePage.mutate({ id: pageId, data: { content } })}
          onUpdatePageTitle={(pageId, title) => updatePage.mutate({ id: pageId, data: { title } })}
          onAddPage={handleAddPage}
          onPageChange={setCurrentPageIndex}
        />
      </div>

      <div className="pointer-events-none absolute left-[-99999px] top-0 w-[1100px] overflow-hidden bg-white">
        <div id="book-pdf-export-content">
          <ShareableBookContent book={book} pages={sortedPages} />
        </div>
      </div>
    </div>
  )
}
