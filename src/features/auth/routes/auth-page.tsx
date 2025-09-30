import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { LoginForm } from '../components/login-form'
import { SignupForm } from '../components/signup-form'
import { useAuthContext } from '../hooks/use-auth-context'
import { Clock } from 'lucide-react'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const { isAuthenticated, isLoading } = useAuthContext()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">TimeNote</h1>
            <p className="text-sm text-muted-foreground">Track time, manage projects</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="bg-background border rounded-lg p-6">
          {showSuccessMessage && (
            <div className="mb-4 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
              Account created successfully! Please login with your credentials.
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
        </div>
      </div>
    </div>
  )
}
