import { tursoClient } from '@/lib/turso/turso-client'
import type { DashboardStats } from '@/lib/types'

class DashboardRepository {
  async getStats(userId: string): Promise<DashboardStats> {
    // Get current week and month ranges
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Get data from database using raw queries for better performance
    const [
      weekHoursResult,
      monthHoursResult,
      projectCountResult,
      notesCountResult,
      recentTimeEntriesResult,
      recentNotesResult,
      topProjectsResult,
      tagHoursResult
    ] = await Promise.all([
      // Total hours this week
      tursoClient.query<{ total_hours: number }>(
        `SELECT COALESCE(SUM(duration), 0) / 60.0 as total_hours 
         FROM time_entries 
         WHERE user_id = ? AND start_time >= ? AND end_time <= ?`,
        [userId, startOfWeek.toISOString(), endOfWeek.toISOString()]
      ),
      
      // Total hours this month
      tursoClient.query<{ total_hours: number }>(
        `SELECT COALESCE(SUM(duration), 0) / 60.0 as total_hours 
         FROM time_entries 
         WHERE user_id = ? AND start_time >= ? AND end_time <= ?`,
        [userId, startOfMonth.toISOString(), endOfMonth.toISOString()]
      ),
      
      // Active projects count
      tursoClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM projects WHERE user_id = ?',
        [userId]
      ),
      
      // Total notes count
      tursoClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM notes WHERE user_id = ?',
        [userId]
      ),
      
      // Recent time entries
      tursoClient.query<{
        id: string
        project_id: string
        description: string | null
        start_time: string
        end_time: string
        duration: number
      }>(
        `SELECT id, project_id, description, start_time, end_time, duration
         FROM time_entries 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 5`,
        [userId]
      ),
      
      // Recent notes
      tursoClient.query<{
        id: string
        project_id: string | null
        title: string
        content: string
        updated_at: string
      }>(
        `SELECT id, project_id, title, content, updated_at
         FROM notes 
         WHERE user_id = ? 
         ORDER BY updated_at DESC 
         LIMIT 5`,
        [userId]
      ),
      
      // Top projects this month
      tursoClient.query<{
        project_id: string
        project_name: string
        project_color: string
        total_hours: number
      }>(
        `SELECT 
           te.project_id,
           p.name as project_name,
           p.color as project_color,
           SUM(te.duration) / 60.0 as total_hours
         FROM time_entries te
         JOIN projects p ON te.project_id = p.id
         WHERE te.user_id = ? AND te.start_time >= ? AND te.end_time <= ?
         GROUP BY te.project_id, p.name, p.color
         ORDER BY total_hours DESC
         LIMIT 3`,
        [userId, startOfMonth.toISOString(), endOfMonth.toISOString()]
      ),
      
      // Hours per tag this month
      tursoClient.query<{
        tag_name: string
        total_hours: number
      }>(
        `SELECT 
           tet.tag_name,
           SUM(te.duration) / 60.0 as total_hours
         FROM time_entries te
         JOIN time_entry_tags tet ON te.id = tet.time_entry_id
         WHERE te.user_id = ? AND te.start_time >= ? AND te.end_time <= ?
         GROUP BY tet.tag_name
         ORDER BY total_hours DESC
         LIMIT 5`,
        [userId, startOfMonth.toISOString(), endOfMonth.toISOString()]
      )
    ])

    // Transform data
    const totalHoursThisWeek = weekHoursResult[0]?.total_hours || 0
    const totalHoursThisMonth = monthHoursResult[0]?.total_hours || 0
    const activeProjects = projectCountResult[0]?.count || 0
    const totalNotes = notesCountResult[0]?.count || 0

    // Transform recent time entries
    const recentTimeEntries = recentTimeEntriesResult.map(entry => ({
      id: entry.id,
      userId,
      projectId: entry.project_id,
      description: entry.description || undefined,
      startTime: new Date(entry.start_time),
      endTime: new Date(entry.end_time),
      duration: entry.duration,
      tags: [], // We don't fetch tags for recent entries to keep it fast
      createdAt: new Date(), // Placeholder
      updatedAt: new Date(), // Placeholder
    }))

    // Transform recent notes
    const recentNotes = recentNotesResult.map(note => ({
      id: note.id,
      userId,
      title: note.title,
      content: note.content,
      projectId: note.project_id || undefined,
      tags: [], // We don't fetch tags for recent notes to keep it fast
      createdAt: new Date(), // Placeholder
      updatedAt: new Date(note.updated_at),
    }))

    // Transform top projects
    const topProjects = topProjectsResult.map(project => {
      const percentage = totalHoursThisMonth > 0 ? (project.total_hours / totalHoursThisMonth) * 100 : 0
      return {
        project: {
          id: project.project_id,
          userId,
          name: project.project_name,
          color: project.project_color,
          description: undefined,
          createdAt: new Date(), // Placeholder
          updatedAt: new Date(), // Placeholder
        },
        totalHours: project.total_hours,
        percentage,
      }
    })

    // Transform tag hours
    const hoursPerTag = tagHoursResult.map(tag => ({
      tag: tag.tag_name,
      hours: tag.total_hours,
    }))

    return {
      totalHoursThisWeek,
      totalHoursThisMonth,
      activeProjects,
      totalNotes,
      recentTimeEntries,
      recentNotes,
      topProjects,
      hoursPerTag,
    }
  }
}

export const dashboardRepository = new DashboardRepository()
