import { useQuery } from '@tanstack/react-query'
import { dashboardRepository } from '../api/dashboard-repository'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'

export function useTimeNoteDashboard() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['dashboard', 'timenote', user?.id],
    queryFn: () => dashboardRepository.getStats(user!.id),
    enabled: !!user,
  })
}
