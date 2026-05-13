import { tursoClient } from '@/lib/turso/turso-client'
import type { TaskRow } from '@/lib/turso/turso-client'
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

class TursoTaskRepository {
  async getAllTasks(userId: string): Promise<Task[]> {
    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks WHERE user_id = ? ORDER BY 
        CASE WHEN status = 'completed' THEN 1 ELSE 0 END,
        CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
        due_date ASC NULLS LAST,
        created_at DESC`,
      [userId]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async getTask(id: string, userId: string): Promise<Task | null> {
    const rows = await tursoClient.query<TaskRow>(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, userId]
    )
    return rows.length > 0 ? this.rowToEntity(rows[0]) : null
  }

  async getTasksByDateRange(startDate: string, endDate: string, userId: string): Promise<Task[]> {
    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND due_date >= ? AND due_date <= ?
       ORDER BY due_time ASC NULLS LAST,
        CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
      [userId, startDate, endDate]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async getTasksByDate(date: string, userId: string): Promise<Task[]> {
    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND due_date = ?
       ORDER BY due_time ASC NULLS LAST,
        CASE priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`,
      [userId, date]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async getUpcomingTasks(userId: string, limit = 10): Promise<Task[]> {
    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND status != 'completed' AND status != 'cancelled'
       ORDER BY due_date ASC, due_time ASC NULLS LAST
       LIMIT ?`,
      [userId, limit]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async getOverdueTasks(userId: string): Promise<Task[]> {
    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND status NOT IN ('completed', 'cancelled') AND due_date < date('now')
       ORDER BY due_date ASC`,
      [userId]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async createTask(data: CreateTaskRequest, userId: string): Promise<Task> {
    const id = uuidv4()
    const now = new Date().toISOString()
    const dueDate = data.dueDate ? data.dueDate.toISOString().split('T')[0] : null

    await tursoClient.run(
      `INSERT INTO tasks (id, user_id, title, description, due_date, due_time, priority, project_id, reminder_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.title,
        data.description || null,
        dueDate,
        data.dueTime || null,
        data.priority,
        data.projectId || null,
        data.reminderMinutes || null,
        now,
        now,
      ]
    )

    const created = await this.getTask(id, userId)
    if (!created) throw new Error('Failed to create task')
    return created
  }

  async updateTask(id: string, userId: string, data: UpdateTaskRequest): Promise<Task | null> {
    const existing = await this.getTask(id, userId)
    if (!existing) return null

    const sets: string[] = []
    const values: (string | number | boolean | null)[] = []

    if (data.title !== undefined) {
      sets.push('title = ?')
      values.push(data.title)
    }
    if (data.description !== undefined) {
      sets.push('description = ?')
      values.push(data.description || null)
    }
    if (data.dueDate !== undefined) {
      sets.push('due_date = ?')
      values.push(data.dueDate.toISOString().split('T')[0])
    }
    if (data.dueTime !== undefined) {
      sets.push('due_time = ?')
      values.push(data.dueTime || null)
    }
    if (data.priority !== undefined) {
      sets.push('priority = ?')
      values.push(data.priority)
    }
    if (data.status !== undefined) {
      sets.push('status = ?')
      values.push(data.status)
      if (data.status === 'completed') {
        sets.push('completed_at = ?')
        values.push(new Date().toISOString())
      } else if (data.status === 'pending' || data.status === 'in_progress') {
        sets.push('completed_at = ?')
        values.push(null)
      }
    }
    if (data.projectId !== undefined) {
      sets.push('project_id = ?')
      values.push(data.projectId || null)
    }
    if (data.reminderMinutes !== undefined) {
      sets.push('reminder_minutes = ?')
      values.push(data.reminderMinutes || null)
    }

    if (sets.length === 0) return existing

    sets.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id, userId)

    await tursoClient.run(
      `UPDATE tasks SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    )

    return await this.getTask(id, userId)
  }

  async markNotified(id: string, userId: string): Promise<void> {
    await tursoClient.run(
      'UPDATE tasks SET notified = 1, updated_at = ? WHERE id = ? AND user_id = ?',
      [new Date().toISOString(), id, userId]
    )
  }

  async deleteTask(id: string, userId: string): Promise<boolean> {
    const result = await tursoClient.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [
      id,
      userId,
    ])
    return result.changes > 0
  }

  async getTasksByProject(projectId: string, userId: string): Promise<Task[]> {
    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks WHERE user_id = ? AND project_id = ? ORDER BY due_date ASC`,
      [userId, projectId]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async getUnnotifiedDueTasks(userId: string): Promise<Task[]> {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND status NOT IN ('completed', 'cancelled') AND notified = 0
       AND due_date IS NOT NULL
       AND (due_date < ? OR (due_date = ? AND due_time IS NOT NULL AND due_time <= ?))
       ORDER BY due_date ASC`,
      [userId, today, today, currentTime]
    )
    return rows.map((row) => this.rowToEntity(row))
  }

  async getTasksNeedingReminders(userId: string): Promise<Task[]> {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const rows = await tursoClient.query<TaskRow>(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND status NOT IN ('completed', 'cancelled') AND notified = 0
       AND due_date = ? AND due_time IS NOT NULL AND reminder_minutes IS NOT NULL`,
      [userId, today]
    )

    return rows
      .map((row) => this.rowToEntity(row))
      .filter((task) => {
        if (!task.dueTime || !task.reminderMinutes) return false
        const [h, m] = task.dueTime.split(':').map(Number)
        const dueMinutes = h * 60 + m
        const reminderTime = dueMinutes - task.reminderMinutes
        return currentMinutes >= reminderTime
      })
  }

  private rowToEntity(row: TaskRow): Task {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description || undefined,
      dueDate: row.due_date ? new Date(row.due_date + 'T00:00:00Z') : undefined,
      dueTime: row.due_time || undefined,
      priority: row.priority as Task['priority'],
      status: row.status as Task['status'],
      projectId: row.project_id || undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      reminderMinutes: row.reminder_minutes ?? undefined,
      notified: row.notified === 1,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }
}

export const taskRepository = new TursoTaskRepository()
