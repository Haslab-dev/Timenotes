/**
 * Qdrant Hybrid Search — type definitions
 */

// ── Qdrant connection config ──────────────────────────────────────────
export interface QdrantConfig {
  url: string
  apiKey: string
  collectionName?: string
  /** Dense vector dimension (depends on embedding model, e.g. 3072 for text-embedding-3-large) */
  vectorSize?: number
  /** Distance metric for dense vectors */
  distance?: 'Cosine' | 'Euclid' | 'Dot'
}

// ── Embedding provider config ─────────────────────────────────────────
export type EmbeddingProvider = 'openai' | 'custom'

export interface EmbeddingConfig {
  provider: EmbeddingProvider
  /** API base URL (OpenAI-compatible endpoint) */
  apiUrl: string
  apiKey: string
  model: string
  /** Dimension of the output vector */
  dimensions: number
}

// ── Search document (indexed item) ─────────────────────────────────────
export type SearchEntityType = 'note' | 'task' | 'time_entry' | 'project'

export interface SearchDocument {
  /** Unique ID — prefixed with entity type, e.g. "note:<uuid>" */
  id: string
  entityType: SearchEntityType
  entityId: string
  userId: string
  title: string
  content: string
  /** Arbitrary metadata stored alongside the vector */
  payload: Record<string, unknown>
}

// ── Search result ─────────────────────────────────────────────────────
export interface SearchResult {
  id: string
  entityType: SearchEntityType
  entityId: string
  title: string
  content: string
  score: number
  payload: Record<string, unknown>
}

// ── Search query ──────────────────────────────────────────────────────
export interface SearchQuery {
  query: string
  /** Filter by user (required — enforces tenant isolation) */
  userId: string
  /** Optional entity-type scoping */
  entityTypes?: SearchEntityType[]
  /** Max results (default 20) */
  limit?: number
  /** Score threshold for dense matches (0-1, default 0.5) */
  scoreThreshold?: number
}

// ── Hybrid search raw response shapes ─────────────────────────────────
export interface QdrantSparseVector {
  indices: number[]
  values: number[]
}

export interface QdrantSearchHit {
  id: string | number
  version: number
  score: number
  payload?: Record<string, unknown>
  vector?: number[] | Record<string, number[]> | null
}
