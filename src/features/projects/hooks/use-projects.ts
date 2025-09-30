import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectRepository } from '../api/project-repository'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import type { CreateProjectRequest, UpdateProjectRequest } from '@/lib/types'

export function useProjects() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['projects', user?.id],
    queryFn: () => projectRepository.getProjects(user!.id),
    enabled: !!user,
  })
}

export function useProject(id: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['projects', id, user?.id],
    queryFn: () => projectRepository.getProject(id, user!.id),
    enabled: !!id && !!user,
  })
}

export function useCreateProject() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectRepository.createProject(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateProject() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectRepository.updateProject(id, user!.id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteProject() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectRepository.deleteProject(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
