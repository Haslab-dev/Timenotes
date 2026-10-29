import { Button } from '@/components/ui/button'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Image from '@tiptap/extension-image'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import {
  IconBold,
  IconCheckbox,
  IconPhoto,
  IconItalic,
  IconLink,
  IconList,
  IconListNumbers,
  IconArrowBackUp,
  IconStrikethrough,
  IconUnderline,
  IconH1,
  IconH2,
  IconQuote,
  IconCode,
  IconMarkdown,
  IconEye,
  IconTypography,
} from '@tabler/icons-react'
import { useEffect, useMemo, useState } from 'react'
import { Markdown } from 'tiptap-markdown'
import { ImageUploadPopover } from '@/components/ui/image-upload'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { NoteMarkdown } from './note-markdown'
import { useNotes } from '../hooks/use-notes'
import { cn } from '@/lib/utils'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  variant?: 'notion' | 'boxed'
}

export function NoteEditor({
  content,
  onChange,
  placeholder = "Type '/' or start writing...",
  variant = 'notion',
}: NoteEditorProps) {
  const [editorMode, setEditorMode] = useState<'visual' | 'raw' | 'preview'>('visual')
  const { data: allNotes = [] } = useNotes()

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Markdown,
      TaskList,
      Underline,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'inline-block max-w-[45%] max-h-[45vh] h-auto rounded-lg border my-2',
        },
      }),
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class:
            'text-primary font-medium decoration-primary/30 underline-offset-4 hover:decoration-primary transition-all cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    [placeholder]
  )

  const editor = useEditor({
    extensions,
    content: content,
    onUpdate: ({ editor }) => {
      const markdown = (editor.storage as any).markdown.getMarkdown()
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none cursor-text leading-relaxed prose-p:my-1.5 prose-li:my-0.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-headings:font-semibold prose-headings:tracking-tight',
          variant === 'notion'
            ? 'min-h-[260px] py-4 px-1'
            : 'min-h-[120px] max-h-[240px] overflow-y-auto p-3.5'
        ),
      },
    },
  })

  const [previewSrc, setPreviewSrc] = useState<string | null>(null)

  useEffect(() => {
    if (
      editor &&
      editorMode === 'visual' &&
      content !== (editor.storage as any).markdown.getMarkdown()
    ) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor, editorMode])

  if (!editor) {
    return null
  }

  return (
    <div
      className={cn(
        'flex flex-col w-full transition-all duration-150',
        variant === 'boxed'
          ? 'border rounded-lg overflow-hidden bg-card focus-within:ring-2 focus-within:ring-ring/20'
          : 'bg-transparent'
      )}
    >
      {/* Formatting Bar */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-0.5',
          variant === 'notion'
            ? 'py-1.5 px-1.5 rounded-lg bg-secondary/50 border border-border/60 mb-2'
            : 'p-1.5 border-b bg-secondary/40'
        )}
      >
        {editorMode === 'visual' ? (
          <>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              <IconH1 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
            >
              <IconH2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button
              type="button"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <IconBold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <IconItalic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <IconUnderline className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <IconStrikethrough className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('code') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Inline Code"
            >
              <IconCode className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button
              type="button"
              variant={editor.isActive('taskList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md text-primary"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="To-do Checklist"
            >
              <IconCheckbox className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <IconList className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <IconListNumbers className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <IconQuote className="h-4 w-4" />
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => {
                const url = window.prompt('URL')
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run()
                }
              }}
              title="Link"
            >
              <IconLink className="h-4 w-4" />
            </Button>
            <ImageUploadPopover
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-md"
                  title="Upload image"
                >
                  <IconPhoto className="h-4 w-4" />
                </Button>
              }
              onUploaded={(url, name) =>
                editor.chain().focus().setImage({ src: url, alt: name }).run()
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <IconArrowBackUp className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground px-2">
            {editorMode === 'raw'
              ? 'Raw Markdown — supports [[wiki-links]] and YAML frontmatter'
              : 'Reader Preview — click [[wiki-links]] or toggle checklists'}
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {variant === 'notion' && (
            <div className="inline-flex items-center rounded-md bg-background/80 p-0.5 border border-border/60">
              <button
                type="button"
                onClick={() => setEditorMode('visual')}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  editorMode === 'visual'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Visual Editor"
              >
                <IconTypography className="h-3 w-3" />
                <span className="hidden sm:inline">Visual</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('raw')}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  editorMode === 'raw'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Raw Markdown Source"
              >
                <IconMarkdown className="h-3 w-3" />
                <span className="hidden sm:inline">Markdown</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('preview')}
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  editorMode === 'preview'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title="Preview with [[wiki-links]]"
              >
                <IconEye className="h-3 w-3" />
                <span className="hidden sm:inline">Preview</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Editor Surface */}
      {editorMode === 'visual' && (
        <div
          className="relative"
          onMouseDown={(e) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'IMG') {
              e.preventDefault()
              const img = target as HTMLImageElement
              setPreviewSrc(img.currentSrc || img.src)
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      )}

      {editorMode === 'raw' && (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="Write raw markdown here... Supports [[Note Title]] wiki-links and --- YAML frontmatter ---"
          className="w-full min-h-[280px] resize-y bg-secondary/20 rounded-lg border border-border/60 p-4 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}

      {editorMode === 'preview' && (
        <div className="min-h-[260px] py-4 px-1">
          {content.trim() ? (
            <NoteMarkdown content={content} notes={allNotes} onChecklistChange={onChange} />
          ) : (
            <p className="text-sm text-muted-foreground italic">Nothing to preview yet.</p>
          )}
        </div>
      )}

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
    </div>
  )
}
