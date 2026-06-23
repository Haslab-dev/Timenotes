import { FilePlus2, Search, Upload } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { VaultDashboard } from '../components/vault-dashboard'
import { UploadMarkdownDialog } from '../components/upload-markdown-dialog'
import { useCreateVaultDoc, useDeleteVaultDoc, useVaultDocs } from '../hooks/use-vault'

export function VaultPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dragging, setDragging] = useState(false)

  const { data: docs = [], isLoading } = useVaultDocs(search)
  const createDoc = useCreateVaultDoc()
  const deleteDoc = useDeleteVaultDoc()

  const handleNew = async () => {
    const doc = await createDoc.mutateAsync({ title: 'Untitled', content: '', source: 'manual' })
    navigate(`/vault/${doc.id}`)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files ?? [])
    const importable = droppedFiles.filter((f) => /\.(md|markdown|mdx|txt)$/i.test(f.name))
    if (importable.length === 0) return
    for (const file of importable) {
      const content = await file.text()
      await createDoc.mutateAsync({
        title: file.name.replace(/\.(md|markdown|mdx|txt)$/i, '').replace(/[-_]+/g, ' ').trim() || file.name,
        content,
        source: 'upload',
      })
    }
  }

  return (
    <div
      className="space-y-6 pb-20"
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Vault</h1>
          <p className="text-muted-foreground">
            Your markdown library — upload, paste, edit and read.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-2xl h-11" onClick={() => setDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button
            onClick={handleNew}
            className="rounded-2xl h-11 px-6 font-bold shadow-lg shadow-primary/20"
          >
            <FilePlus2 className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="pl-9 rounded-xl"
        />
      </div>

      {dragging && (
        <div className="rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-8 text-center text-sm font-medium text-primary">
          Drop .md files to import into your vault
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground">Loading vault…</div>
      ) : (
        <VaultDashboard docs={docs} onDelete={(id) => deleteDoc.mutate(id)} />
      )}

      <UploadMarkdownDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
