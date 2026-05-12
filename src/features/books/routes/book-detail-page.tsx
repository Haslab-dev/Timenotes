import { useParams, useNavigate } from 'react-router'
import { ArrowLeft, Plus, Download, FileText, Share, Check, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useBook, useBookPages, useUpdatePage, useCreatePage } from '../hooks/use-books'
import { BookViewer } from '../components/book-viewer'
import { ShareableBookContent } from '../components/shareable-book-content'
import { exportBookToPDF } from '../utils/pdf-export'
import { Input } from '@/components/ui/input'
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
  const updatePage = useUpdatePage()
  const createPage = useCreatePage()
  const [copied, setCopied] = useState(false)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [sharePageInput, setSharePageInput] = useState('1')

  const sortedPages = [...pages].sort((a, b) => a.pageNumber - b.pageNumber)
  const currentPageNumber = sortedPages[currentPageIndex]?.pageNumber ?? 1

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
      title: `Page ${pages.length + 1}`,
      content: '[]',
      pageNumber: pages.length + 1,
    })
  }

  const handleExportPDF = async () => {
    if (book) {
      await exportBookToPDF(book.title)
    }
  }

  if (isLoadingBook || isLoadingPages) {
    return <div className="text-center py-20 text-muted-foreground">Loading book...</div>
  }

  if (!book) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-destructive font-bold">Book not found</div>
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
    <div className="flex flex-col flex-1 h-full min-h-0 -mx-2 sm:mx-0 bg-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b bg-card gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/books')}
            className="rounded-full shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold leading-tight truncate">{book.title}</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 font-black">
              {pages.length} Pages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-full h-9 transition-all ${copied ? 'text-emerald-500' : 'text-muted-foreground'}`}
              >
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Share className="h-4 w-4 mr-2" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Share'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl">
              <div className="px-2 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground opacity-50">
                Sharing Options
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleShare()}
                className="rounded-xl cursor-pointer py-3"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-bold">Full Book</span>
                  <span className="text-[10px] text-muted-foreground">
                    Share all chapters in blog mode
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleShare(currentPageNumber)
                }}
                className="rounded-xl cursor-pointer py-3"
              >
                <FileText className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-bold">Current Page Only</span>
                  <span className="text-[10px] text-muted-foreground">
                    Share page {currentPageNumber} as a single post
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-2 space-y-2">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
                  Share Specific Page
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={Math.max(pages.length, 1)}
                    value={sharePageInput}
                    onChange={(event) => setSharePageInput(event.target.value)}
                    className="h-9 rounded-xl"
                    placeholder="Page number"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl shrink-0"
                    onClick={handleShareSpecificPage}
                    disabled={
                      Number.isNaN(Number.parseInt(sharePageInput, 10)) ||
                      Number.parseInt(sharePageInput, 10) < 1
                    }
                  >
                    Copy Link
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Available pages: 1 to {Math.max(pages.length, 1)}
                </p>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={handleAddPage} className="rounded-full h-9">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Page</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleExportPDF}
            className="rounded-full h-9 shadow-lg shadow-primary/20"
          >
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-hidden">
        <BookViewer
          pages={pages}
          onUpdatePage={(pageId, content) => updatePage.mutate({ id: pageId, data: { content } })}
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
