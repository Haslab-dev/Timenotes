import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskRepository } from '../api/task-repository'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import type { CreateTaskRequest, UpdateTaskRequest } from '@/lib/types'

export function useTasks() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => taskRepository.getAllTasks(user!.id),
    enabled: !!user,
  })
}

export function useTask(id: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', id, user?.id],
    queryFn: () => taskRepository.getTask(id, user!.id),
    enabled: !!id && !!user,
  })
}

export function useTasksByDateRange(startDate: string, endDate: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'dateRange', startDate, endDate, user?.id],
    queryFn: () => taskRepository.getTasksByDateRange(startDate, endDate, user!.id),
    enabled: !!user && !!startDate && !!endDate,
  })
}

export function useTasksByDate(date: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'date', date, user?.id],
    queryFn: () => taskRepository.getTasksByDate(date, user!.id),
    enabled: !!user && !!date,
  })
}

export function useUpcomingTasks(limit = 10) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'upcoming', limit, user?.id],
    queryFn: () => taskRepository.getUpcomingTasks(user!.id, limit),
    enabled: !!user,
  })
}

export function useOverdueTasks() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'overdue', user?.id],
    queryFn: () => taskRepository.getOverdueTasks(user!.id),
    enabled: !!user,
  })
}

export function useTasksByProject(projectId: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'project', projectId, user?.id],
    queryFn: () => taskRepository.getTasksByProject(projectId, user!.id),
    enabled: !!projectId && !!user,
  })
}

export function useCreateTask() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTaskRequest) => taskRepository.createTask(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskRequest }) =>
      taskRepository.updateTask(id, user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useDeleteTask() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taskRepository.deleteTask(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useMarkTaskNotified() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taskRepository.markNotified(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUnnotifiedDueTasks() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'unnotified', user?.id],
    queryFn: () => taskRepository.getUnnotifiedDueTasks(user!.id),
    enabled: !!user,
    refetchInterval: 30000,
  })
}

export function useTasksNeedingReminders() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['tasks', 'reminders', user?.id],
    queryFn: () => taskRepository.getTasksNeedingReminders(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  })
}
