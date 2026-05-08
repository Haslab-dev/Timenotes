import { format } from 'date-fns'
import type { TimeEntry, Note, Project } from '@/lib/types'

/**
 * Convert array of objects to CSV format
 */
function arrayToCsv(data: Record<string, any>[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const csvHeaders = headers.join(',')

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"') || value.includes('\n'))
        ) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      .join(',')
  )

  return [csvHeaders, ...csvRows].join('\n')
}

/**
 * Download CSV file
 */
function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Export time entries to CSV
 */
export function exportTimeEntriesToCsv(
  timeEntries: TimeEntry[],
  projects: Project[] = [],
  filename?: string
): void {
  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'No Project'
    return projects.find((p) => p.id === projectId)?.name || 'Unknown Project'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const csvData = timeEntries.map((entry) => ({
    Date: format(entry.startTime, 'yyyy-MM-dd'),
    'Start Time': format(entry.startTime, 'HH:mm'),
    'End Time': format(entry.endTime, 'HH:mm'),
    Duration: formatDuration(entry.duration),
    'Duration (minutes)': entry.duration,
    Project: getProjectName(entry.projectId),
    Description: entry.description || '',
    Tags: entry.tags.join('; '),
    'Created At': format(entry.createdAt, 'yyyy-MM-dd HH:mm:ss'),
  }))

  const csvContent = arrayToCsv(csvData)
  const defaultFilename = `timesheet-export-${format(new Date(), 'yyyy-MM-dd')}.csv`

  downloadCsv(csvContent, filename || defaultFilename)
}

/**
 * Export notes to CSV
 */
export function exportNotesToCsv(notes: Note[], projects: Project[] = [], filename?: string): void {
  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'No Project'
    return projects.find((p) => p.id === projectId)?.name || 'Unknown Project'
  }

  const csvData = notes.map((note) => ({
    Title: note.title,
    Content: note.content,
    Project: getProjectName(note.projectId),
    Tags: note.tags.join('; '),
    'Created At': format(note.createdAt, 'yyyy-MM-dd HH:mm:ss'),
    'Updated At': format(note.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
  }))

  const csvContent = arrayToCsv(csvData)
  const defaultFilename = `notes-export-${format(new Date(), 'yyyy-MM-dd')}.csv`

  downloadCsv(csvContent, filename || defaultFilename)
}

/**
 * Export projects to CSV
 */
export function exportProjectsToCsv(
  projects: Project[],
  timeEntries: TimeEntry[] = [],
  notes: Note[] = [],
  filename?: string
): void {
  const getProjectStats = (projectId: string) => {
    const projectTimeEntries = timeEntries.filter((entry) => entry.projectId === projectId)
    const projectNotes = notes.filter((note) => note.projectId === projectId)
    const totalMinutes = projectTimeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const totalHours = totalMinutes / 60

    return {
      totalHours: totalHours.toFixed(2),
      totalEntries: projectTimeEntries.length,
      totalNotes: projectNotes.length,
    }
  }

  const csvData = projects.map((project) => {
    const stats = getProjectStats(project.id)
    return {
      Name: project.name,
      Description: project.description || '',
      Color: project.color,
      'Total Hours': stats.totalHours,
      'Time Entries': stats.totalEntries,
      'Notes Count': stats.totalNotes,
      'Created At': format(project.createdAt, 'yyyy-MM-dd HH:mm:ss'),
      'Updated At': format(project.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
    }
  })

  const csvContent = arrayToCsv(csvData)
  const defaultFilename = `projects-export-${format(new Date(), 'yyyy-MM-dd')}.csv`

  downloadCsv(csvContent, filename || defaultFilename)
}
