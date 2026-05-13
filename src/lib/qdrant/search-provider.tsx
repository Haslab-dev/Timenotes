/**
 * Qdrant Search Provider — initialises Qdrant & embedding config at app startup.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { configureQdrant, configureEmbedding, initSearchIndex } from './index'

// ── Context ───────────────────────────────────────────────────────────

interface SearchContextValue {
  /** Whether the Qdrant collection has been initialised */
  ready: boolean
  /** Error during initialisation, if any */
  error: Error | null
}

const SearchContext = createContext<SearchContextValue>({
  ready: false,
  error: null,
})

// ── Provider ──────────────────────────────────────────────────────────

export function SearchProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const init = async () => {
      try {
        // ── Qdrant config from env vars ──────────────────────────
        const qdrantUrl = import.meta.env.VITE_QDRANT_URL as string
        const qdrantApiKey = import.meta.env.VITE_QDRANT_API_KEY as string

        if (!qdrantUrl || !qdrantApiKey) {
          console.warn(
            'Qdrant not configured. Set VITE_QDRANT_URL and VITE_QDRANT_API_KEY in .env.local to enable hybrid search.'
          )
          setReady(false)
          return
        }

        // ── Embedding dimensions (drives both Qdrant vector size & embedding API) ──
        const dimensions = parseInt(
          (import.meta.env.VITE_EMBEDDING_DIMENSIONS as string) || '3072',
          10
        )

        configureQdrant({
          url: qdrantUrl,
          apiKey: qdrantApiKey,
          collectionName: import.meta.env.VITE_QDRANT_COLLECTION || 'timenotes',
          vectorSize: dimensions,
          distance: 'Cosine',
        })

        // ── Embedding config from env vars ───────────────────────
        const embedApiKey =
          (import.meta.env.VITE_EMBEDDING_API_KEY as string) ||
          (import.meta.env.VITE_OPENAI_API_KEY as string)

        if (embedApiKey) {
          configureEmbedding({
            apiKey: embedApiKey,
            apiUrl:
              (import.meta.env.VITE_EMBEDDING_API_URL as string) || 'https://api.openai.com/v1',
            model:
              (import.meta.env.VITE_EMBEDDING_MODEL as string) || 'openai/text-embedding-3-large',
            dimensions,
          })
        }

        // ── Create collection if missing ─────────────────────────
        await initSearchIndex()
        setReady(true)
      } catch (err) {
        console.error('Failed to initialise Qdrant search:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setReady(false)
      }
    }

    init()
  }, [])

  return <SearchContext.Provider value={{ ready, error }}>{children}</SearchContext.Provider>
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useSearchStatus() {
  return useContext(SearchContext)
}
