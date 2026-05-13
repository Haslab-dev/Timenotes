# Qdrant Hybrid Search — How-To

TimeNotes uses **Qdrant Cloud** for hybrid (semantic + keyword) search across all your content — notes, tasks, time entries, and projects.

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User types  │     │  src/lib/qdrant/  │     │  Qdrant Cloud   │
│  "meeting    │────▶│  hybrid-search.ts │────▶│  /points/search │
│   notes"     │     │                    │     │  (dense+sparse) │
└──────────────┘     └──────────────────┘     └────────┬────────┘
       │                     │                         │
       │              ┌──────┴──────┐           RRF fusion
       │              │             │                  │
       │         embedding.ts  sparse.ts        ┌──────▼──────┐
       │         (OpenAI API)  (BM25/FNV-1a)    │  Results[]  │
       │              │             │           └─────────────┘
       │         dense vector  sparse vector
       │         [0.12, -0.4,  {indices, values}
       │          0.87, ...]
       │
       ▼
  useHybridSearch() hook  ──▶  typed SearchResult[]
  (debounced 300ms)
```

**Dense** = semantic meaning (OpenAI embedding)
**Sparse** = keyword matching (BM25-style tokeniser, client-side)
**Fusion** = Qdrant's RRF (Reciprocal Rank Fusion) — combines both scores

## File Map

```
src/lib/qdrant/
├── types.ts              # All type definitions
├── qdrant-client.ts      # REST client (fetch-based, no SDK needed)
├── embedding.ts          # OpenAI-compatible embeddings API
├── sparse.ts             # BM25 tokeniser + sparse vector builder
├── hybrid-search.ts      # Orchestrator: dense + sparse → search
├── search-sync.ts        # Index/remove from CRUD operations
├── search-provider.tsx    # React context provider (init + config)
├── use-hybrid-search.ts  # React hook (debounced, stale-guarded)
└── index.ts              # Barrel exports
```

## 1. Environment Setup

Add these to `.env.local`:

```bash
# Qdrant Cloud (required)
VITE_QDRANT_URL=https://7bec42ad-e598-4aa1-a8f6-9b3020d0bf11.eu-central-1-0.aws.cloud.qdrant.io
VITE_QDRANT_API_KEY=eyJ...your-api-key
VITE_QDRANT_COLLECTION=timenotes

# Embedding provider (required — OpenAI or compatible)
VITE_OPENAI_API_KEY=sk-...
# OR
VITE_EMBEDDING_API_KEY=sk-...
VITE_EMBEDDING_API_URL=https://api.openai.com/v1
VITE_EMBEDDING_MODEL=text-embedding-3-small
```

The embedding API must be OpenAI-compatible. You can swap in:
- **OpenAI** (default) — `text-embedding-3-small` (1536 dims), `text-embedding-3-large` (3072 dims)
- **HuggingFace TEI** — self-hosted, any model
- **Ollama** — `nomic-embed-text`, `mxbai-embed-large`
- **Together AI**, **Voyage AI**, or any endpoint with `/v1/embeddings`

If using a non-OpenAI provider, also set `VITE_EMBEDDING_API_URL`.

## 2. Wrap Your App

In your root layout or `main.tsx`:

```tsx
import { SearchProvider } from '@/lib/qdrant/search-provider'

function App() {
  return (
    <SearchProvider>
      <YourRoutes />
    </SearchProvider>
  )
}
```

`SearchProvider` reads the env vars, configures Qdrant + embeddings, and creates the collection on first load.

## 3. Index Content After CRUD

Call the sync functions after every create/update/delete:

```tsx
import { indexNote, removeNote } from '@/lib/qdrant/search-sync'

// After creating or updating a note:
await indexNote({
  id: note.id,
  userId: currentUser.id,
  title: note.title,
  content: note.content,
})

// After deleting a note:
await removeNote(note.id)
```

Same pattern for tasks, time entries, and projects:

```ts
indexTask({ id, userId, title, description, status, priority })
removeTask(id)

indexTimeEntry({ id, userId, description })
removeTimeEntry(id)

indexProject({ id, userId, name, description })
removeProject(id)
```

These functions strip markdown before indexing (headings, bold, links, code blocks, etc.) for cleaner sparse matching.

## 4. Search with the React Hook

```tsx
import { useHybridSearch } from '@/lib/qdrant/use-hybrid-search'

