/**
 * Hybrid Search Service — orchestrates dense + sparse vector search.
 *
 * Flow:
 *   1. Generate dense embedding for the query via the embedding provider
 *   2. Build a sparse (BM25) vector from the query text
 *   3. Send both to Qdrant's /points/search endpoint
 *   4. Map hits into typed SearchResult objects
 */

import { generateEmbedding } from './embedding'
import { hybridSearchRaw } from './qdrant-client'
import { buildQuerySparseVector } from './sparse'
import type {
  SearchQuery,
  SearchResult,
  SearchEntityType,
  QdrantSearchHit,
} from './types'

// ── Public API ────────────────────────────────────────────────────────

/**
 * Perform a hybrid search across all indexed content.
 *
 * Combines semantic (dense embedding) search with keyword (BM25 sparse)
 * search, fused by Qdrant's RRF algorithm.
 */
export async function hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
  const { query: text, userId, entityTypes, limit = 20, scoreThreshold = 0.5 } = query

  if (!text.trim()) return []

  // 1. Dense vector from embedding provider
  const denseVector = await generateEmbedding(text)

  // 2. Sparse vector from BM25 tokeniser
  const sparseVector = buildQuerySparseVector(text)

  // 3. Build filter — must scope to userId for tenant isolation
  const filter = buildFilter(userId, entityTypes)

  // 4. Execute hybrid search
  const hits = await hybridSearchRaw({
    vector: denseVector,
    sparseVector,
    limit,
    scoreThreshold,
    filter: filter ?? undefined,
  })

  // 5. Map hits → typed results
  return hits.map(hitToSearchResult)
}

// ── Filter builder ────────────────────────────────────────────────────

function buildFilter(
  userId: string,
  entityTypes?: SearchEntityType[]
): Record<string, unknown> | null {
  const must: Record<string, unknown>[] = [
    {
      key: 'userId',
      match: { value: userId },
    },
  ]

  if (entityTypes && entityTypes.length > 0) {
    must.push({
      key: 'entityType',
      match: {
        any: entityTypes.map((t) => ({ value: t })),
      },
    })
  }

  return { must }
}

// ── Hit mapping ───────────────────────────────────────────────────────

function hitToSearchResult(hit: QdrantSearchHit): SearchResult {
  const payload = (hit.payload ?? {}) as Record<string, unknown>

  return {
    id: String(hit.id),
    entityType: (payload.entityType as SearchEntityType) ?? 'note',
    entityId: (payload.entityId as string) ?? '',
    title: (payload.title as string) ?? '',
    content: (payload.content as string) ?? '',
    score: hit.score,
    payload,
  }
}
