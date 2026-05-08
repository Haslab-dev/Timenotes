import { useState, useMemo } from 'react'
import type { TimeEntry, Note } from '@/lib/types'

export interface DateRangeFilter {
  start?: Date
  end?: Date
}

export interface TimesheetFilters {
  search: string
  dateRange: DateRangeFilter
  tags: string[]
  projectId?: string
}

export interface NotesFilters {
  search: string
  tags: string[]
  projectId?: string
}

export function useTimesheetFilters(timeEntries: TimeEntry[] | undefined) {
  const [filters, setFilters] = useState<TimesheetFilters>({
    search: '',
    dateRange: {},
    tags: [],
    projectId: undefined,
  })

  const filteredData = useMemo(() => {
    if (!timeEntries) return []

    return timeEntries.filter((entry) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesDescription = entry.description?.toLowerCase().includes(searchTerm)
        const matchesTags = entry.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        if (!matchesDescription && !matchesTags) {
          return false
        }
      }

      // Date range filter
      if (filters.dateRange.start && entry.startTime < filters.dateRange.start) {
        return false
      }
      if (filters.dateRange.end && entry.startTime > filters.dateRange.end) {
        return false
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((filterTag) => entry.tags.includes(filterTag))
        if (!hasMatchingTag) {
          return false
        }
      }

      // Project filter
      if (filters.projectId && entry.projectId !== filters.projectId) {
        return false
      }

      return true
    })
  }, [timeEntries, filters])

  const updateFilters = (newFilters: Partial<TimesheetFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      dateRange: {},
      tags: [],
      projectId: undefined,
    })
  }

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.dateRange.start !== undefined ||
      filters.dateRange.end !== undefined ||
      filters.tags.length > 0 ||
      filters.projectId !== undefined
    )
  }, [filters])

  return {
    filters,
    filteredData,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  }
}

export function useNotesFilters(notes: Note[] | undefined) {
  const [filters, setFilters] = useState<NotesFilters>({
    search: '',
    tags: [],
    projectId: undefined,
  })

  const filteredData = useMemo(() => {
    if (!notes) return []

    return notes.filter((note) => {
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesTitle = note.title.toLowerCase().includes(searchTerm)
        const matchesContent = note.content.toLowerCase().includes(searchTerm)
        const matchesTags = note.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false
        }
      }

      // Tags filter
      if (filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some((filterTag) => note.tags.includes(filterTag))
        if (!hasMatchingTag) {
          return false
        }
      }

      // Project filter
      if (filters.projectId && note.projectId !== filters.projectId) {
        return false
      }

      return true
    })
  }, [notes, filters])

  const updateFilters = (newFilters: Partial<NotesFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      tags: [],
      projectId: undefined,
    })
  }

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' || filters.tags.length > 0 || filters.projectId !== undefined
  }, [filters])

  return {
    filters,
    filteredData,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  }
}
