import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Filter, X, Calendar as CalendarIcon, Tags } from 'lucide-react'
import { format } from 'date-fns'
import { useProjects } from '@/features/projects/hooks/use-projects'
import type { TimesheetFilters } from '@/lib/hooks/use-filters'

interface TimesheetFiltersProps {
  filters: TimesheetFilters
  onFiltersChange: (filters: Partial<TimesheetFilters>) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
  availableTags: string[]
}

export function TimesheetFiltersComponent({
  filters,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  availableTags,
}: TimesheetFiltersProps) {
  const { data: projects } = useProjects()
  const [showFilters, setShowFilters] = useState(false)

  const handleTagToggle = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ tags: newTags })
  }

  const handleDateRangeChange = (field: 'start' | 'end', date: Date | undefined) => {
    onFiltersChange({
      dateRange: {
        ...filters.dateRange,
        [field]: date,
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Search and Toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search time entries..."
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
              {[
                filters.dateRange.start && 'Date',
                filters.tags.length > 0 && 'Tags',
                filters.projectId && 'Project',
              ].filter(Boolean).length}
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
          {/* Date Range - Full width on mobile */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal h-9"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      <span className="text-sm">
                        {filters.dateRange.start ? format(filters.dateRange.start, 'MMM dd, yyyy') : 'Start date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start}
                      onSelect={(date) => handleDateRangeChange('start', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal h-9"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                      <span className="text-sm">
                        {filters.dateRange.end ? format(filters.dateRange.end, 'MMM dd, yyyy') : 'End date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end}
                      onSelect={(date) => handleDateRangeChange('end', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Project and Tags - Stack on mobile */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Project Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Project</Label>
              <Select 
                value={filters.projectId || '__none__'} 
                onValueChange={(value) => onFiltersChange({ projectId: value === '__none__' ? undefined : value })}
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
          {filters.dateRange.start && (
            <Badge variant="secondary" className="gap-1">
              From: {format(filters.dateRange.start, 'MMM dd')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDateRangeChange('start', undefined)}
              />
            </Badge>
          )}
          {filters.dateRange.end && (
            <Badge variant="secondary" className="gap-1">
              To: {format(filters.dateRange.end, 'MMM dd')}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleDateRangeChange('end', undefined)}
              />
            </Badge>
          )}
          {filters.projectId && (
            <Badge variant="secondary" className="gap-1">
              Project: {projects?.find(p => p.id === filters.projectId)?.name}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onFiltersChange({ projectId: undefined })}
              />
            </Badge>
          )}
          {filters.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              Tag: {tag}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
