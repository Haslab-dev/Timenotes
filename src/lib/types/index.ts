// Core entity types for TimeNotes application

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
  timeEntryId?: string
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
  id?: string
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
  timeEntryId?: string
  tags: string[]
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  projectId?: string
  timeEntryId?: string
  tags?: string[]
}

export interface CreateTagRequest {
  name: string
  color: string
}

// Analytics and Dashboard types
export interface DashboardStats {
  totalHoursToday: number
  totalHoursThisWeek: number
  totalHoursThisMonth: number
  activeProjectsToday: number
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

// Task types for planner and scheduler
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  dueDate?: Date
  dueTime?: string
  priority: TaskPriority
  status: TaskStatus
  projectId?: string
  completedAt?: Date
  reminderMinutes?: number
  notified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateTaskRequest {
  title: string
  description?: string
  dueDate?: Date
  dueTime?: string
  priority: TaskPriority
  projectId?: string
  reminderMinutes?: number
}

export interface UpdateTaskRequest {
  title?: string
  description?: string
  dueDate?: Date
  dueTime?: string
  priority?: TaskPriority
  status?: TaskStatus
  projectId?: string
  reminderMinutes?: number
}

export const PRIORITY_COLORS = {
  low: '#64748b', // Secondary slate
  medium: '#334e8c', // Primary navy-indigo
  high: '#b45309', // Tertiary amber-bronze
  urgent: '#dc2626', // Destructive crimson
} as const

export const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
} as const

export const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
} as const

// Harmonized Primary, Secondary, Tertiary palette for projects and tags
export const PROJECT_COLORS = [
  '#1e3a8a', // Primary deep indigo
  '#334155', // Secondary slate
  '#b45309', // Tertiary warm bronze
  '#2563eb', // Primary royal
  '#475569', // Secondary cool gray
  '#d97706', // Tertiary amber
  '#0f172a', // Deep ink
  '#64748b', // Muted slate
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]
