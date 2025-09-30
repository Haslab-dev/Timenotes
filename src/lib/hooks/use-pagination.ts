import { useState, useMemo } from 'react'

export interface PaginationState {
  page: number
  pageSize: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
  goToPage: (page: number) => void
  goToNext: () => void
  goToPrevious: () => void
  setPageSize: (size: number) => void
}

export function usePagination<T>(
  data: T[] | undefined,
  initialPageSize: number = 10
): PaginationResult<T> {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const paginatedData = useMemo(() => {
    if (!data) return []
    
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, page, pageSize])

  const totalPages = useMemo(() => {
    if (!data) return 0
    return Math.ceil(data.length / pageSize)
  }, [data?.length, pageSize])

  const goToPage = (newPage: number) => {
    const clampedPage = Math.max(1, Math.min(newPage, totalPages))
    setPage(clampedPage)
  }

  const goToNext = () => {
    if (page < totalPages) {
      setPage(page + 1)
    }
  }

  const goToPrevious = () => {
    if (page > 1) {
      setPage(page - 1)
    }
  }

  const handleSetPageSize = (newSize: number) => {
    setPageSize(newSize)
    // Adjust current page if needed
    const newTotalPages = Math.ceil((data?.length || 0) / newSize)
    if (page > newTotalPages) {
      setPage(Math.max(1, newTotalPages))
    }
  }

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total: data?.length || 0,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
    goToPage,
    goToNext,
    goToPrevious,
    setPageSize: handleSetPageSize,
  }
}
