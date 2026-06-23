import {
  Bold,
  Code2,
  Heading,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from 'lucide-react'
import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'

interface MarkdownSourceEditorProps {
  value: string
  onChange: (value: string) => void
  onUploadImage?: (file: File) => Promise<string | null>
  className?: string
}

export function MarkdownSourceEditor({
  value,
  onChange,
  onUploadImage,
  className,
}: MarkdownSourceEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = (before: string, after = before, placeholder = '') => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const next = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + before.length
      el.setSelectionRange(cursor, cursor + selected.length)
    })
  }

  const prefixLines = (prefix: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const block = value.slice(lineStart, end)
    const replaced = block
      .split('\n')
      .map((line) => `${prefix}${line}`)
      .join('\n')
    const next = value.slice(0, lineStart) + replaced + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(lineStart, lineStart + replaced.length)
    })
  }

  const insertAtCursor = (text: string) => {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const next = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + text.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handleImage = async (file?: File | null) => {
    if (!file || !onUploadImage) return
    const url = await onUploadImage(file)
    if (url) insertAtCursor(`\n![${file.name}](${url})\n`)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const el = ref.current
      if (!el) return
      const start = el.selectionStart
      const end = el.selectionEnd
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1
        if (value.slice(lineStart, lineStart + 2) === '  ') {
          const next = value.slice(0, lineStart) + value.slice(lineStart + 2)
          onChange(next)
          requestAnimationFrame(() => {
            el.setSelectionRange(Math.max(lineStart, start - 2), Math.max(lineStart, end - 2))
          })
        }
      } else {
        const next = value.slice(0, start) + '  ' + value.slice(end)
        onChange(next)
        requestAnimationFrame(() => el.setSelectionRange(start + 2, start + 2))
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      const url = window.prompt('Link URL')
      if (url) wrapSelection('[', `](${url})`, 'link text')
    }
  }

  const handlePaste = async (e: ClipboardEvent<HTMLTextAreaElement>) => {
    if (!onUploadImage) return
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          e.preventDefault()
          await handleImage(file)
          return
        }
      }
    }
  }

  return (
    <div
      className={`flex flex-col w-full border rounded-xl overflow-hidden bg-card shadow-sm ${className ?? ''}`}
    >
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => prefixLines('# ')}
          title="Heading"
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => wrapSelection('**', '**', 'bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => wrapSelection('*', '*', 'italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => wrapSelection('~~', '~~', 'strikethrough')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => prefixLines('- ')}
          title="Bullet list"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => prefixLines('1. ')}
          title="Numbered list"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => prefixLines('> ')}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => wrapSelection('`', '`', 'code')}
          title="Inline code"
        >
          <Code2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => wrapSelection('[', '](https://)', 'link text')}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          disabled={!onUploadImage}
          onClick={() => document.getElementById('vault-image-input')?.click()}
          title={onUploadImage ? 'Insert image' : 'Attachments require S3/R2 config'}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <input
          id="vault-image-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            handleImage(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        spellCheck={false}
        placeholder="Write or paste markdown here…  (supports [[wiki-links]] and image paste)"
        className="w-full min-h-[420px] resize-y bg-transparent p-4 font-mono text-sm leading-relaxed focus:outline-none"
      />
    </div>
  )
}
