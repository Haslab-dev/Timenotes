/**
 * Embedding provider — generates dense vectors for hybrid search.
 *
 * Uses an OpenAI-compatible embeddings API. The default config points at
 * OpenAI's text-embedding-3-small (1536 dims), but any compatible endpoint
 * works (HuggingFace TEI, Ollama, local models, etc.).
 */

import type { EmbeddingConfig } from './types'

// ── Default embedding config ──────────────────────────────────────────
let _config: EmbeddingConfig = {
  provider: 'openai',
  apiUrl: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'openai/text-embedding-3-large',
  dimensions: 3072,
}

/** Override the global embedding config at runtime */
export function configureEmbedding(config: Partial<EmbeddingConfig>): void {
  _config = { ..._config, ...config }
}

/** Read the current config */
export function getEmbeddingConfig(): EmbeddingConfig {
  return { ..._config }
}

// ── Generate embeddings ───────────────────────────────────────────────

export interface EmbeddingResponse {
  vectors: number[][]
  /** Tokens used (if reported by the API) */
  usage?: { prompt_tokens: number; total_tokens: number }
}

/**
 * Generate dense embeddings for one or more text inputs.
 * Batch-chunks automatically at 20 texts per request to stay under
 * provider limits.
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResponse> {
  if (texts.length === 0) return { vectors: [] }

  const BATCH_SIZE = 20
  const allVectors: number[][] = []
  let totalPromptTokens = 0
  let totalTotalTokens = 0

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const result = await _embedBatch(batch)
    allVectors.push(...result.data.map((d) => d.embedding))
    if (result.usage) {
      totalPromptTokens += result.usage.prompt_tokens
      totalTotalTokens += result.usage.total_tokens
    }
  }

  return {
    vectors: allVectors,
    usage: { prompt_tokens: totalPromptTokens, total_tokens: totalTotalTokens },
  }
}

/**
 * Generate a single embedding vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await generateEmbeddings([text])
  return result.vectors[0]
}

// ── Internal ──────────────────────────────────────────────────────────

interface OpenAIEmbeddingResponse {
  data: Array<{ embedding: number[]; index: number }>
  usage?: { prompt_tokens: number; total_tokens: number }
}

async function _embedBatch(texts: string[]): Promise<OpenAIEmbeddingResponse> {
  const url = `${_config.apiUrl.replace(/\/$/, '')}/embeddings`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${_config.apiKey}`,
    },
    body: JSON.stringify({
      model: _config.model,
      input: texts,
      dimensions: _config.dimensions,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Embedding API error ${res.status}: ${body}`)
  }

  return res.json()
}
