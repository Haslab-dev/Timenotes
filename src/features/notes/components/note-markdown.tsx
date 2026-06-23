import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface NoteMarkdownProps {
  content: string
  onChecklistChange?: (newContent: string) => void
  className?: string
}

export function NoteMarkdown({ content, onChecklistChange, className }: NoteMarkdownProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  const handleCheckboxChange = (index: number, checked: boolean) => {
    if (!onChecklistChange) return

    let currentCheckboxIndex = 0
    const newContent = content.replace(/\[([ xX])\]/g, (match) => {
      if (currentCheckboxIndex === index) {
        currentCheckboxIndex++
        return checked ? '[x]' : '[ ]'
      }
      currentCheckboxIndex++
      return match
    })

    onChecklistChange(newContent)
  }

  return (
    <>
      <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 font-bold decoration-indigo-600/30 underline-offset-4 hover:decoration-indigo-600 transition-all break-all"
              />
            ),
            img: ({ src, alt }) => {
              const url = typeof src === 'string' ? src : ''
              return (
                <img
                  src={url}
                  alt={alt}
                  loading="lazy"
                  className="inline-block max-w-[45%] max-h-[45vh] h-auto rounded-xl border my-2 cursor-zoom-in"
                  onClick={() => url && setPreviewSrc(url)}
                />
              )
            },
            li: ({ node, children, ...props }) => {
              // Only use custom checkbox if we are in edit mode (onChecklistChange provided)
              const isChecked = (props as any).checked
              const isTaskItem =
                isChecked !== undefined || (props as any).className?.includes('task-list-item')

              if (isTaskItem && onChecklistChange) {
                const checkboxIndex =
                  content.slice(0, (node as any).position?.start.offset).match(/\[([ xX])\]/g)
                    ?.length || 0

                return (
                  <li
                    className={`flex items-start gap-2.5 list-none -ml-6 py-1.5 px-2 rounded-lg transition-colors group/item ${isChecked ? 'bg-primary/5' : ''}`}
                    {...props}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckboxChange(checkboxIndex, !!checked)}
                      className="mt-1 flex-shrink-0"
                    />
                    <div
                      className={`flex-1 min-w-0 ${isChecked ? 'text-muted-foreground/60 line-through' : ''}`}
                    >
                      {children}
                    </div>
                  </li>
                )
              }

              // For read-only mode (shared links), use the default rendering
              // and let CSS handle the alignment and bullet removal.
              return <li {...props}>{children}</li>
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>

      <Dialog open={!!previewSrc} onOpenChange={(open) => !open && setPreviewSrc(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto p-0 border-none bg-black/95 overflow-hidden">
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          <DialogDescription className="sr-only">Click outside to close</DialogDescription>
          {previewSrc && (
            <img
              src={previewSrc}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
