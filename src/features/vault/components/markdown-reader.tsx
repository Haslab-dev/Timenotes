import { Link } from 'react-router'
import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { MarkdownDoc } from '../types'

interface MarkdownReaderProps {
  content: string
  docs?: MarkdownDoc[]
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

export function MarkdownReader({ content, docs, className }: MarkdownReaderProps) {
  const { body, properties } = useMemo(() => parseFrontMatter(content), [content])

  const titleToId = useMemo(() => {
    const map = new Map<string, string>()
    docs?.forEach((d) => map.set(d.title.trim().toLowerCase(), d.id))
    return map
  }, [docs])

  const rendered = useMemo(() => {
    return body.replace(
      /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,
      (_match, target: string, alias?: string) => {
        const id = titleToId.get(String(target).trim().toLowerCase())
        const label = alias ?? target
        return id ? `[${label}](/vault/${id})` : String(label)
      }
    )
  }, [body, titleToId])

  const hasProperties = Object.keys(properties).length > 0

  return (
    <div
      className={`prose dark:prose-invert max-w-none min-w-0 break-words [overflow-wrap:anywhere]
        prose-headings:font-bold prose-headings:tracking-tight prose-headings:mt-6 prose-headings:mb-2
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
        prose-p:my-3 prose-p:leading-relaxed
        prose-ul:my-3 prose-ol:my-3 prose-li:my-1
        prose-blockquote:my-4 prose-pre:my-4 prose-img:my-4 prose-hr:my-5
        prose-a:break-words
        prose-table:my-4 prose-th:px-3 prose-th:py-2 prose-td:px-3 prose-td:py-2
        prose-th:bg-muted/50 prose-th:font-bold ${className ?? ''}`}
    >
      {hasProperties && (
        <div className="not-prose mb-6 rounded-2xl border bg-muted/30 p-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
            Properties
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <dt className="font-semibold text-muted-foreground shrink-0">{key}:</dt>
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
          a: ({ href, children, title }) => {
            if (href && href.startsWith('/vault/')) {
              return (
                <Link to={href} title={title}>
                  {children}
                </Link>
              )
            }
            return (
              <a href={href} title={title} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            )
          },
          img: ({ src, alt }) => (
            <img
              loading="lazy"
              className="rounded-xl border max-w-full h-auto"
              src={src}
              alt={alt}
            />
          ),
          pre: ({ children }) => (
            <pre className="not-prose rounded-xl border bg-muted/50 p-4 overflow-x-auto text-[13px] leading-relaxed">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {rendered}
      </ReactMarkdown>
    </div>
  )
}
