import { TursoRepository } from '@/lib/api/turso-repository'
import { tursoClient } from '@/lib/turso/turso-client'
import type { TimeEntryRow } from '@/lib/turso/turso-client'
import type { 
  TimeEntry, 
  CreateTimeEntryRequest, 
  UpdateTimeEntryRequest,
  TimeRange 
} from '@/lib/types'

class TursoTimesheetRepository extends TursoRepository<TimeEntry, TimeEntryRow> {
  protected tableName = 'time_entries'

  protected rowToEntity(row: TimeEntryRow): TimeEntry {
    return {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      description: row.description || undefined,
      startTime: new Date(row.start_time),
      endTime: new Date(row.end_time),
      duration: row.duration,
      tags: [], // Will be populated separately
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  protected entityToRow(entity: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>): Omit<TimeEntryRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: entity.userId,
      project_id: entity.projectId,
      description: entity.description || null,
      start_time: entity.startTime.toISOString(),
      end_time: entity.endTime.toISOString(),
      duration: entity.duration,
    }
  }

  async createTimeEntry(data: CreateTimeEntryRequest, userId: string): Promise<TimeEntry> {
    // Calculate duration in minutes
    const duration = Math.round(
      (data.endTime.getTime() - data.startTime.getTime()) / (1000 * 60)
    )

    // Start transaction to create time entry and tags
    const statements = []
    const entryId = crypto.randomUUID()
    const now = new Date().toISOString()

    // Create time entry
    statements.push({
      q: `INSERT INTO time_entries (id, user_id, project_id, description, start_time, end_time, duration, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params: [
        entryId,
        userId,
        data.projectId,
        data.description || null,
        data.startTime.toISOString(),
        data.endTime.toISOString(),
        duration,
        now,
        now
      ]
    })

    // Add tags
    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        statements.push({
          q: 'INSERT OR IGNORE INTO time_entry_tags (time_entry_id, tag_name, user_id) VALUES (?, ?, ?)',
          params: [entryId, tag, userId]
        })
      }
    }

    await tursoClient.batch(statements)

    // Return the created entry with tags
    return await this.getTimeEntryWithTags(entryId, userId) as TimeEntry
  }

  async updateTimeEntry(id: string, userId: string, data: UpdateTimeEntryRequest): Promise<TimeEntry | null> {
    const existing = await this.getById(id, userId)
    if (!existing) {
      return null
    }

    const statements = []
    
    // Prepare update data
    const updates: string[] = []
    const values: any[] = []
    
    if (data.projectId !== undefined) {
      updates.push('project_id = ?')
      values.push(data.projectId)
    }
    
    if (data.description !== undefined) {
      updates.push('description = ?')
      values.push(data.description || null)
    }
    
    if (data.startTime !== undefined) {
      updates.push('start_time = ?')
      values.push(data.startTime.toISOString())
    }
    
    if (data.endTime !== undefined) {
      updates.push('end_time = ?')
      values.push(data.endTime.toISOString())
    }

    // Recalculate duration if times changed
    const newStartTime = data.startTime || existing.startTime
    const newEndTime = data.endTime || existing.endTime
    const newDuration = Math.round((newEndTime.getTime() - newStartTime.getTime()) / (1000 * 60))
    
    updates.push('duration = ?')
    values.push(newDuration)
    
    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id, userId)

    // Update time entry
    statements.push({
      q: `UPDATE time_entries SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      params: values
    })

    // Handle tags update
    if (data.tags !== undefined) {
      // Delete existing tags
      statements.push({
        q: 'DELETE FROM time_entry_tags WHERE time_entry_id = ? AND user_id = ?',
        params: [id, userId]
      })

      // Add new tags
      for (const tag of data.tags) {
        statements.push({
          q: 'INSERT INTO time_entry_tags (time_entry_id, tag_name, user_id) VALUES (?, ?, ?)',
          params: [id, tag, userId]
        })
      }
    }

    await tursoClient.batch(statements)

    return await this.getTimeEntryWithTags(id, userId)
  }

