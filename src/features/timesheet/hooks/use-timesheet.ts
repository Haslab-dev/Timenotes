import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { timesheetRepository } from '../api/timesheet-repository'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import type { CreateTimeEntryRequest, UpdateTimeEntryRequest, TimeRange } from '@/lib/types'

export function useTimeEntries() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['timeEntries', user?.id],
    queryFn: () => timesheetRepository.getTimeEntries(user!.id),
    enabled: !!user,
  })
}

export function useTimeEntry(id: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['timeEntries', id, user?.id],
    queryFn: () => timesheetRepository.getTimeEntry(id, user!.id),
    enabled: !!id && !!user,
  })
}

export function useTimeEntriesByProject(projectId: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['timeEntries', 'project', projectId, user?.id],
    queryFn: () => timesheetRepository.getTimeEntriesByProject(projectId, user!.id),
    enabled: !!projectId && !!user,
  })
}

export function useTimeEntriesByDateRange(range: TimeRange) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['timeEntries', 'dateRange', range.start.toISOString(), range.end.toISOString(), user?.id],
    queryFn: () => timesheetRepository.getTimeEntriesByDateRange(range, user!.id),
    enabled: !!user,
  })
}

export function useCreateTimeEntry() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTimeEntryRequest) => timesheetRepository.createTimeEntry(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateTimeEntry() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTimeEntryRequest }) =>
      timesheetRepository.updateTimeEntry(id, user!.id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteTimeEntry() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => timesheetRepository.deleteTimeEntry(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
