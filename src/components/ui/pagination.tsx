import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  hasNext,
  hasPrevious,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startIndex = Math.min((page - 1) * pageSize + 1, total)
  const endIndex = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-border">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>
          Showing <strong className="font-medium text-foreground">{startIndex}</strong>–
          <strong className="font-medium text-foreground">{endIndex}</strong> of{' '}
          <strong className="font-medium text-foreground">{total}</strong> entries
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs text-muted-foreground">Rows</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevious}
            className="h-8 w-8 p-0"
          >
            <IconChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevious}
            className="h-8 w-8 p-0"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 px-2.5">
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {page} / {totalPages || 1}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            className="h-8 w-8 p-0"
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext}
            className="h-8 w-8 p-0"
          >
            <IconChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