  async deleteTimeEntry(id: string, userId: string): Promise<boolean> {
    const statements = [
      // Delete tags first
      {
        q: 'DELETE FROM time_entry_tags WHERE time_entry_id = ? AND user_id = ?',
        params: [id, userId]
      },
      // Delete time entry
      {
        q: 'DELETE FROM time_entries WHERE id = ? AND user_id = ?',
        params: [id, userId]
      }
    ]

    const response = await tursoClient.batch(statements)
    const lastResult = response.results[response.results.length - 1]
    
    return (lastResult.changes || 0) > 0
  }

  async getTimeEntries(userId: string): Promise<TimeEntry[]> {
    const entries = await this.getAll(userId)
    
    // Populate tags for all entries
    const entriesWithTags = await Promise.all(
      entries.map(async entry => {
        const tags = await this.getTagsForTimeEntry(entry.id, userId)
        return { ...entry, tags }
      })
    )

    return entriesWithTags
  }

  async getTimeEntry(id: string, userId: string): Promise<TimeEntry | null> {
    return await this.getTimeEntryWithTags(id, userId)
  }

  async getTimeEntriesByProject(projectId: string, userId: string): Promise<TimeEntry[]> {
    const rows = await tursoClient.query<TimeEntryRow>(
      'SELECT * FROM time_entries WHERE project_id = ? AND user_id = ? ORDER BY start_time DESC',
      [projectId, userId]
    )

    const entries = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const entriesWithTags = await Promise.all(
      entries.map(async entry => {
        const tags = await this.getTagsForTimeEntry(entry.id, userId)
        return { ...entry, tags }
      })
    )

    return entriesWithTags
  }

  async getTimeEntriesByDateRange(range: TimeRange, userId: string): Promise<TimeEntry[]> {
    const rows = await tursoClient.query<TimeEntryRow>(
      `SELECT * FROM time_entries 
       WHERE user_id = ? AND start_time >= ? AND end_time <= ?
       ORDER BY start_time DESC`,
      [userId, range.start.toISOString(), range.end.toISOString()]
    )

    const entries = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const entriesWithTags = await Promise.all(
      entries.map(async entry => {
        const tags = await this.getTagsForTimeEntry(entry.id, userId)
        return { ...entry, tags }
      })
    )

    return entriesWithTags
  }

  async getTimeEntriesByTag(tag: string, userId: string): Promise<TimeEntry[]> {
    const rows = await tursoClient.query<TimeEntryRow>(
      `SELECT te.* FROM time_entries te
       JOIN time_entry_tags tet ON te.id = tet.time_entry_id
       WHERE tet.tag_name = ? AND te.user_id = ?
       ORDER BY te.start_time DESC`,
      [tag, userId]
    )

    const entries = rows.map(row => this.rowToEntity(row))
    
    // Populate tags
    const entriesWithTags = await Promise.all(
      entries.map(async entry => {
        const tags = await this.getTagsForTimeEntry(entry.id, userId)
        return { ...entry, tags }
      })
    )

    return entriesWithTags
  }

  async getTotalHoursByProject(projectId: string, userId: string): Promise<number> {
    const result = await tursoClient.query<{ total: number }>(
      'SELECT SUM(duration) as total FROM time_entries WHERE project_id = ? AND user_id = ?',
      [projectId, userId]
    )

    return (result[0]?.total || 0) / 60 // Convert to hours
  }

  async getTotalHoursByDateRange(range: TimeRange, userId: string): Promise<number> {
    const result = await tursoClient.query<{ total: number }>(
      `SELECT SUM(duration) as total FROM time_entries 
       WHERE user_id = ? AND start_time >= ? AND end_time <= ?`,
      [userId, range.start.toISOString(), range.end.toISOString()]
    )

    return (result[0]?.total || 0) / 60 // Convert to hours
  }

  private async getTimeEntryWithTags(id: string, userId: string): Promise<TimeEntry | null> {
    const entry = await this.getById(id, userId)
    if (!entry) {
      return null
    }

    const tags = await this.getTagsForTimeEntry(id, userId)
    return { ...entry, tags }
  }

  private async getTagsForTimeEntry(timeEntryId: string, userId: string): Promise<string[]> {
    const rows = await tursoClient.query<{ tag_name: string }>(
      'SELECT tag_name FROM time_entry_tags WHERE time_entry_id = ? AND user_id = ?',
      [timeEntryId, userId]
    )

    return rows.map(row => row.tag_name)
  }
}

export const timesheetRepository = new TursoTimesheetRepository()
