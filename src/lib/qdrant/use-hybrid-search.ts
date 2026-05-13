/**
 * useHybridSearch — React hook for Qdrant hybrid (semantic + keyword) search.
 *
 * Debounces input by 300ms so we don't hammer the embedding API on every keystroke.
 * Falls back gracefully if Qdrant is not yet configured.
 */

import { useState, useEffect, useRef } from 'react'
import { hybridSearch } from './hybrid-search'
import { useSearchStatus } from './search-provider'
import type { SearchResult, SearchEntityType } from './types'

interface UseHybridSearchOptions {
  /** Which entity types to search (default: all) */
  entityTypes?: SearchEntityType[]
  /** Max results (default: 20) */
  limit?: number
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number
  /** Minimum query length before searching (default: 2) */
  minLength?: number
}

interface UseHybridSearchResult {
  /** Raw search results from Qdrant */
  results: SearchResult[]
  /** Whether a search is currently in flight */
  loading: boolean
  /** Error from the last search, if any */
  error: Error | null
  /** Total result count */
  total: number
}

/**
 * Hybrid search hook — call with a query + userId to get vector results.
 *
 * @example
 *   const { results, loading } = useHybridSearch(query, userId, {
 *     entityTypes: ['note', 'task'],
 *   })
 */
export function useHybridSearch(
  query: string,
  userId: string | undefined,
  options: UseHybridSearchOptions = {}
): UseHybridSearchResult {
  const { ready } = useSearchStatus()
  const { entityTypes, limit = 20, debounceMs = 300, minLength = 2 } = options

  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Track the latest request to prevent stale results
  const latestRequest = useRef(0)

  useEffect(() => {
    // Skip if not ready, no user, or query too short
    if (!ready || !userId || !query || query.trim().length < minLength) {
      setResults([])
      setError(null)
      setLoading(false)
      return
    }

    const requestId = ++latestRequest.current

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        const hits = await hybridSearch({
          query: query.trim(),
          userId,
          entityTypes,
          limit,
        })

        // Only use results from the latest request
        if (requestId === latestRequest.current) {
          setResults(hits)
          setLoading(false)
        }
      } catch (err) {
        if (requestId === latestRequest.current) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setResults([])
          setLoading(false)
        }
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, userId, ready, entityTypes?.join(','), limit, debounceMs, minLength])

  return {
    results,
    loading,
    error,
    total: results.length,
  }
}
