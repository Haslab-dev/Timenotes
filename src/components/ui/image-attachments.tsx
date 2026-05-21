import { useState, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ImageAttachment {
  url: string
  index: number
}

interface ImageAttachmentsSectionProps {
  images: ImageAttachment[]
  title?: string
  maxVisible?: number
}

export function extractImageUrls(content: string): ImageAttachment[] {
  const seen = new Set<string>()
  const images: ImageAttachment[] = []

  // 1. Markdown image syntax: ![alt](url) or ![alt](url "title")
  const mdImageRegex = /!\[[^\]]*\]\(\s*(https?:\/\/[^\s<"')\]>]+)\s*(?:"[^"]*")?\s*\)/g
  let match: RegExpExecArray | null
  while ((match = mdImageRegex.exec(content)) !== null) {
    const url = match[1]
    if (!seen.has(url)) {
      seen.add(url)
      images.push({ url, index: images.length })
    }
  }

  // 2. HTML img tags: <img src="url"
  const htmlImgRegex = /<img[^>]+src=["'](https?:\/\/[^\s"'>]+)["']/gi
  while ((match = htmlImgRegex.exec(content)) !== null) {
    const url = match[1]
    if (!seen.has(url)) {
      seen.add(url)
      images.push({ url, index: images.length })
    }
  }

  // 3. Plain URLs (for inline links like [text](url) or bare URLs)
  const urlRegex = /(https?:\/\/[^\s<"')\]>]+)/g
  const matches = content.match(urlRegex) || []

  const imagePatterns = [
    /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)(\?.*)?$/i,
    /\/image\//i,
    /imgur\.com/i,
    /i\.ibb\.co/i,
    /cdn\.discordapp\.com/i,
    /media\.discordapp\.net/i,
    /images\.unsplash\.com/i,
    /res\.cloudinary\.com/i,
    /cloudfront\.net/i,
    /\.twimg\.com/i,
    /pbs\.twimg\.com/i,
  ]

  matches.forEach((url) => {
    if (seen.has(url)) return
    const isImage = imagePatterns.some((pattern) => pattern.test(url))
    if (isImage) {
      seen.add(url)
      images.push({ url, index: images.length })
    }
  })

  return images
}

export function ImageAttachmentsSection({
  images,
  title = 'Attachments',
  maxVisible = 4,
}: ImageAttachmentsSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)

  const visibleImages = useMemo(() => {
    if (expanded || images.length <= maxVisible) return images
    return images.slice(0, maxVisible)
  }, [images, maxVisible, expanded])

  const hasMore = images.length > maxVisible

  const openViewer = useCallback(
    (index: number) => {
      const realIndex = expanded || images.length <= maxVisible ? index : index
      setCurrentIndex(realIndex)
      setViewerOpen(true)
    },
    [expanded, images.length, maxVisible]
  )

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  if (images.length === 0) return null

  return (
    <>
      <div className="mt-6 pt-6 border-t border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
            {title}
          </h3>
          <span className="text-[10px] text-muted-foreground/60 font-medium">
            {images.length} image{images.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {visibleImages.map((img) => (
            <button
              key={`${img.url}-${img.index}`}
              onClick={() => openViewer(img.index)}
              className="group relative rounded-xl overflow-hidden border bg-muted/30 hover:border-primary/40 transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ width: 120, height: 120 }}
              type="button"
            >
              <img
                src={img.url}
                alt="Attachment"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </button>
          ))}
          {hasMore && !expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="group relative rounded-xl overflow-hidden border border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/30 flex items-center justify-center"
              style={{ width: 120, height: 120 }}
              type="button"
            >
              <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                <span className="text-lg font-bold">+{images.length - maxVisible}</span>
                <span className="text-[10px] font-medium">View All</span>
              </div>
            </button>
          )}
        </div>
      </div>

      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 border-none bg-black/95 overflow-hidden">
          <DialogTitle className="sr-only">Image Viewer</DialogTitle>
          <DialogDescription className="sr-only">
            Viewing image {currentIndex + 1} of {images.length}
          </DialogDescription>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeViewer}
            className="absolute top-4 right-4 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-black/50 text-white text-xs font-medium">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          <div className="flex items-center justify-center w-full h-full min-h-[50vh]">
            <img
              src={images[currentIndex]?.url}
              alt="Attachment preview"
              className="max-w-full max-h-[90vh] object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
