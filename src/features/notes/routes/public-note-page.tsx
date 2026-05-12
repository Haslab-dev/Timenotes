import { FileText } from 'lucide-react'
import { useParams } from 'react-router'
import { NoteMarkdown } from '../components/note-markdown'
import { usePublicNote } from '../hooks/use-notes'

export function PublicNotePage() {
  const { id } = useParams<{ id: string }>()
  const { data: note, isLoading } = usePublicNote(id!)

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 animate-pulse">
        <div className="mb-4 h-16 w-16 rounded-full bg-muted" />
        <div className="mb-2 h-8 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-32 rounded-lg bg-muted" />
      </div>
    )
  }

  if (!note) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <FileText className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-black">Note Not Found</h1>
        <p className="max-w-md text-muted-foreground">
          This note may have been deleted or the link is no longer valid.
        </p>
      </div>
    )
  }

  const isHtmlContent = note.content.trim().startsWith('<')

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary">
      <div className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
          Shared Note
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
          {note.title}
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium text-muted-foreground">
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
              <div className="flex flex-wrap justify-center gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-32">
        <article className="rounded-3xl border bg-card p-6 sm:p-10 shadow-sm">
          {isHtmlContent ? (
            <div
              className="prose prose-sm max-w-none break-words dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <NoteMarkdown content={note.content} className="break-words" />
          )}
        </article>
      </div>

      <footer className="border-t bg-muted/20 py-12">
        <div className="mx-auto max-w-4xl px-6 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-lg font-black">
            <div className="rounded-lg bg-primary p-1.5 text-white">
              <FileText className="h-4 w-4" />
            </div>
            TimeNotes
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Captured with TimeNotes Dashboard
          </p>
        </div>
      </footer>
    </div>
  )
}
