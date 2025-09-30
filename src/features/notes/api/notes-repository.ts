import { TursoRepository } from '@/lib/api/turso-repository'
import { tursoClient } from '@/lib/turso/turso-client'
import type { NoteRow } from '@/lib/turso/turso-client'
import type { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest 
} from '@/lib/types'

class TursoNotesRepository extends TursoRepository<Note, NoteRow> {
  protected tableName = 'notes'

  protected rowToEntity(row: NoteRow): Note {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      projectId: row.project_id || undefined,
      tags: [], // Will be populated separately
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  protected entityToRow(entity: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Omit<NoteRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: entity.userId,
      project_id: entity.projectId || null,
      title: entity.title,
      content: entity.content,
    }
  }

  async createNote(data: CreateNoteRequest, userId: string): Promise<Note> {
    // Start transaction to create note and tags
    const statements = []
    const noteId = crypto.randomUUID()
    const now = new Date().toISOString()

    // Create note
    statements.push({
      q: `INSERT INTO notes (id, user_id, project_id, title, content, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
      params: [
        noteId,
        userId,
        data.projectId || null,
        data.title,
        data.content,
        now,
        now
      ]
    })

    // Add tags
    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        statements.push({
          q: 'INSERT OR IGNORE INTO note_tags (note_id, tag_name, user_id) VALUES (?, ?, ?)',
          params: [noteId, tag, userId]
        })
      }
    }

    await tursoClient.batch(statements)

    // Return the created note with tags
    return await this.getNoteWithTags(noteId, userId) as Note
  }

  async updateNote(id: string, userId: string, data: UpdateNoteRequest): Promise<Note | null> {
    const existing = await this.getById(id, userId)
    if (!existing) {
      return null
    }

    const statements = []
    
    // Prepare update data
    const updates: string[] = []
    const values: any[] = []
    
    if (data.title !== undefined) {
      updates.push('title = ?')
      values.push(data.title)
    }
    
    if (data.content !== undefined) {
      updates.push('content = ?')
      values.push(data.content)
    }
    
    if (data.projectId !== undefined) {
      updates.push('project_id = ?')
      values.push(data.projectId || null)
    }
    
    if (updates.length > 0) {
      updates.push('updated_at = ?')
      values.push(new Date().toISOString())
      values.push(id, userId)

      // Update note
      statements.push({
        q: `UPDATE notes SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        params: values
      })
    }

    // Handle tags update
    if (data.tags !== undefined) {
      // Delete existing tags
      statements.push({
        q: 'DELETE FROM note_tags WHERE note_id = ? AND user_id = ?',
        params: [id, userId]
      })

      // Add new tags
      for (const tag of data.tags) {
        statements.push({
          q: 'INSERT INTO note_tags (note_id, tag_name, user_id) VALUES (?, ?, ?)',
          params: [id, tag, userId]
        })
      }
    }

    if (statements.length > 0) {
      await tursoClient.batch(statements)
    }

    return await this.getNoteWithTags(id, userId)
  }

  async deleteNote(id: string, userId: string): Promise<boolean> {
    const statements = [
      // Delete tags first
      {
        q: 'DELETE FROM note_tags WHERE note_id = ? AND user_id = ?',
        params: [id, userId]
      },
      // Delete note
      {
        q: 'DELETE FROM notes WHERE id = ? AND user_id = ?',
        params: [id, userId]
      }
    ]

    const response = await tursoClient.batch(statements)
    const lastResult = response.results[response.results.length - 1]
    
    return (lastResult.changes || 0) > 0
  }

  async getNotes(userId: string): Promise<Note[]> {
    const notes = await this.getAll(userId)
    
    // Populate tags for all notes
    const notesWithTags = await Promise.all(
      notes.map(async note => {
        const tags = await this.getTagsForNote(note.id, userId)
        return { ...note, tags }
      })
    )

    return notesWithTags
  }

  async getNote(id: string, userId: string): Promise<Note | null> {
    return await this.getNoteWithTags(id, userId)
  }

  async getNotesByProject(projectId: string, userId: string): Promise<Note[]> {
    const rows = await tursoClient.query<NoteRow>(
      'SELECT * FROM notes WHERE project_id = ? AND user_id = ? ORDER BY updated_at DESC',
      [projectId, userId]
    )

    const notes = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const notesWithTags = await Promise.all(
      notes.map(async note => {
        const tags = await this.getTagsForNote(note.id, userId)
        return { ...note, tags }
      })
    )

    return notesWithTags
  }

  async getNotesByTag(tag: string, userId: string): Promise<Note[]> {
    const rows = await tursoClient.query<NoteRow>(
      `SELECT n.* FROM notes n
       JOIN note_tags nt ON n.id = nt.note_id
       WHERE nt.tag_name = ? AND n.user_id = ?
       ORDER BY n.updated_at DESC`,
      [tag, userId]
    )

    const notes = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const notesWithTags = await Promise.all(
      notes.map(async note => {
        const tags = await this.getTagsForNote(note.id, userId)
        return { ...note, tags }
      })
    )

    return notesWithTags
  }

  async searchNotes(query: string, userId: string): Promise<Note[]> {
    const searchTerm = `%${query.toLowerCase()}%`
    const rows = await tursoClient.query<NoteRow>(
      `SELECT * FROM notes 
       WHERE user_id = ? AND (
         LOWER(title) LIKE ? OR 
         LOWER(content) LIKE ?
       )
       ORDER BY updated_at DESC`,
      [userId, searchTerm, searchTerm]
    )

    const notes = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const notesWithTags = await Promise.all(
      notes.map(async note => {
        const tags = await this.getTagsForNote(note.id, userId)
        return { ...note, tags }
      })
    )

    return notesWithTags
  }

  async getRecentNotes(limit: number, userId: string): Promise<Note[]> {
    const rows = await tursoClient.query<NoteRow>(
      'SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC LIMIT ?',
      [userId, limit]
    )

    const notes = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const notesWithTags = await Promise.all(
      notes.map(async note => {
        const tags = await this.getTagsForNote(note.id, userId)
        return { ...note, tags }
      })
    )

    return notesWithTags
  }

  private async getNoteWithTags(id: string, userId: string): Promise<Note | null> {
    const note = await this.getById(id, userId)
    if (!note) {
      return null
    }

    const tags = await this.getTagsForNote(id, userId)
    return { ...note, tags }
  }

  private async getTagsForNote(noteId: string, userId: string): Promise<string[]> {
    const rows = await tursoClient.query<{ tag_name: string }>(
      'SELECT tag_name FROM note_tags WHERE note_id = ? AND user_id = ?',
      [noteId, userId]
    )

    return rows.map(row => row.tag_name)
  }
}

export const notesRepository = new TursoNotesRepository()
