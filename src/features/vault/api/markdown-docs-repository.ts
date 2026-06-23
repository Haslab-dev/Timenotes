import { tursoClient } from '@/lib/turso/turso-client'
import type {
  CreateMarkdownDocRequest,
  MarkdownDoc,
  MarkdownDocSource,
  UpdateMarkdownDocRequest,
} from '../types'

interface MarkdownDocRow {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string
  source: string
  file_key: string | null
  created_at: string
  updated_at: string
}

function rowToDoc(row: MarkdownDocRow): MarkdownDoc {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id ?? null,
    title: row.title,
    content: row.content ?? '',
    source: (row.source as MarkdownDocSource) ?? 'manual',
    fileKey: row.file_key ?? null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

class MarkdownDocsRepository {
  async getAll(userId: string): Promise<MarkdownDoc[]> {
    const rows = await tursoClient.query<MarkdownDocRow>(
      'SELECT * FROM markdown_docs WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    )
    return rows.map(rowToDoc)
  }

  async getById(id: string, userId: string): Promise<MarkdownDoc | null> {
    const rows = await tursoClient.query<MarkdownDocRow>(
      'SELECT * FROM markdown_docs WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return rows.length > 0 ? rowToDoc(rows[0]) : null
  }

  async search(userId: string, query: string): Promise<MarkdownDoc[]> {
    const term = `%${query}%`
    const rows = await tursoClient.query<MarkdownDocRow>(
      `SELECT * FROM markdown_docs
       WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
       ORDER BY updated_at DESC`,
      [userId, term, term]
    )
    return rows.map(rowToDoc)
  }

  async create(data: CreateMarkdownDocRequest, userId: string): Promise<MarkdownDoc> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const source = data.source ?? 'manual'

    await tursoClient.run(
      `INSERT INTO markdown_docs (id, user_id, project_id, title, content, source, file_key, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.projectId ?? null,
        data.title,
        data.content ?? '',
        source,
        data.fileKey ?? null,
        now,
        now,
      ]
    )

    const created = await this.getById(id, userId)
    if (!created) throw new Error('Failed to create markdown document')
    return created
  }

  async update(
    id: string,
    userId: string,
    data: UpdateMarkdownDocRequest
  ): Promise<MarkdownDoc | null> {
    const updates: string[] = []
    const params: (string | null)[] = []

    if (data.title !== undefined) {
      updates.push('title = ?')
      params.push(data.title)
    }
    if (data.content !== undefined) {
      updates.push('content = ?')
      params.push(data.content)
    }
    if (data.projectId !== undefined) {
      updates.push('project_id = ?')
      params.push(data.projectId ?? null)
    }
    if (data.fileKey !== undefined) {
      updates.push('file_key = ?')
      params.push(data.fileKey ?? null)
    }

    if (updates.length === 0) return await this.getById(id, userId)

    updates.push('updated_at = ?')
    params.push(new Date().toISOString())
    params.push(id, userId)

    await tursoClient.run(
      `UPDATE markdown_docs SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params
    )

    return await this.getById(id, userId)
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await tursoClient.run('DELETE FROM markdown_docs WHERE id = ? AND user_id = ?', [
      id,
      userId,
    ])
    return result.changes > 0
  }
}

export const markdownDocsRepository = new MarkdownDocsRepository()
