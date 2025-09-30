// Auth types for TimeNote application

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
}

// API types for auth operations
export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  expiresAt: Date
}

export interface AuthError {
  message: string
  code: string
}

// Auth state
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
