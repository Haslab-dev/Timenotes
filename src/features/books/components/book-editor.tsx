import {
  BlockNoteSchema,
  defaultBlockSpecs,
  filterSuggestionItems,
  type PartialBlock,
} from '@blocknote/core'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import {
  createReactBlockSpec,
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react'
import { useEffect, useMemo, useRef } from 'react'
import { Calendar, Clock3 } from 'lucide-react'

const DateTimeBlock = createReactBlockSpec(
  {
    type: 'dateTime',
    propSchema: {
      label: {
        default: 'Date & Time',
      },
      iso: {
        default: '',
      },
      display: {
        default: '',
      },
    },
    content: 'none',
  },
  {
    render: ({ block }) => (
      <div className="rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3 text-slate-900">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-amber-600 shadow-sm">
            <Clock3 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
              {block.props.label}
            </div>
            <div className="truncate text-sm font-medium text-slate-800">
              {block.props.display || 'Untitled timestamp'}
            </div>
          </div>
        </div>
      </div>
    ),
    toExternalHTML: ({ block }) => (
      <div>
        <strong>{block.props.label}: </strong>
        <span>{block.props.display}</span>
      </div>
    ),
  }
)

const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    dateTime: DateTimeBlock(),
  },
})

interface BookEditorProps {
  initialContent?: string
  onChange: (content: string) => void
  editable?: boolean
}

function createParagraphBlock(text: string): PartialBlock<typeof schema.blockSchema> {
  return {
    type: 'paragraph',
    content: text ? [{ type: 'text', text, styles: {} }] : [],
  }
}

function parseInitialContent(
  initialContent?: string
): PartialBlock<typeof schema.blockSchema>[] | undefined {
  if (!initialContent || initialContent === '[]') {
    return undefined
  }

  if (initialContent.trim().startsWith('<')) {
    const text = initialContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return [createParagraphBlock(text)]
  }

  try {
    const parsed = JSON.parse(initialContent)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // Treat non-JSON content as plain text and map it into paragraphs.
  }

  const paragraphs = initialContent
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map(createParagraphBlock)

  return paragraphs.length > 0 ? paragraphs : [createParagraphBlock(initialContent)]
}

function getCurrentDateTime() {
  const now = new Date()

  return {
    iso: now.toISOString(),
    display: now.toLocaleString([], {
      dateStyle: 'full',
      timeStyle: 'short',
    }),
  }
}

export function BookEditor({ initialContent, onChange, editable = true }: BookEditorProps) {
  const parsedContent = useMemo(() => parseInitialContent(initialContent), [initialContent])
  const saveTimeoutRef = useRef<number | null>(null)

  const editor = useCreateBlockNote({
    schema,
    initialContent: parsedContent,
  })

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        onChange(JSON.stringify(editor.document))
      }, 400)
    })

    return () => {
      unsubscribe()

      if (saveTimeoutRef.current !== null) {
        window.clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = null
      }
    }
  }, [editor, onChange])

  const customSlashMenuItems = useMemo(() => {
    return [
      ...getDefaultReactSlashMenuItems(editor),
      {
        title: 'Insert Date & Time',
        aliases: ['date', 'time', 'timestamp', 'now'],
        group: 'Widgets',
        icon: <Calendar size={18} />,
        onItemClick: () => {
          const currentBlock = editor.getTextCursorPosition().block
          const { iso, display } = getCurrentDateTime()
          const insertedBlocks = editor.insertBlocks(
            [
              {
                type: 'dateTime',
                props: {
                  label: 'Date & Time',
                  iso,
                  display,
                },
              },
              {
                type: 'paragraph',
              },
            ],
            currentBlock,
            'after'
          )

          if (insertedBlocks[1]) {
            editor.setTextCursorPosition(insertedBlocks[1].id, 'start')
          }
        },
      },
    ]
  }, [editor])

  return (
    <div className="w-full min-h-[400px]">
      <BlockNoteView editor={editor} editable={editable} theme="light" slashMenu={false}>
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) => filterSuggestionItems(customSlashMenuItems, query)}
        />
      </BlockNoteView>
    </div>
  )
}
