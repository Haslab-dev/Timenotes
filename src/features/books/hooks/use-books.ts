import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { booksRepository } from '../api/books-repository'
import { useAuth } from '@/features/auth/hooks/use-auth'
import type {
  CreateBookRequest,
  UpdateBookRequest,
  CreatePageRequest,
  UpdatePageRequest,
} from '../types'

export function useBooks() {
  const { data: user } = useAuth()

  return useQuery({
    queryKey: ['books', user?.id],
    queryFn: () => booksRepository.getBooks(user!.id),
    enabled: !!user?.id,
  })
}

export function useBook(id: string) {
  const { data: user } = useAuth()

  return useQuery({
    queryKey: ['books', id, user?.id],
    queryFn: () => booksRepository.getById(id, user!.id),
    enabled: !!user?.id && !!id,
  })
}

export function usePublicBook(id: string) {
  return useQuery({
    queryKey: ['public-books', id],
    queryFn: () => booksRepository.getPublicBook(id),
    enabled: !!id,
  })
}

export function useBookPages(bookId: string) {
  return useQuery({
    queryKey: ['book-pages', bookId],
    queryFn: () => booksRepository.getPages(bookId),
    enabled: !!bookId,
  })
}

export function useCreateBook() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateBookRequest) => booksRepository.createBook(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}

export function useUpdateBook() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookRequest }) =>
      booksRepository.updateBook(id, user!.id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
      queryClient.invalidateQueries({ queryKey: ['books', variables.id] })
    },
  })
}

export function useCreatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePageRequest) => booksRepository.createPage(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['book-pages', variables.bookId] })
    },
  })
}

export function useUpdatePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePageRequest }) =>
      booksRepository.updatePage(id, data),
    onSuccess: (page) => {
      if (page) {
        queryClient.invalidateQueries({ queryKey: ['book-pages', page.bookId] })
      }
    },
  })
}

export function useDeleteBook() {
  const { data: user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => booksRepository.deleteBook(id, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] })
    },
  })
}
