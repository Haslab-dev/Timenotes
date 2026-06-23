import { FileUp, Loader2, ClipboardPaste, Upload } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProjects } from '@/features/projects/hooks/use-projects'
import {
  buildMarkdownFileKey,
  getS3Client,
  isS3Configured,
} from '@/lib/s3/s3-client'
import { useCreateVaultDoc, useUpdateVaultDoc } from '../hooks/use-vault'

interface UploadMarkdownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Mode = 'files' | 'paste'

function titleFromFilename(name: string): string {
  return name.replace(/\.(md|markdown|mdx|txt)$/i, '').replace(/[-_]+/g, ' ').trim() || name
}

export function UploadMarkdownDialog({ open, onOpenChange }: UploadMarkdownDialogProps) {
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: projects = [] } = useProjects()
  const createDoc = useCreateVaultDoc()
  const updateDoc = useUpdateVaultDoc()

  const [mode, setMode] = useState<Mode>('files')
  const [files, setFiles] = useState<File[]>([])
  const [storeOriginal, setStoreOriginal] = useState(true)
  const [projectForImport, setProjectForImport] = useState<string>('__none__')
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [error, setError] = useState<string | null>(null)

  const projectIdForImport = projectForImport === '__none__' ? null : projectForImport

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
    if (!user?.id || files.length === 0) return
    setError(null)
    const s3 = storeOriginal ? getS3Client() : null

    try {
      for (const file of files) {
        const content = await file.text()
        const doc = await createDoc.mutateAsync({
          title: titleFromFilename(file.name),
          content,
          source: 'upload',
          projectId: projectIdForImport,
        })
        if (storeOriginal && s3) {
          try {
            const key = buildMarkdownFileKey(user.id, doc.id)
            await s3.putObject(key, file, 'text/markdown; charset=utf-8')
            await updateDoc.mutateAsync({ id: doc.id, data: { fileKey: key } })
          } catch (uploadError) {
            console.error('Failed to store original in R2:', uploadError)
          }
        }
      }
      handleClose(false)
      navigate('/vault')
    } catch (err) {
      console.error(err)
      setError('Failed to import files. Please try again.')
    }
  }

  const importPaste = async () => {
    if (!user?.id || !pasteContent.trim()) return
    setError(null)
    const title =
      pasteTitle.trim() ||
      pasteContent
        .match(/^#\s+(.+)$/m)?.[1]
        ?.trim() ||
      'Untitled'
    try {
      const doc = await createDoc.mutateAsync({
        title,
        content: pasteContent,
        source: 'paste',
        projectId: projectIdForImport,
      })
      handleClose(false)
      navigate(`/vault/${doc.id}`)
    } catch (err) {
      console.error(err)
      setError('Failed to import markdown. Please try again.')
    }
  }

  const importing = createDoc.isPending || updateDoc.isPending

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Add to Vault</DialogTitle>
          <DialogDescription>
            Upload markdown files or paste markdown directly to create a new document.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-xl bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setMode('files')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              mode === 'files' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <FileUp className="h-4 w-4" />
            Upload files
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              mode === 'paste' ? 'bg-background shadow-sm' : 'text-muted-foreground'
            }`}
          >
            <ClipboardPaste className="h-4 w-4" />
            Paste markdown
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Project (optional)
          </label>
          <Select value={projectForImport} onValueChange={setProjectForImport}>
            <SelectTrigger className="h-10 rounded-xl">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="__none__">No project</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {mode === 'files' ? (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 cursor-pointer hover:bg-accent/40 transition-colors text-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
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
                    className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-1.5"
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

            {isS3Configured() && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={storeOriginal}
                  onChange={(e) => setStoreOriginal(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                Store original file in R2 (downloadable)
              </label>
            )}

            <Button
              onClick={importFiles}
              disabled={importing || files.length === 0}
              className="w-full rounded-xl h-10"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileUp className="h-4 w-4 mr-2" />
              )}
              Import {files.length > 0 ? `${files.length} file(s)` : ''}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Title (optional)
              </label>
              <Input
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Defaults to first # heading or Untitled"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Markdown
              </label>
              <Textarea
                value={pasteContent}
                onChange={(e) => setPasteContent(e.target.value)}
                placeholder={'# My note\n\nPaste your markdown here…'}
                className="mt-1 min-h-[200px] font-mono rounded-xl"
              />
            </div>
            <Button
              onClick={importPaste}
              disabled={importing || !pasteContent.trim()}
              className="w-full rounded-xl h-10"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ClipboardPaste className="h-4 w-4 mr-2" />
              )}
              Create document
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  )
}
