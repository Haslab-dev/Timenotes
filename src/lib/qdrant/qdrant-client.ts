/**
 * Qdrant REST Client — low-level wrapper around Qdrant's HTTP API.
 *
 * Handles:
 *   - Collection creation (dense + sparse vector config)
 *   - Point upsert with dense + sparse vectors
 *   - Hybrid search (dense + sparse) via /points/search
 *   - Point deletion
 *
 * Uses fetch() directly — no SDK dependency beyond types.
 */

import type { QdrantConfig, QdrantSparseVector, QdrantSearchHit } from './types'

// ── Global config ──────────────────────────────────────────────────────

let _config: QdrantConfig = {
  url: '',
  apiKey: '',
  collectionName: 'timenotes',
  vectorSize: 3072,
  distance: 'Cosine',
}

/** Override the global Qdrant config at runtime */
export function configureQdrant(config: Partial<QdrantConfig>): void {
  _config = { ..._config, ...config }
}

/** Read the current config */
export function getClient(): QdrantConfig {
  return { ..._config }
}

// ── Auth header ────────────────────────────────────────────────────────

function authHeader(): Record<string, string> {
  return { 'api-key': _config.apiKey }
}

function baseUrl(): string {
  return _config.url.replace(/\/$/, '')
}

// ── Collection management ──────────────────────────────────────────────

/**
 * Ensure the Qdrant collection exists, creating it if necessary.
 *
 * Creates a collection with:
 *   - A dense vector named "dense" (e.g. 1536-dim Cosine)
 *   - A sparse vector named "sparse" (unbounded, no fixed model)
 */
export async function ensureCollection(): Promise<void> {
  const url = `${baseUrl()}/collections/${_config.collectionName}`

  // Check if collection already exists
  const exists = await _collectionExists(url)
  if (exists) return

  // Create with dense + sparse vector configuration
  const createUrl = `${baseUrl()}/collections/${_config.collectionName}`
  const res = await fetch(createUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({
      vectors: {
        dense: {
          size: _config.vectorSize,
          distance: _config.distance,
        },
      },
      sparse_vectors: {
        sparse: {},
      },
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Failed to create Qdrant collection: ${res.status} ${body}`)
  }
}

async function _collectionExists(url: string): Promise<boolean> {
  const res = await fetch(url, { headers: authHeader() })
  if (res.status === 200) return true
  if (res.status === 404) return false

  const body = await res.text()
  throw new Error(`Qdrant collection check failed: ${res.status} ${body}`)
}

// ── Point operations ───────────────────────────────────────────────────

interface UpsertPoint {
  id: string
  vector: number[]
  sparseVector: QdrantSparseVector
  payload: Record<string, unknown>
}

/**
 * Upsert (insert or update) points with dense + sparse vectors.
 */
export async function upsertPoints(points: UpsertPoint[]): Promise<void> {
  if (points.length === 0) return

  const url = `${baseUrl()}/collections/${_config.collectionName}/points`

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({
      points: points.map((p) => ({
        id: p.id,
        vector: {
          dense: p.vector,
          sparse: p.sparseVector,
        },
        payload: p.payload,
      })),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Qdrant upsert failed: ${res.status} ${body}`)
  }
}

/**
 * Delete points by ID.
 */
export async function deletePoints(ids: string[]): Promise<void> {
  if (ids.length === 0) return

  const url = `${baseUrl()}/collections/${_config.collectionName}/points/delete`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({ points: ids }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Qdrant delete failed: ${res.status} ${body}`)
  }
}

// ── Hybrid search ──────────────────────────────────────────────────────

interface HybridSearchParams {
  vector: number[]
  sparseVector: QdrantSparseVector
  limit: number
  scoreThreshold: number
  filter?: Record<string, unknown>
}

interface QdrantSearchResponse {
  result: QdrantSearchHit[]
  status: string
  time: number
}

/**
 * Execute a hybrid (dense + sparse) vector search via Qdrant's
 * `/points/search` endpoint. Qdrant fuses the results using RRF
 * (Reciprocal Rank Fusion) by default.
 */
export async function hybridSearchRaw(
  params: HybridSearchParams
): Promise<QdrantSearchHit[]> {
  const { vector, sparseVector, limit, scoreThreshold, filter } = params

  const url = `${baseUrl()}/collections/${_config.collectionName}/points/search`

  const body: Record<string, unknown> = {
    vector: {
      name: 'dense',
      vector,
    },
    sparse_vector: {
      name: 'sparse',
      vector: sparseVector,
    },
    limit,
    score_threshold: scoreThreshold,
    with_payload: true,
    with_vector: false,
  }

  if (filter) {
    body.filter = filter
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    throw new Error(`Qdrant search failed: ${res.status} ${errorBody}`)
  }

  const data: QdrantSearchResponse = await res.json()
  return data.result
}
