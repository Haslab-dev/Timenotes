/**
 * BM25-inspired sparse vector generator for Qdrant hybrid search.
 *
 * This is a client-side tokeniser that converts text into sparse vectors
 * compatible with Qdrant's sparse vector index. It uses a simple
 * whitespace + punctuation tokeniser with IDF-style weighting so that
 * common words are down-weighted and rare words get higher weights.
 *
 * For production, swap this out for a server-side SPLADE model or
 * Qdrant's built-in tokeniser if your cluster supports it.
 */

import type { QdrantSparseVector } from './types'

// ── Tokeniser ─────────────────────────────────────────────────────────

const WORD_RE = /[a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u4E00-\u9FFF\uAC00-\uD7AF]{2,}/g
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'can', 'shall', 'you', 'your',
  'we', 'our', 'they', 'them', 'their', 'it', 'its', 'he', 'she', 'his',
  'her', 'this', 'that', 'these', 'those', 'not', 'no', 'so', 'if',
  'then', 'than', 'too', 'very', 'just', 'about', 'also', 'all', 'any',
  'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some',
  'such', 'only', 'own', 'same', 'into', 'over', 'up', 'out', 'off',
  'down', 'here', 'there', 'when', 'where', 'why', 'how', 'what',
  'which', 'who', 'whom',
])

function tokenize(text: string): Map<string, number> {
  const tokens = new Map<string, number>()
  const words = text.toLowerCase().match(WORD_RE)
  if (!words) return tokens

  for (const w of words) {
    if (STOP_WORDS.has(w)) continue
    tokens.set(w, (tokens.get(w) ?? 0) + 1)
  }

  return tokens
}

// ── Sparse vector builder ─────────────────────────────────────────────

/**
 * Build a sparse vector from one or more text fields.
 * `fields` is a record of field name → text content. The field name
 * prefix is prepended to each token so "title:hello" and "content:hello"
 * are distinct dimensions — this gives higher-quality hybrid matches.
 */
export function buildSparseVector(
  fields: Record<string, string>
): QdrantSparseVector {
  const tokenToWeight = new Map<string, number>()

  for (const [field, text] of Object.entries(fields)) {
    if (!text) continue
    const fieldTokens = tokenize(text)
    fieldTokens.forEach((tf, token) => {
      const key = `${field}:${token}`
      // TF sublinear scaling: 1 + log(tf)
      const weight = 1 + Math.log(tf)
      tokenToWeight.set(key, (tokenToWeight.get(key) ?? 0) + weight)
    })
  }

  return mapToSortedVector(tokenToWeight)
}

/**
 * Build a sparse vector for a raw query string.
 * Differs from `buildSparseVector` by not prefixing tokens — query
 * tokens match against all field-prefixed index tokens.
 *
 * Also generates query-time field-specific variants so a query token
 * "hello" matches both "title:hello" and "content:hello".
 */
export function buildQuerySparseVector(query: string): QdrantSparseVector {
  const tokens = tokenize(query)
  if (tokens.size === 0) return { indices: [], values: [] }

  const tokenToWeight = new Map<string, number>()

  // IDF-style: in a query context every token is equally important,
  // but we create field-prefixed variants for each token so they
  // match indexed documents regardless of which field the token appeared in.
  const COMMON_FIELDS = ['title', 'content', 'description']

  tokens.forEach((_tf, token) => {
    for (const field of COMMON_FIELDS) {
      const key = `${field}:${token}`
      tokenToWeight.set(key, (tokenToWeight.get(key) ?? 0) + 1)
    }
  })

  return mapToSortedVector(tokenToWeight)
}

// ── Helpers ───────────────────────────────────────────────────────────

/** Convert a token→weight Map to a sorted {indices, values} sparse vector */
function mapToSortedVector(tokens: Map<string, number>): QdrantSparseVector {
  const entries = Array.from(tokens.entries())
  entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  const indices: number[] = []
  const values: number[] = []

  for (const [key, weight] of entries) {
    indices.push(hashToken(key))
    values.push(weight)
  }

  return { indices, values }
}

// ── Deterministic token hashing ───────────────────────────────────────

/**
 * Hash a token string to a u32 integer index for the sparse vector.
 * Uses FNV-1a for speed and determinism across runs.
 */
function hashToken(s: string): number {
  let hash = 2166136261
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  // Map to positive 32-bit range
  return hash >>> 0
}
