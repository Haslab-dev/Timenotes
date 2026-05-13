import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notesRepository } from '../api/notes-repository'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'
import { indexNote, removeNote } from '@/lib/qdrant/search-sync'
import type { CreateNoteRequest, UpdateNoteRequest, Note } from '@/lib/types'

export function useNotes() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['notes', user?.id],
    queryFn: () => notesRepository.getNotes(user!.id),
    enabled: !!user,
  })
}

export function useNote(id: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['notes', id, user?.id],
    queryFn: () => notesRepository.getNote(id, user!.id),
    enabled: !!id && !!user,
  })
}

export function usePublicNote(id: string) {
  return useQuery({
    queryKey: ['public-note', id],
    queryFn: () => notesRepository.getPublicNote(id),
    enabled: !!id,
  })
}

export function useNotesByProject(projectId: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['notes', 'project', projectId, user?.id],
    queryFn: () => notesRepository.getNotesByProject(projectId, user!.id),
    enabled: !!projectId && !!user,
  })
}

export function useNotesByTimeEntry(timeEntryId: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['notes', 'timeEntry', timeEntryId, user?.id],
    queryFn: () => notesRepository.getNotesByTimeEntry(timeEntryId, user!.id),
    enabled: !!timeEntryId && !!user,
  })
}

export function useSearchNotes(query: string) {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['notes', 'search', query, user?.id],
    queryFn: () => notesRepository.searchNotes(query, user!.id),
    enabled: !!query.trim() && !!user,
  })
}

export function useCreateNote() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateNoteRequest) => notesRepository.createNote(data, user!.id),
    onSuccess: (note) => {
      // Index in Qdrant for hybrid search
      indexNote({
        id: note.id,
        userId: user!.id,
        title: note.title,
        content: note.content,
      }).catch((err) => console.warn('Failed to index note for search:', err))

      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateNote() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNoteRequest }) =>
      notesRepository.updateNote(id, user!.id, data),
    onSuccess: (note) => {
      // Re-index updated note in Qdrant
      if (note) {
        indexNote({
          id: note.id,
          userId: user!.id,
          title: note.title,
          content: note.content,
        }).catch((err) => console.warn('Failed to re-index note for search:', err))
      }

      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteNote() {
  const { user } = useAuthContext()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => notesRepository.deleteNote(id, user!.id),
    onSuccess: (_success, deletedId) => {
      // Remove from Qdrant index
      removeNote(deletedId).catch((err) =>
        console.warn('Failed to remove note from search index:', err)
      )

      queryClient.invalidateQueries({ queryKey: ['notes'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
