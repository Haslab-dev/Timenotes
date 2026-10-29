import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { Note } from '@/lib/types'

interface NoteMarkdownProps {
  content: string
  notes?: Note[]
  onChecklistChange?: (newContent: string) => void
  className?: string
}

interface ParsedFrontMatter {
  body: string
  properties: Record<string, string>
}

function parseFrontMatter(content: string): ParsedFrontMatter {
  const match = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    return { body: content, properties: {} }
  }
  const raw = match[1]
  const body = match[2]
  const properties: Record<string, string> = {}
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9 _-]+):\s*(.*)$/)
    if (m) {
      properties[m[1].trim()] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
  return { body, properties }
}

export function NoteMarkdown({ content, notes, onChecklistChange, className }: NoteMarkdownProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  const { body, properties } = useMemo(() => parseFrontMatter(content), [content])

  const titleToId = useMemo(() => {
    const map = new Map<string, string>()
    notes?.forEach((n) => map.set(n.title.trim().toLowerCase(), n.id))
    return map
  }, [notes])

  const rendered = useMemo(() => {
    return body.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_match, target: string, alias?: string) => {
        const id = titleToId.get(String(target).trim().toLowerCase())
        const label = alias ?? target
        return id ? `[${label}](/notes/${id})` : String(label)
      }
    )
  }, [body, titleToId])

  const hasProperties = Object.keys(properties).length > 0

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
      <div className={`prose prose-sm max-w-none dark:prose-invert ${className ?? ''}`}>
        {hasProperties && (
          <div className="not-prose mb-5 rounded-lg border border-border bg-secondary/30 p-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Frontmatter Properties
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <dt className="font-medium text-muted-foreground shrink-0">{key}:</dt>
                  <dd className="text-foreground break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ node: _node, href, children, ...props }) => {
              if (href && href.startsWith('/notes/')) {
                return (
                  <Link
                    to={href}
                    className="text-primary font-medium decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all"
                  >
                    {children}
                  </Link>
                )
              }
              return (
                <a
                  href={href}
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-medium decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all break-all"
                >
                  {children}
                </a>
              )
            },
            img: ({ src, alt }) => {
              const url = typeof src === 'string' ? src : ''
              return (
                <img
                  src={url}
                  alt={alt}
                  loading="lazy"
                  className="inline-block max-w-[45%] max-h-[45vh] h-auto rounded-lg border my-2 cursor-zoom-in"
                  onClick={() => url && setPreviewSrc(url)}
                />
              )
            },
            li: ({ node, children, ...props }) => {
              const isChecked = (props as any).checked
              const isTaskItem =
                isChecked !== undefined || (props as any).className?.includes('task-list-item')

              if (isTaskItem && onChecklistChange) {
                const checkboxIndex =
                  content.slice(0, (node as any).position?.start.offset).match(/\[([ xX])\]/g)
                    ?.length || 0

                return (
                  <li
                    className={`flex items-start gap-2.5 list-none -ml-6 py-1 px-2 rounded-md transition-colors group/item ${isChecked ? 'bg-secondary/40' : ''}`}
                    {...props}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) => handleCheckboxChange(checkboxIndex, !!checked)}
                      className="mt-1 shrink-0"
                    />
                    <div
                      className={`flex-1 min-w-0 ${isChecked ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {children}
                    </div>
                  </li>
                )
              }

              return <li {...props}>{children}</li>
            },
          }}
        >
          {rendered}
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
