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
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { IconCalendar, IconClock } from '@tabler/icons-react'
import { useImageUpload } from '@/components/ui/use-image-upload'

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
      <div className="rounded-lg border border-border bg-tertiary/60 px-4 py-2.5">
        <div className="flex items-center gap-3 text-tertiary-foreground">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 text-primary border border-border/60">
            <IconClock className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {block.props.label}
            </div>
            <div className="truncate text-sm font-medium text-foreground">
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

export interface BookEditorHandle {
  insertImage: (url: string, fileName: string) => void
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

export const BookEditor = forwardRef<BookEditorHandle, BookEditorProps>(function BookEditor(
  { initialContent, onChange, editable = true },
  ref
) {
  const parsedContent = useMemo(() => parseInitialContent(initialContent), [initialContent])
  const saveTimeoutRef = useRef<number | null>(null)
  const { upload } = useImageUpload()

  const uploadFile = useCallback(
    (file: File) => upload(file, 75).then((url) => url ?? ''),
    [upload]
  )

  const editor = useCreateBlockNote({
    schema,
    initialContent: parsedContent,
    uploadFile,
  })

  useImperativeHandle(
    ref,
    () => ({
      insertImage: (url, fileName) => {
        editor.focus()
        editor.insertBlocks(
          [{ type: 'image', props: { url, caption: fileName } }],
          editor.getTextCursorPosition().block,
          'after'
        )
      },
    }),
    [editor]
  )

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
        icon: <IconCalendar size={18} />,
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
})
