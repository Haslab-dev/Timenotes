import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authRepository } from '../api/auth-repository'
import type { SignupRequest, LoginRequest } from '@/lib/types'

export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => authRepository.getCurrentUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SignupRequest) => authRepository.signup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginRequest) => authRepository.login(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authRepository.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      queryClient.clear() // Clear all cached data on logout
    },
  })
}
