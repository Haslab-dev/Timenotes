import { Suspense } from 'react'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'

import { MainLayout } from '@/app/layouts/main-layout'
import { NotFoundPage } from '@/components/not-found-page'
import { TimeNoteDashboardPage } from '@/features/dashboard/routes/timenote-dashboard-page'
import { ProjectsPage } from '@/features/projects/routes/projects-page'
import { TimesheetPage } from '@/features/timesheet/routes/timesheet-page'
import { NotesPage } from '@/features/notes/routes/notes-page'
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
      { path: 'timesheet', element: <TimesheetPage /> },
      { path: 'notes', element: <NotesPage /> },
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
