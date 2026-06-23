import { ArrowLeft, Download, Eye, Loader2, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  buildAttachmentKey,
  getS3Client,
  isS3Configured,
} from '@/lib/s3/s3-client'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProjects } from '@/features/projects/hooks/use-projects'
import { MarkdownReader } from '../components/markdown-reader'
import { MarkdownSourceEditor } from '../components/markdown-source-editor'
import { useDeleteVaultDoc, useUpdateVaultDoc, useVaultDoc, useVaultDocs } from '../hooks/use-vault'

export function VaultDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: user } = useAuth()
  const { data: doc, isLoading } = useVaultDoc(id!)
  const { data: allDocs = [] } = useVaultDocs()
  const { data: projects = [] } = useProjects()
  const updateDoc = useUpdateVaultDoc()
  const deleteDoc = useDeleteVaultDoc()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [projectId, setProjectId] = useState<string>('__none__')
  const [mode, setMode] = useState<'edit' | 'view'>('view')
  const initializedFor = useRef<string | null>(null)

  // Keep latest doc + save fn in refs so the autosave effect can stay lean.
  const docRef = useRef(doc)
  docRef.current = doc
  const saveRef = useRef(updateDoc.mutate)
  saveRef.current = updateDoc.mutate

  useEffect(() => {
    if (doc && initializedFor.current !== doc.id) {
      initializedFor.current = doc.id
      setTitle(doc.title)
      setContent(doc.content)
      setProjectId(doc.projectId ?? '__none__')
      setMode('view')
    }
  }, [doc])

  useEffect(() => {
    if (!id || initializedFor.current !== id) return
    const current = docRef.current
    if (!current) return
    const savedProject = current.projectId ?? null
    const localProject = projectId === '__none__' ? null : projectId
    if (
      title === current.title &&
      content === current.content &&
      localProject === savedProject
    ) {
      return
    }
    const handle = setTimeout(() => {
      saveRef.current({ id: id!, data: { title, content, projectId: localProject } })
    }, 800)
    return () => clearTimeout(handle)
  }, [title, content, projectId, id])

  const handleUploadImage = async (file: File): Promise<string | null> => {
    const s3 = getS3Client()
    if (!s3 || !user?.id || !id) return null
    try {
      const key = buildAttachmentKey(user.id, id, file.name)
      const contentType = file.type || 'application/octet-stream'
      return await s3.putObject(key, file, contentType)
    } catch (err) {
      console.error('Image upload failed:', err)
      return null
    }
  }

  const handleDownload = () => {
    const safeName =
      (title || 'untitled').replace(/[^a-z0-9-_ ]/gi, '').trim() || 'untitled'
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${safeName}.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async () => {
    if (!id) return
    if (!confirm(`Delete "${title || 'this document'}"?`)) return
    const s3 = getS3Client()
    if (s3 && doc?.fileKey) {
      try {
        await s3.deleteObject(doc.fileKey)
      } catch (err) {
        console.error('Failed to delete R2 object:', err)
      }
    }
    await deleteDoc.mutateAsync(id)
    navigate('/vault')
  }

  if (isLoading) {
    return <div className="text-center py-20 text-muted-foreground">Loading document…</div>
  }

  if (!doc) {
    return (
      <div className="text-center py-20 space-y-4">
        <div className="text-destructive font-bold">Document not found</div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Make sure you have applied the database schema (including the markdown_docs table) to your
          Turso database.
        </p>
        <Button variant="outline" onClick={() => navigate('/vault')}>
          Back to Vault
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 pb-4 border-b">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/vault')} className="rounded-full shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-xs text-muted-foreground">
              {updateDoc.isPending ? 'Saving…' : 'Saved'}
            </span>
            <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
              <Button
                variant={mode === 'view' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-full h-8"
                onClick={() => setMode('view')}
              >
                <Eye className="h-4 w-4 mr-1" />
                Read
              </Button>
              <Button
                variant={mode === 'edit' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-full h-8"
                onClick={() => setMode('edit')}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            <Button variant="outline" size="icon" className="rounded-full h-9 w-9" onClick={handleDownload} title="Download .md">
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-9 w-9 hover:bg-destructive hover:text-white"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
          className="text-xl sm:text-2xl font-black border-0 px-0 focus-visible:ring-0 bg-transparent h-auto shadow-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger className="h-8 w-auto min-w-[150px] max-w-[60vw] rounded-full border-dashed text-xs gap-1.5 px-3">
              <SelectValue placeholder="No project" />
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
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
            <span>{doc.source}</span>
            <span>·</span>
            <span>{content.length} chars</span>
            {updateDoc.isPending && (
              <span className="flex items-center gap-1 normal-case tracking-normal">
                <Loader2 className="h-3 w-3 animate-spin" /> saving
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto py-5 max-w-3xl w-full mx-auto min-w-0">
        {mode === 'edit' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
            <MarkdownSourceEditor
              value={content}
              onChange={setContent}
              onUploadImage={isS3Configured() ? handleUploadImage : undefined}
            />
            <div className="rounded-xl border bg-card p-4 overflow-auto min-w-0">
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                Preview
              </div>
              <MarkdownReader content={content} docs={allDocs} />
            </div>
          </div>
        ) : (
          <MarkdownReader content={content} docs={allDocs} />
        )}
      </div>
    </div>
  )
}
