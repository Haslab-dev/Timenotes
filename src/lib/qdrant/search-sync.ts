/**
 * Search Sync Service — indexes/removes app content in Qdrant.
 *
 * Keeps the Qdrant vector store in sync with Turso data. Call these
 * functions after any CRUD operation on notes, tasks, time entries,
 * or projects to maintain search freshness.
 *
 * Usage:
 *   import { indexNote, removeNote } from '@/lib/qdrant/search-sync'
 *   // After creating/updating a note:
 *   await indexNote({id, userId, title, content, ...})
 *   // After deleting a note:
 *   await removeNote(noteId)
 */

import { generateEmbeddings } from './embedding'
import { ensureCollection, upsertPoints, deletePoints } from './qdrant-client'
import { buildSparseVector } from './sparse'
import type { SearchDocument, SearchEntityType } from './types'

// ── Helpers ───────────────────────────────────────────────────────────

/** Strip markdown formatting for cleaner sparse-vector indexing */
function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/^[>\s]*>+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/~~(.+?)~~/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

// ── Public API ────────────────────────────────────────────────────────

/** One-off initialisation: creates the Qdrant collection if missing */
export async function initSearchIndex(): Promise<void> {
  await ensureCollection()
}

// ── Index single documents ────────────────────────────────────────────

export interface IndexableNote {
  id: string
  userId: string
  title: string
  content: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export async function indexNote(note: IndexableNote): Promise<void> {
  await indexDocuments([
    {
      id: note.id,
      entityType: 'note',
      entityId: note.id,
      userId: note.userId,
      title: note.title,
      content: stripMarkdown(note.content),
      payload: {},
    },
  ])
}

export interface IndexableTask {
  id: string
  userId: string
  title: string
  description?: string | null
  status?: string
  priority?: string
}

export async function indexTask(task: IndexableTask): Promise<void> {
  await indexDocuments([
    {
      id: task.id,
      entityType: 'task',
      entityId: task.id,
      userId: task.userId,
      title: task.title,
      content: task.description ?? '',
      payload: {
        status: task.status ?? 'pending',
        priority: task.priority ?? 'medium',
      },
    },
  ])
}

export interface IndexableTimeEntry {
  id: string
  userId: string
  description?: string | null
}

export async function indexTimeEntry(entry: IndexableTimeEntry): Promise<void> {
  const description = entry.description ?? ''
  await indexDocuments([
    {
      id: entry.id,
      entityType: 'time_entry',
      entityId: entry.id,
      userId: entry.userId,
      title: description.slice(0, 100),
      content: description,
      payload: {},
    },
  ])
}

export interface IndexableProject {
  id: string
  userId: string
  name: string
  description?: string | null
}

export async function indexProject(project: IndexableProject): Promise<void> {
  await indexDocuments([
    {
      id: `project:${project.id}`,
      entityType: 'project',
      entityId: project.id,
      userId: project.userId,
      title: project.name,
      content: project.description ?? '',
      payload: {},
    },
  ])
}

// ── Remove single documents ───────────────────────────────────────────

export async function removeNote(noteId: string): Promise<void> {
  await removeDocument(`note:${noteId}`)
}

export async function removeTask(taskId: string): Promise<void> {
  await removeDocument(`task:${taskId}`)
}

export async function removeTimeEntry(entryId: string): Promise<void> {
  await removeDocument(`time_entry:${entryId}`)
}

export async function removeProject(projectId: string): Promise<void> {
  await removeDocument(`project:${projectId}`)
}

// ── Batch reindex (full sync for a user) ──────────────────────────────

export interface ReindexPayload {
  notes: Array<{ id: string; userId: string; title: string; content: string }>
  tasks: Array<{
    id: string
    userId: string
    title: string
    description: string | null
    status: string
    priority: string
  }>
  timeEntries: Array<{
    id: string
    userId: string
    description: string | null
  }>
  projects: Array<{
    id: string
    userId: string
    name: string
    description: string | null
  }>
}

/**
 * Bulk-reindex all content for a user. Call this on first login or
 * after large data migrations.
 */
export async function reindexAll(payload: ReindexPayload): Promise<void> {
  await ensureCollection()

  const documents: SearchDocument[] = []

  for (const n of payload.notes) {
    documents.push({
      id: `note:${n.id}`,
      entityType: 'note',
      entityId: n.id,
      userId: n.userId,
      title: n.title,
      content: stripMarkdown(n.content),
      payload: {},
    })
  }

  for (const t of payload.tasks) {
    documents.push({
      id: `task:${t.id}`,
      entityType: 'task',
      entityId: t.id,
      userId: t.userId,
      title: t.title,
      content: t.description ?? '',
      payload: { status: t.status, priority: t.priority },
    })
  }

  for (const te of payload.timeEntries) {
    const desc = te.description ?? ''
    documents.push({
      id: `time_entry:${te.id}`,
      entityType: 'time_entry',
      entityId: te.id,
      userId: te.userId,
      title: desc.slice(0, 100),
      content: desc,
      payload: {},
    })
  }

  for (const p of payload.projects) {
    documents.push({
      id: `project:${p.id}`,
      entityType: 'project',
      entityId: p.id,
      userId: p.userId,
      title: p.name,
      content: p.description ?? '',
      payload: {},
    })
  }

  if (documents.length === 0) return

  // Index in batches of 10 to respect embedding API rate limits
  const BATCH_SIZE = 10
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    await indexDocuments(batch)
  }
}

// ── Internal ──────────────────────────────────────────────────────────

async function indexDocuments(docs: SearchDocument[]): Promise<void> {
  if (docs.length === 0) return

  await ensureCollection()

  // Generate embeddings for all documents in one batch
  const texts = docs.map((d) => `${d.title}\n\n${d.content}`)
  const { vectors } = await generateEmbeddings(texts)

  // Build points with dense + sparse vectors
  const points = docs.map((doc, i) => {
    const sparseVec = buildSparseVector({
      title: doc.title,
      content: doc.content,
    })

    return {
      id: doc.id,
      vector: vectors[i],
      sparseVector: sparseVec,
      payload: {
        entityType: doc.entityType,
        entityId: doc.entityId,
        userId: doc.userId,
        title: doc.title,
        content: doc.content,
        ...doc.payload,
      },
    }
  })

  await upsertPoints(points)
}

async function removeDocument(qdrantId: string): Promise<void> {
  await deletePoints([qdrantId])
}
