import { TursoRepository } from '@/lib/api/turso-repository'
import { tursoClient } from '@/lib/turso/turso-client'
import type { ProjectRow } from '@/lib/turso/turso-client'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/lib/types'

class TursoProjectRepository extends TursoRepository<Project, ProjectRow> {
  protected tableName = 'projects'

  protected rowToEntity(row: ProjectRow): Project {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      description: row.description || undefined,
      color: row.color,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  protected entityToRow(
    entity: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
  ): Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'> {
    return {
      user_id: entity.userId,
      name: entity.name,
      description: entity.description || null,
      color: entity.color,
    }
  }

  async createProject(data: CreateProjectRequest, userId: string): Promise<Project> {
    return await this.create(
      {
        userId,
        ...data,
      } as Project,
      userId
    )
  }

  async updateProject(
    id: string,
    userId: string,
    data: UpdateProjectRequest
  ): Promise<Project | null> {
    return await this.update(id, userId, data)
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    // Use a transaction to delete project and all related data
    const statements = [
      // Delete time entry tags first (due to foreign key constraints)
      {
        q: 'DELETE FROM time_entry_tags WHERE time_entry_id IN (SELECT id FROM time_entries WHERE project_id = ? AND user_id = ?)',
        params: [id, userId],
      },
      // Delete time entries
      {
        q: 'DELETE FROM time_entries WHERE project_id = ? AND user_id = ?',
        params: [id, userId],
      },
      // Delete note tags
      {
        q: 'DELETE FROM note_tags WHERE note_id IN (SELECT id FROM notes WHERE project_id = ? AND user_id = ?)',
        params: [id, userId],
      },
      // Set project_id to NULL for notes (soft delete)
      {
        q: 'UPDATE notes SET project_id = NULL WHERE project_id = ? AND user_id = ?',
        params: [id, userId],
      },
      // Delete the project
      {
        q: 'DELETE FROM projects WHERE id = ? AND user_id = ?',
        params: [id, userId],
      },
    ]

    const response = await tursoClient.batch(statements)
    const lastResult = response.results[response.results.length - 1]

    return (lastResult.changes || 0) > 0
  }

  async getProjects(userId: string): Promise<Project[]> {
    return await this.getAll(userId)
  }

  async getProject(id: string, userId: string): Promise<Project | null> {
    return await this.getById(id, userId)
  }

  async getProjectsByIds(ids: string[], userId: string): Promise<Project[]> {
    if (ids.length === 0) return []

    const placeholders = ids.map(() => '?').join(', ')
    const rows = await tursoClient.query<ProjectRow>(
      `SELECT * FROM projects WHERE id IN (${placeholders}) AND user_id = ?`,
      [...ids, userId]
    )

    return rows.map((row) => this.rowToEntity(row))
  }

  async searchProjects(query: string, userId: string): Promise<Project[]> {
    const searchTerm = `%${query.toLowerCase()}%`
    const rows = await tursoClient.query<ProjectRow>(
      `SELECT * FROM projects 
       WHERE user_id = ? AND (
         LOWER(name) LIKE ? OR 
         LOWER(description) LIKE ?
       )
       ORDER BY created_at DESC`,
      [userId, searchTerm, searchTerm]
    )

    return rows.map((row) => this.rowToEntity(row))
  }

  async getProjectStats(userId: string): Promise<{
    totalProjects: number
    projectsWithTimeEntries: number
    projectsWithNotes: number
  }> {
    const [totalResult, timeEntriesResult, notesResult] = await Promise.all([
      tursoClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM projects WHERE user_id = ?',
        [userId]
      ),
      tursoClient.query<{ count: number }>(
        `SELECT COUNT(DISTINCT project_id) as count 
         FROM time_entries 
         WHERE user_id = ? AND project_id IS NOT NULL`,
        [userId]
      ),
      tursoClient.query<{ count: number }>(
        `SELECT COUNT(DISTINCT project_id) as count 
         FROM notes 
         WHERE user_id = ? AND project_id IS NOT NULL`,
        [userId]
      ),
    ])

    return {
      totalProjects: totalResult[0]?.count || 0,
      projectsWithTimeEntries: timeEntriesResult[0]?.count || 0,
      projectsWithNotes: notesResult[0]?.count || 0,
    }
  }
}

export const projectRepository = new TursoProjectRepository()
