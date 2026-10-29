import { IconFileText, IconTrash, IconUpload } from '@tabler/icons-react'
import { useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      <Card className="flex flex-col items-center justify-center py-14 border-dashed text-center">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center mb-3">
          <IconUpload className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Your vault is empty</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Create a new document, upload <code>.md</code> files, or paste markdown to get started.
        </p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {docs.map((doc) => (
        <Card
          key={doc.id}
          onClick={() => navigate(`/vault/${doc.id}`)}
          className="group relative flex flex-col gap-3 p-5 cursor-pointer transition-colors hover:border-primary/40"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-tertiary text-tertiary-foreground flex items-center justify-center shrink-0">
                <IconFileText className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {doc.title}
              </h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation()
                if (confirm(`Delete "${doc.title}"?`)) onDelete(doc.id)
              }}
            >
              <IconTrash className="h-3.5 w-3.5" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3.25rem] leading-relaxed">
            {snippet(doc.content) || 'Empty document'}
          </p>

          <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-border/60">
            <Badge variant="secondary" className="text-[11px]">
              {sourceLabel[doc.source] ?? doc.source}
            </Badge>
            <span className="text-xs text-muted-foreground tabular-nums">
              {new Date(doc.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
