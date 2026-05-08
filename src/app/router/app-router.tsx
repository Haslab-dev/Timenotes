import { Suspense } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { MainLayout } from '@/app/layouts/main-layout'
import { NotFoundPage } from '@/components/not-found-page'
import { TimeNoteDashboardPage } from '@/features/dashboard/routes/timenote-dashboard-page'
import { ProjectsPage } from '@/features/projects/routes/projects-page'
import { ProjectDetailPage } from '@/features/projects/routes/project-detail-page'
import { NotesPage } from '@/features/notes/routes/notes-page'
import { EditNotePage } from '@/features/notes/routes/edit-note-page'
import { NewNotePage } from '@/features/notes/routes/new-note-page'
import { TimesheetPage } from '@/features/timesheet/routes/timesheet-page'
import { EditTimeEntryPage } from '@/features/timesheet/routes/edit-time-entry-page'
import { NewTimeEntryPage } from '@/features/timesheet/routes/new-time-entry-page'
import { AuthPage } from '@/features/auth/routes/auth-page'
import { ProtectedRoute } from '@/features/auth/components/protected-route'

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <TimeNoteDashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'timesheet', element: <TimesheetPage /> },
      { path: 'timesheet/:id', element: <TimesheetPage /> },
      { path: 'timesheet/new', element: <NewTimeEntryPage /> },
      { path: 'timesheet/:id/edit', element: <EditTimeEntryPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'notes/:id', element: <NotesPage /> },
      { path: 'notes/new', element: <NewNotePage /> },
      { path: 'notes/:id/edit', element: <EditNotePage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading view…</div>}>
      <RouterProvider router={router} />
    </Suspense>
  )
}
