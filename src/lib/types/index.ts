// Core entity types for TimeNote application

// Re-export auth types
export * from './auth'

// Core entity types

export interface Project {
  id: string
  userId: string
  name: string
  description?: string
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface TimeEntry {
  id: string
  userId: string
  projectId: string
  description?: string
  startTime: Date
  endTime: Date
  duration: number // in minutes
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id: string
  userId: string
  title: string
  content: string
  projectId?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  createdAt: Date
}

// API types for CRUD operations
export interface CreateProjectRequest {
  name: string
  description?: string
  color: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  color?: string
}

export interface CreateTimeEntryRequest {
  projectId: string
  description?: string
  startTime: Date
  endTime: Date
  tags: string[]
}

export interface UpdateTimeEntryRequest {
  projectId?: string
  description?: string
  startTime?: Date
  endTime?: Date
  tags?: string[]
}

export interface CreateNoteRequest {
  title: string
  content: string
  projectId?: string
  tags: string[]
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  projectId?: string
  tags?: string[]
}

export interface CreateTagRequest {
  name: string
  color: string
}

// Analytics and Dashboard types
export interface DashboardStats {
  totalHoursThisWeek: number
  totalHoursThisMonth: number
  activeProjects: number
  totalNotes: number
  recentTimeEntries: TimeEntry[]
  recentNotes: Note[]
  topProjects: Array<{
    project: Project
    totalHours: number
    percentage: number
  }>
  hoursPerTag: Array<{
    tag: string
    hours: number
  }>
}

export interface TimeRange {
  start: Date
  end: Date
}

export interface ProjectTimeReport {
  project: Project
  totalHours: number
  timeEntries: TimeEntry[]
}

// Color options for projects and tags
export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#6b7280', // gray
  '#14b8a6', // teal
] as const

export type ProjectColor = typeof PROJECT_COLORS[number]
