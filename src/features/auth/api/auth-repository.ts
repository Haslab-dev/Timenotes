import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { tursoClient } from '@/lib/turso/turso-client'
import type { UserRow } from '@/lib/turso/turso-client'
import type { 
  User, 
  SignupRequest, 
  LoginRequest, 
  AuthResponse, 
  AuthSession 
} from '@/lib/types'

class TursoAuthRepository {
  private readonly SALT_ROUNDS = 10
  private readonly SESSION_KEY = 'timenote_session'

  /**
   * Convert database row to User entity
   */
  private rowToUser(row: UserRow): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(data.email)
    if (existingUser) {
      throw new Error('User with this email already exists')
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS)

    // Create user
    const userId = uuidv4()
    const now = new Date().toISOString()

    await tursoClient.run(
      `INSERT INTO users (id, email, name, password_hash, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, data.email.toLowerCase(), data.name, hashedPassword, now, now]
    )

    // Get the created user
    const user = await this.getUserById(userId)
    if (!user) {
      throw new Error('Failed to create user')
    }

    // Create session
    const session = this.createSession(user)
    this.saveSession(session)

    return {
      user,
      token: session.token,
      expiresAt: session.expiresAt,
    }
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const rows = await tursoClient.query<UserRow>(
      'SELECT * FROM users WHERE email = ?',
      [data.email.toLowerCase()]
    )

    if (rows.length === 0) {
      throw new Error('Invalid email or password')
    }

    const userRow = rows[0]

    // Verify password
    const passwordHash = userRow.password_hash
    if (!passwordHash || typeof passwordHash !== 'string') {
      throw new Error('Invalid user data')
    }
    
    const isValidPassword = await bcrypt.compare(data.password, passwordHash)
    if (!isValidPassword) {
      throw new Error('Invalid email or password')
    }

    const user = this.rowToUser(userRow)
    
    // Create session
    const session = this.createSession(user)
    this.saveSession(session)

    return {
      user,
      token: session.token,
      expiresAt: session.expiresAt,
    }
  }

  async logout(): Promise<void> {
    this.clearSession()
  }

  async getCurrentUser(): Promise<User | null> {
    const session = this.getSession()
    if (!session || this.isSessionExpired(session)) {
      this.clearSession()
      return null
    }

    // Verify user still exists in database
    const user = await this.getUserById(session.user.id)
    if (!user) {
      this.clearSession()
      return null
    }

    return user
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await tursoClient.query<UserRow>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    )

    return rows.length > 0 ? this.rowToUser(rows[0]) : null
  }

  async getUserById(id: string): Promise<User | null> {
    const rows = await tursoClient.query<UserRow>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    )

    return rows.length > 0 ? this.rowToUser(rows[0]) : null
  }

  async updateUser(id: string, data: Partial<Pick<User, 'name' | 'email'>>): Promise<User | null> {
    const updates: string[] = []
    const values: (string | number)[] = []

    if (data.name !== undefined) {
      updates.push('name = ?')
      values.push(data.name)
    }

    if (data.email !== undefined) {
      updates.push('email = ?')
      values.push(data.email.toLowerCase())
    }

    if (updates.length === 0) {
      return await this.getUserById(id)
    }

    updates.push('updated_at = ?')
    values.push(new Date().toISOString())
    values.push(id)

    await tursoClient.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    )

    return await this.getUserById(id)
  }

  async deleteUser(id: string): Promise<boolean> {
    // This will cascade delete all user data due to foreign key constraints
    const result = await tursoClient.run(
      'DELETE FROM users WHERE id = ?',
      [id]
    )

    if (result.changes > 0) {
      this.clearSession()
    }

    return result.changes > 0
  }

  private createSession(user: User): AuthSession {
    const token = this.generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    return {
      user,
      token,
      expiresAt,
    }
  }

  private saveSession(session: AuthSession): void {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({
      ...session,
      expiresAt: session.expiresAt.toISOString(),
    }))
  }

  private getSession(): AuthSession | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (!sessionData) return null

      const parsed = JSON.parse(sessionData)
      return {
        ...parsed,
        expiresAt: new Date(parsed.expiresAt),
      }
    } catch {
      return null
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY)
  }

  private isSessionExpired(session: AuthSession): boolean {
    return new Date() > session.expiresAt
  }

  private generateToken(): string {
    return Math.random().toString(36).substr(2) + Date.now().toString(36)
  }
}

export const authRepository = new TursoAuthRepository()
