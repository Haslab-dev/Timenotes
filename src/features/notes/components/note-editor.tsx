import { Button } from '@/components/ui/button'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  CheckSquare,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RotateCcw,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { Markdown } from 'tiptap-markdown'

interface NoteEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function NoteEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
}: NoteEditorProps) {
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
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class:
            'text-indigo-600 dark:text-indigo-400 font-bold decoration-indigo-600/30 underline-offset-4 hover:decoration-indigo-600 transition-all cursor-pointer',
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
      // Get markdown output
      const markdown = (editor.storage as any).markdown.getMarkdown()
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[120px] max-h-[200px] sm:max-h-[300px] overflow-y-auto focus:outline-none p-4 cursor-text leading-snug prose-p:my-1 prose-li:my-1 prose-ul:my-1 prose-ol:my-1',
      },
    },
  })

  // Update content if it changes externally (e.g. initial load)
  useEffect(() => {
    if (editor && content !== (editor.storage as any).markdown.getMarkdown()) {
      editor.commands.setContent(content, { emitUpdate: false })
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="flex flex-col w-full border rounded-xl overflow-hidden bg-card shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-200">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant={editor.isActive('taskList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg text-primary"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          title="Checklist"
        >
          <CheckSquare className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-4 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => {
            const url = window.prompt('URL')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />

        {/* Simplified Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-muted/10 border-t text-[10px] text-muted-foreground">
          <div className="flex gap-4">
            <span>{(editor.storage as any).markdown.getMarkdown().length} characters</span>
            <span className="hidden sm:inline">Tip: Type [] for checklist</span>
          </div>
        </div>
      </div>
    </div>
  )
}
