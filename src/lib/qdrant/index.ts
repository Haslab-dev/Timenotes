/**
 * Qdrant Hybrid Search — barrel export
 *
 * Usage:
 *   1. Call configureQdrant + configureEmbedding once at app startup
 *   2. Use hybridSearch() for queries
 *   3. Use indexNote/Task/etc. after CRUD operations
 */

export { configureQdrant, ensureCollection, getClient } from './qdrant-client'
export {
  configureEmbedding,
  getEmbeddingConfig,
  generateEmbedding,
  generateEmbeddings,
} from './embedding'
export { hybridSearch } from './hybrid-search'
export { buildSparseVector, buildQuerySparseVector } from './sparse'
export {
  initSearchIndex,
  indexNote,
  indexTask,
  indexTimeEntry,
  indexProject,
  removeNote,
  removeTask,
  removeTimeEntry,
  removeProject,
  reindexAll,
} from './search-sync'
export type {
  QdrantConfig,
  EmbeddingConfig,
  EmbeddingProvider,
  SearchDocument,
  SearchEntityType,
  SearchResult,
  SearchQuery,
} from './types'
export type {
  IndexableNote,
  IndexableTask,
  IndexableTimeEntry,
  IndexableProject,
  ReindexPayload,
} from './search-sync'
