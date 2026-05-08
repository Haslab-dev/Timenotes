import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, Tags } from 'lucide-react'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { NotesFilters } from '@/lib/hooks/use-filters'

interface NotesFiltersProps {
  filters: NotesFilters
  onFiltersChange: (filters: Partial<NotesFilters>) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  availableTags: string[]
}

export function NotesFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  availableTags,
}: NotesFiltersProps) {
  const { data: projects } = useProjects()
  const [showFilters, setShowFilters] = useState(false)

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ tags: newTags })
  }

  return (
    <div className="space-y-4">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search notes by title, content, or tags..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
              {
                [filters.tags.length > 0 && 'Tags', filters.projectId && 'Project'].filter(Boolean)
                  .length
              }
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
          {/* Project and Tags - Stack on mobile */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Project Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project</Label>
              <Select
                value={filters.projectId || '__none__'}
                onValueChange={(value) =>
                  onFiltersChange({ projectId: value === '__none__' ? undefined : value })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">All projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: project.color }}
                        />
                        <span className="truncate">{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Tags
              </Label>
              <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[36px] bg-background">
                {availableTags.length > 0 ? (
                  availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer text-xs h-6 px-2 hover:bg-primary/90 transition-colors"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground py-1">No tags available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.projectId && (
            <Badge variant="secondary" className="gap-1">
              Project: {projects?.find((p) => p.id === filters.projectId)?.name}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ projectId: undefined })}
              />
            </Badge>
          )}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              Tag: {tag}
              <X className="h-3 w-3 cursor-pointer" onClick={() => handleTagToggle(tag)} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