function SearchBar() {
  const [query, setQuery] = useState('')
  const userId = useCurrentUserId()

  const { results, loading, error } = useHybridSearch(query, userId, {
    entityTypes: ['note', 'task'],   // optional — scope to types
    limit: 10,                        // default 20
    debounceMs: 300,                  // default 300
    minLength: 2,                     // default 2
  })

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading && <Spinner />}
      {results.map(r => (
        <SearchResultCard
          key={r.id}
          title={r.title}
          content={r.content}
          entityType={r.entityType}
          score={r.score}
        />
      ))}
    </div>
  )
}
```

### Hook Behavior

| Property | Description |
|----------|-------------|
| `ready` = false | Qdrant not configured → returns `[]`, no API call |
| `query.length < minLength` | Skips search, clears results |
| `userId` = undefined | Skips search (tenant isolation) |
| Stale requests | Auto-dropped via `latestRequest` ref |
| Errors | Caught, set on `error`, results cleared |

## 5. Direct Search (no React)

```ts
import { hybridSearch } from '@/lib/qdrant/hybrid-search'

const results = await hybridSearch({
  query: 'quarterly budget spreadsheet',
  userId: 'user-123',
  entityTypes: ['note', 'project'],
  limit: 20,
  scoreThreshold: 0.5,   // minimum RRF score
})
// → SearchResult[] with typed entityType, entityId, title, content, score
```

## 6. Bulk Reindex

After a data migration or first user login:

```ts
import { reindexAll } from '@/lib/qdrant/search-sync'

await reindexAll({
  notes: allNotes,         // { id, userId, title, content }[]
  tasks: allTasks,         // { id, userId, title, description, status, priority }[]
  timeEntries: allEntries, // { id, userId, description }[]
  projects: allProjects,   // { id, userId, name, description }[]
})
```

Processes in batches of 10 to respect embedding API rate limits.

## 7. Adding a New Entity Type

1. Add the type to `SearchEntityType` in `types.ts`:
   ```ts
   export type SearchEntityType = 'note' | 'task' | 'time_entry' | 'project' | 'calendar_event'
   ```

2. Add an `IndexableX` interface + `indexX` / `removeX` function in `search-sync.ts` following the existing pattern.

3. Add the index/remove call at the CRUD layer for that entity.

4. Export from `index.ts`.

## 8. Collection Schema

The Qdrant collection is auto-created with:

| Vector | Name | Config |
|--------|------|--------|
| Dense | `"dense"` | Cosine distance, 1536 dims (matches text-embedding-3-small) |
| Sparse | `"sparse"` | Unbounded (no fixed model — indices are FNV-1a hashes of `field:token`) |

Point payload:
```json
{
  "entityType": "note",
  "entityId": "<uuid>",
  "userId": "<user-id>",
  "title": "...",
  "content": "...",
  "status": "pending",     // tasks only
  "priority": "medium"     // tasks only
}
```

## 9. How the Sparse Vector Works

The client-side tokeniser:
1. Lowercases + splits on word boundaries (supports Latin, CJK, Korean)
2. Removes 70+ English stop words
3. Prefixes each token with its field name: `title:meeting`, `content:budget`
4. Weights by sublinear TF: `1 + log(term_frequency)`
5. Hashes `field:token` → u32 via FNV-1a for the sparse index

At query time, each query token is expanded across all common fields (`title`, `content`, `description`) so "budget" matches whether it appeared in a note title or task description.

For production, swap the client-side tokeniser for a server-side SPLADE model if your Qdrant cluster supports it — edit `sparse.ts` and update `buildQuerySparseVector` / `buildSparseVector`.

## 10. Troubleshooting

| Problem | Check |
|---------|-------|
| "Qdrant not configured" in console | `VITE_QDRANT_URL` and `VITE_QDRANT_API_KEY` set in `.env.local`? Restart dev server after changing. |
| `401 Unauthorized` | API key valid? Check Qdrant Cloud dashboard → API Keys. |
| `404 Not Found` | Collection exists? `SearchProvider` creates it on first load — check for creation errors. |
| `Embedding API error 401` | `VITE_OPENAI_API_KEY` or `VITE_EMBEDDING_API_KEY` set? |
| `Embedding API error 400` | Model name correct? Dimension mismatch? Default is 1536 for `text-embedding-3-small`. |
| No results for known content | Was content indexed after creation? Check browser Network tab for `/points/search` calls. |
| Slow search | Embedding API latency. Consider caching embeddings or using a local embedding model. |
| `scoreThreshold` too strict | Default is 0.5 — lower it to 0.3 for more results. |

### Verify Qdrant Connection

```bash
curl -H "api-key: YOUR_API_KEY" \
  "https://7bec42ad-e598-4aa1-a8f6-9b3020d0bf11.eu-central-1-0.aws.cloud.qdrant.io/collections"
```

Should return `{"result":{"collections":[...]}}`.
