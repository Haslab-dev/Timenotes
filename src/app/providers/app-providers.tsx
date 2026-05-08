import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@/features/auth/components/auth-provider'
import { TimerProvider } from '@/features/timesheet/hooks/use-active-timer'

import { queryClient } from './query-client'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TimerProvider>
          {children}
          <ReactQueryDevtools buttonPosition="bottom-right" initialIsOpen={false} />
        </TimerProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
