import {
  IconFileUpload,
  IconLoader2,
  IconClipboardText,
  IconUpload,
  IconFolder,
  IconTags,
  IconNotes,
} from '@tabler/icons-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { useCreateNote } from '../hooks/use-notes'

interface ImportMarkdownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultProjectId?: string
}

type Mode = 'files' | 'paste'

function titleFromFilename(name: string): string {
  return (
    name
      .replace(/\.(md|markdown|mdx|txt)$/i, '')
      .replace(/[-_]+/g, ' ')
      .trim() || name
  )
}

export function ImportMarkdownDialog({
  open,
  onOpenChange,
  defaultProjectId,
}: ImportMarkdownDialogProps) {
  const { data: projects = [] } = useProjects()
  const createNote = useCreateNote()

  const [mode, setMode] = useState<Mode>('files')
  const [files, setFiles] = useState<File[]>([])
  const [projectId, setProjectId] = useState<string>(defaultProjectId || '__none__')
  const [tagsInput, setTagsInput] = useState('markdown')
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const parsedTags = tagsInput
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const reset = () => {
    setFiles([])
    setPasteTitle('')
    setPasteContent('')
    setError(null)
  }

  const handleClose = (next: boolean) => {
    onOpenChange(next)
    if (!next) reset()
  }

  const importFiles = async () => {
    if (files.length === 0) return
    setError(null)

    try {
      for (const file of files) {
        const content = await file.text()
        await createNote.mutateAsync({
          title: titleFromFilename(file.name),
          content,
          projectId: projectId === '__none__' ? undefined : projectId,
          tags: parsedTags,
        })
      }
      handleClose(false)
    } catch (err) {
      console.error(err)
      setError('Failed to import markdown files. Please try again.')
    }
  }

  const importPaste = async () => {
    if (!pasteContent.trim()) return
    setError(null)
    const title = pasteTitle.trim() || pasteContent.match(/^#\s+(.+)$/m)?.[1]?.trim() || 'Untitled'
    try {
      await createNote.mutateAsync({
        title,
        content: pasteContent,
        projectId: projectId === '__none__' ? undefined : projectId,
        tags: parsedTags,
      })
      handleClose(false)
    } catch (err) {
      console.error(err)
      setError('Failed to import markdown. Please try again.')
    }
  }

  const importing = createNote.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl p-6 sm:p-8">
        <DialogHeader className="pb-1">
          <DialogTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <IconNotes className="h-3.5 w-3.5 text-primary" />
            <span>Notes</span>
            <span>/</span>
            <span className="text-foreground">Import Markdown</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload <code>.md</code> files or paste raw markdown directly into your Notes workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 rounded-lg bg-secondary/50 p-1">
          <button
            type="button"
            onClick={() => setMode('files')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'files'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <IconFileUpload className="h-4 w-4" />
            Upload .md Files
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === 'paste'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <IconClipboardText className="h-4 w-4" />
            Paste Markdown
          </button>
        </div>

        {/* Notion-style Property Rows */}
        <div className="py-2 border-y border-border/60 space-y-1">
          <div className="flex items-center min-h-8 text-xs">
            <div className="w-28 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
              <IconFolder className="h-3.5 w-3.5" />
              <span>Project</span>
            </div>
            <div className="flex-1">
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-7 w-auto min-w-[140px] border-0 shadow-none bg-transparent hover:bg-secondary/60 px-2 py-1 text-xs rounded-md focus:ring-0">
                  <SelectValue placeholder="Empty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">Empty</span>
                  </SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center min-h-8 text-xs">
            <div className="w-28 shrink-0 flex items-center gap-2 text-muted-foreground font-medium">
              <IconTags className="h-3.5 w-3.5" />
              <span>Tags</span>
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="markdown, imported..."
                className="w-full h-7 rounded-md bg-transparent hover:bg-secondary/60 focus:bg-secondary/60 px-2 py-1 text-xs text-foreground border-0 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {mode === 'files' ? (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border p-8 cursor-pointer hover:bg-secondary/40 transition-colors text-center">
              <IconUpload className="h-7 w-7 text-muted-foreground" />
              <span className="text-sm font-medium">
                {files.length ? `${files.length} file(s) selected` : 'Click to select .md files'}
              </span>
              <span className="text-xs text-muted-foreground">.md, .markdown, .mdx, .txt</span>
              <input
                type="file"
                multiple
                accept=".md,.markdown,.mdx,.txt,text/markdown,text/plain"
                className="hidden"
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? [])
                  setFiles((prev) => [...prev, ...selected])
                  e.target.value = ''
                }}
              />
            </label>

            {files.length > 0 && (
              <ul className="space-y-1 max-h-32 overflow-y-auto text-sm">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-1.5 text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <Button
              onClick={importFiles}
              disabled={importing || files.length === 0}
              className="w-full"
            >
              {importing ? (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <IconFileUpload className="h-4 w-4 mr-2" />
              )}
              Import {files.length > 0 ? `${files.length} file(s)` : ''}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={pasteTitle}
              onChange={(e) => setPasteTitle(e.target.value)}
              placeholder="Untitled (or auto-detects first # heading)"
              className="w-full text-lg font-semibold bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40 px-0"
            />
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              placeholder={'# My Note\n\nPaste your markdown here... Supports [[wiki-links]]'}
              className="w-full min-h-[180px] rounded-lg border border-border/60 bg-secondary/20 p-3 font-mono text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
            <Button
              onClick={importPaste}
              disabled={importing || !pasteContent.trim()}
              className="w-full"
            >
              {importing ? (
                <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <IconClipboardText className="h-4 w-4 mr-2" />
              )}
              Create Note from Markdown
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
