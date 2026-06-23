import { FileText, Trash2, Upload } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { MarkdownDoc } from '../types'

interface VaultDashboardProps {
  docs: MarkdownDoc[]
  onDelete: (id: string) => void
}

function snippet(content: string): string {
  const text = content
    .replace(/^\uFEFF?---[\s\S]*?---\r?\n?/, '')
    .replace(/[#>*`_~\-[\]()!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 120 ? `${text.slice(0, 120)}…` : text
}

const sourceLabel: Record<string, string> = {
  manual: 'Manual',
  upload: 'Uploaded',
  paste: 'Pasted',
}

export function VaultDashboard({ docs, onDelete }: VaultDashboardProps) {
  const navigate = useNavigate()

  if (docs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-3xl bg-muted/20 text-center">
        <Upload className="h-12 w-12 text-muted-foreground mb-4 opacity-30" />
        <p className="text-muted-foreground font-medium">Your vault is empty</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Create a new document, upload <code>.md</code> files, or paste markdown to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map((doc) => (
        <div
          key={doc.id}
          onClick={() => navigate(`/vault/${doc.id}`)}
          className="group relative flex flex-col gap-3 p-5 bg-card border rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {doc.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Delete "${doc.title}"?`)) onDelete(doc.id)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
            {snippet(doc.content) || 'Empty document'}
          </p>

          <div className="flex items-center justify-between mt-auto pt-2 border-t">
            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
              {sourceLabel[doc.source] ?? doc.source}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
