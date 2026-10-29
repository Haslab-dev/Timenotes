import { IconNotes } from '@tabler/icons-react'
import { useParams } from 'react-router'
import { NoteMarkdown } from '../components/note-markdown'
import { usePublicNote } from '../hooks/use-notes'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export function PublicNotePage() {
  const { id } = useParams<{ id: string }>()
  const { data: note, isLoading } = usePublicNote(id!)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 animate-pulse">
        <div className="mb-4 h-12 w-12 rounded-lg bg-muted" />
        <div className="mb-2 h-6 w-48 rounded-md bg-muted" />
        <div className="h-4 w-32 rounded-md bg-muted" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center space-y-3">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
          <IconNotes className="h-7 w-7 text-destructive" />
        </div>
        <h1 className="text-xl font-semibold">Note Not Found</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This note may have been deleted or the link is no longer valid.
        </p>
      </div>
    )
  }

  const isHtmlContent =
    /<\/(p|div|h[1-6]|span|ul|ol|li|table|tr|td|th|thead|tbody|strong|em|b|i|br|img|a|section|article|header|footer|nav|main|pre|code|blockquote)(?:\s[^>]*)?>|<(p|div|h[1-6]|span|ul|ol|li|table|tr|td|th|thead|tbody|strong|em|b|i|br|img|a|section|article|header|footer|nav|main|pre|code|blockquote)(?:\s[^>]*)?\/?>/.test(
      note.content.trim()
    )

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary flex flex-col">
      <div className="mx-auto max-w-3xl w-full px-6 pt-16 pb-8 space-y-4">
        <Badge variant="tertiary">Shared Note</Badge>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <time>
            {new Date(note.updatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          {note.tags.length > 0 && (
            <>
              <span>•</span>
              <div className="flex flex-wrap gap-1.5">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[11px]">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl w-full px-6 pb-20 flex-1">
        <Card className="p-6 sm:p-8">
          {isHtmlContent ? (
            <div
              className="prose prose-sm max-w-none break-words dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <NoteMarkdown content={note.content} className="break-words" />
          )}
        </Card>
      </div>

      <footer className="border-t bg-secondary/30 py-8">
        <div className="mx-auto max-w-3xl px-6 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <div className="rounded-md bg-primary p-1 text-primary-foreground">
              <IconNotes className="h-3.5 w-3.5" />
            </div>
            TimeNotes
          </div>
          <span>Captured with TimeNotes</span>
        </div>
      </footer>
    </div>
  )
}
