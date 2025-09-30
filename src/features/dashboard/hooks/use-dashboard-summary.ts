import { useQuery } from '@tanstack/react-query'

import { dashboardRepository } from '../api/dashboard-repository'
import { useAuthContext } from '@/features/auth/hooks/use-auth-context'

export function useDashboardSummary() {
  const { user } = useAuthContext()
  return useQuery({
    queryKey: ['dashboard', 'summary', user?.id],
    queryFn: () => dashboardRepository.getStats(user!.id),
    enabled: !!user,
  })
}
