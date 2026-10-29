import { IconFilePlus, IconSearch, IconUpload } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
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
        title:
          file.name
            .replace(/\.(md|markdown|mdx|txt)$/i, '')
            .replace(/[-_]+/g, ' ')
            .trim() || file.name,
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
      <PageHeader
        title="Vault"
        description="Your markdown knowledge base — upload, paste, edit, and read."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              <IconUpload className="mr-1.5 h-4 w-4" />
              Upload
            </Button>
            <Button size="sm" onClick={handleNew}>
              <IconFilePlus className="mr-1.5 h-4 w-4" />
              New Document
            </Button>
          </>
        }
      />

      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="pl-9"
        />
      </div>

      {dragging && (
        <div className="rounded-xl border border-dashed border-primary bg-tertiary/40 p-8 text-center text-sm font-medium text-tertiary-foreground">
          Drop .md files to import into your vault
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-sm text-muted-foreground">Loading vault…</div>
      ) : (
        <VaultDashboard docs={docs} onDelete={(id) => deleteDoc.mutate(id)} />
      )}

      <UploadMarkdownDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
