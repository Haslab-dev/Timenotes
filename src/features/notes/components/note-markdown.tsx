import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Checkbox } from '@/components/ui/checkbox'

interface NoteMarkdownProps {
  content: string
  onChecklistChange?: (newContent: string) => void
  className?: string
}

export function NoteMarkdown({ content, onChecklistChange, className }: NoteMarkdownProps) {
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
  )
}
