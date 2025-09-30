import { v4 as uuidv4 } from 'uuid'
import { tursoClient } from '@/lib/turso/turso-client'

/**
 * Base repository class for Turso database operations
 * Provides common CRUD operations with proper typing
 */
export abstract class TursoRepository<
  TEntity extends { id: string; createdAt: Date; updatedAt: Date },
  TRow extends { id: string; created_at: string; updated_at: string }
> {
  protected abstract tableName: string
  
  /**
   * Convert database row to entity object
   */
  protected abstract rowToEntity(row: TRow): TEntity
  
  /**
   * Convert entity object to database row (excluding timestamps)
   */
  protected abstract entityToRow(entity: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>): Omit<TRow, 'id' | 'created_at' | 'updated_at'>

  /**
   * Get all records for a user
   */
  async getAll(userId: string): Promise<TEntity[]> {
    const rows = await tursoClient.query<TRow>(
      `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`,
      [userId]
    )
    return rows.map(row => this.rowToEntity(row))
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string, userId: string): Promise<TEntity | null> {
    const rows = await tursoClient.query<TRow>(
      `SELECT * FROM ${this.tableName} WHERE id = ? AND user_id = ?`,
      [id, userId]
    )
    return rows.length > 0 ? this.rowToEntity(rows[0]) : null
  }

  /**
   * Create a new record
   */
  async create(data: Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<TEntity> {
    const id = uuidv4()
    const now = new Date().toISOString()
    
    const rowData = this.entityToRow(data)
    
    // Build the INSERT query dynamically
    const columns = ['id', 'user_id', 'created_at', 'updated_at', ...Object.keys(rowData)]
    const placeholders = columns.map(() => '?').join(', ')
    const values: (string | number | boolean | null)[] = [
      id, 
      userId, 
      now, 
      now, 
      ...Object.values(rowData).map(v => v as string | number | boolean | null)
    ]
    
    await tursoClient.run(
      `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )
    
    // Return the created entity
    const created = await this.getById(id, userId)
    if (!created) {
      throw new Error('Failed to create record')
    }
    
    return created
  }

  /**
   * Update an existing record
   */
  async update(
    id: string, 
    userId: string, 
    data: Partial<Omit<TEntity, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<TEntity | null> {
    const existing = await this.getById(id, userId)
    if (!existing) {
      return null
    }

    // Merge the existing data with updates
    const merged = { ...existing, ...data }
    const rowData = this.entityToRow(merged as any)
    
    // Build the UPDATE query dynamically
    const updates = Object.keys(rowData).map(key => `${key} = ?`).join(', ')
    const values: (string | number | boolean | null)[] = [
      ...Object.values(rowData).map(v => v as string | number | boolean | null), 
      new Date().toISOString(), 
      id, 
      userId
    ]
    
    await tursoClient.run(
      `UPDATE ${this.tableName} SET ${updates}, updated_at = ? WHERE id = ? AND user_id = ?`,
      values
    )
    
    return await this.getById(id, userId)
  }

  /**
   * Delete a record
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await tursoClient.run(
      `DELETE FROM ${this.tableName} WHERE id = ? AND user_id = ?`,
      [id, userId]
    )
    
    return result.changes > 0
  }

  /**
   * Count records for a user
   */
  async count(userId: string): Promise<number> {
    const result = await tursoClient.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE user_id = ?`,
      [userId]
    )
    
    return result[0]?.count || 0
  }

  /**
   * Check if a record exists
   */
  async exists(id: string, userId: string): Promise<boolean> {
    const result = await tursoClient.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ? AND user_id = ?`,
      [id, userId]
    )
    
    return (result[0]?.count || 0) > 0
  }

  /**
   * Utility method for custom queries
   */
  protected async query<T = any>(sql: string, params?: (string | number | boolean | null)[]): Promise<T[]> {
    return tursoClient.query<T>(sql, params)
  }

  /**
   * Utility method for custom commands
   */
  protected async run(sql: string, params?: (string | number | boolean | null)[]): Promise<{ changes: number; lastInsertRowid?: string | number }> {
    return tursoClient.run(sql, params)
  }
}
