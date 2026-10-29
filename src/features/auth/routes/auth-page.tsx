import { useState } from 'react'
import { Navigate } from 'react-router'
import { LoginForm } from '../components/login-form'
import { SignupForm } from '../components/signup-form'
import { useAuthContext } from '../hooks/use-auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { IconClock } from '@tabler/icons-react'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-xs text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <IconClock className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight leading-none">TimeNotes</h1>
            <p className="text-xs text-muted-foreground mt-1">Track time & organize knowledge</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            {showSuccessMessage && (
              <div className="mb-4 p-3 text-xs font-medium text-tertiary-foreground bg-tertiary border border-border rounded-md">
                Account created successfully! Please sign in with your credentials.
              </div>
            )}

            {mode === 'login' ? (
              <LoginForm
                onSuccess={() => {}}
                onSwitchToSignup={() => {
                  setShowSuccessMessage(false)
                  setMode('signup')
                }}
              />
            ) : (
              <SignupForm
                onSuccess={() => {
                  setShowSuccessMessage(true)
                  setMode('login')
                }}
                onSwitchToLogin={() => {
                  setShowSuccessMessage(false)
                  setMode('login')
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
