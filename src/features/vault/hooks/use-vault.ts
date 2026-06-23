import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { markdownDocsRepository } from '../api/markdown-docs-repository'
import type { CreateMarkdownDocRequest, UpdateMarkdownDocRequest } from '../types'

export const vaultQueryKey = ['vault'] as const

export function useVaultDocs(search?: string) {
  const { data: user } = useAuth()
  return useQuery({
    queryKey: [...vaultQueryKey, 'list', user?.id, search ?? ''],
    queryFn: () =>
      search && search.trim()
        ? markdownDocsRepository.search(user!.id, search.trim())
        : markdownDocsRepository.getAll(user!.id),
    enabled: !!user?.id,
  })
}

export function useVaultDoc(id: string) {
  const { data: user } = useAuth()
  return useQuery({
    queryKey: [...vaultQueryKey, 'doc', id, user?.id],
    queryFn: () => markdownDocsRepository.getById(id, user!.id),
    enabled: !!user?.id && !!id,
  })
}

export function useVaultDocsByProject(projectId?: string) {
  const { data: docs = [] } = useVaultDocs()
  return useMemo(
    () => (projectId ? docs.filter((d) => d.projectId === projectId) : []),
    [docs, projectId]
  )
}

export function useCreateVaultDoc() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateMarkdownDocRequest) => markdownDocsRepository.create(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...vaultQueryKey, 'list'] })
    },
  })
}

export function useUpdateVaultDoc() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMarkdownDocRequest }) =>
      markdownDocsRepository.update(id, user!.id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...vaultQueryKey, 'list'] })
      queryClient.invalidateQueries({ queryKey: [...vaultQueryKey, 'doc', variables.id] })
    },
  })
}

export function useDeleteVaultDoc() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markdownDocsRepository.delete(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...vaultQueryKey, 'list'] })
    },
  })
}
