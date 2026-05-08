import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
        components={{
          li: ({ node, children, ...props }) => {
            // Check if this list item has a checkbox
            // In react-markdown v9+, the checkbox is often passed in props or as a child
            const isTaskItem = (props as any).className?.includes('task-list-item')
            const isChecked = (props as any).checked

            // If it's a task item but props don't have checked, check children
            const hasCheckbox =
              isTaskItem ||
              node?.children?.some(
                (child: any) => child.tagName === 'input' && child.properties?.type === 'checkbox'
              )

            if (hasCheckbox) {
              const checkboxChild: any = node?.children?.find(
                (child: any) => child.tagName === 'input' && child.properties?.type === 'checkbox'
              )
              const finalChecked =
                isChecked !== undefined ? isChecked : checkboxChild?.properties?.checked

              const checkboxIndex =
                content.slice(0, (node as any).position?.start.offset).match(/\[([ xX])\]/g)
                  ?.length || 0

              return (
                <li
                  className="flex items-center gap-2.5 list-none -ml-6 py-1 group/item"
                  {...props}
                >
                  <Checkbox
                    checked={finalChecked}
                    onCheckedChange={(checked) => handleCheckboxChange(checkboxIndex, !!checked)}
                    className="flex-shrink-0"
                  />
                  <div
                    className={`flex-1 min-w-0 ${finalChecked ? 'text-muted-foreground/60 line-through' : ''}`}
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
