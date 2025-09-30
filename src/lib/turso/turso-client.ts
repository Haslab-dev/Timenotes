/**
 * Turso HTTP API Client
 * 
 * This client provides a simplified interface to interact with Turso databases
 * using their HTTP API according to the official specification.
 * Based on: https://docs.turso.tech/sdk/http/quickstart
 */

export interface TursoClientConfig {
  databaseUrl: string
  authToken: string
}

export interface TursoQueryResponse {
  cols: Array<{ name: string; decltype: string }>
  rows: any[][]
  affected_row_count?: number
  last_insert_rowid?: string | null
  query_duration_ms: number
}

export interface TursoPipelineResult {
  type: 'ok' | 'error'
  response: {
    type: 'execute' | 'close'
    result?: TursoQueryResponse
    error?: any
  }
}

export interface TursoPipelineResponse {
  baton: string | null
  base_url: string | null
  results: TursoPipelineResult[]
}

export interface TursoMutationResponse {
  changes: number
  last_insert_rowid?: string
  duration: number
}

export interface TursoBatchResponse {
  results: TursoQueryResponse[]
}

export class TursoClient {
  private baseUrl: string
  private authToken: string

  constructor(config: TursoClientConfig) {
    // Convert libsql:// URL to HTTPS URL for HTTP API
    this.baseUrl = config.databaseUrl.replace('libsql://', 'https://')
    this.authToken = config.authToken
  }

  /**
   * Execute a SELECT query and return typed results
   */
  async query<T = any>(sql: string, params: (string | number | boolean | null)[] = []): Promise<T[]> {
    const response = await this.request<TursoPipelineResponse>('POST', '/v2/pipeline', {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: params.map(param => this.formatParam(param))
          }
        },
        { type: 'close' }
      ]
    })

    const firstResult = response.results[0]
    if (!firstResult || firstResult.type !== 'ok' || !firstResult.response.result) {
      return []
    }

    const result = firstResult.response.result
    if (!result.rows || !result.cols) {
      return []
    }

    // Transform rows from array format to object format
    const rows = result.rows.map(row => {
      const obj: any = {}
      result.cols.forEach((column, index) => {
        const cellValue = row[index]
        // Handle nested value objects from Turso API
        if (cellValue && typeof cellValue === 'object' && 'value' in cellValue) {
          obj[column.name] = cellValue.value
        } else {
          obj[column.name] = cellValue
        }
      })
      return obj as T
    })

    return rows
  }

  /**
   * Execute an INSERT, UPDATE, or DELETE query
   */
  async run(sql: string, params: (string | number | boolean | null)[] = []): Promise<TursoMutationResponse> {
    const response = await this.request<TursoPipelineResponse>('POST', '/v2/pipeline', {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: params.map(param => this.formatParam(param))
          }
        },
        { type: 'close' }
      ]
    })

    const firstResult = response.results[0]
    const result = firstResult?.response?.result
    
    return {
      changes: result?.affected_row_count || 0,
      last_insert_rowid: result?.last_insert_rowid || undefined,
      duration: result?.query_duration_ms || 0
    }
  }

  /**
   * Execute multiple queries in a transaction
   */
  async batch(statements: Array<{ q: string; params?: (string | number | boolean | null)[] }>): Promise<{
    results: TursoMutationResponse[]
  }> {
    const requests = []
    
    // Add each statement as an execute request
    for (const stmt of statements) {
      requests.push({
        type: 'execute',
        stmt: {
          sql: stmt.q,
          args: stmt.params?.map(param => this.formatParam(param)) ?? []
        }
      })
    }
    
    // Close the connection
    requests.push({ type: 'close' })

    const response = await this.request<TursoPipelineResponse>('POST', '/v2/pipeline', {
      requests
    })

    return {
      results: response.results.slice(0, -1).map(pipelineResult => {
        const result = pipelineResult?.response?.result
        return {
          changes: result?.affected_row_count || 0,
          last_insert_rowid: result?.last_insert_rowid || undefined,
          duration: result?.query_duration_ms || 0
        }
      })
    }
  }

  /**
   * Format parameter according to Turso HTTP API specification
   */
  private formatParam(param: string | number | boolean | null) {
    if (param === null) {
      return { type: 'null' }
    }
    
    if (typeof param === 'string') {
      return { type: 'text', value: param }
    }
    
    if (typeof param === 'number') {
      if (Number.isInteger(param)) {
        return { type: 'integer', value: param.toString() }
      } else {
        return { type: 'float', value: param.toString() }
      }
    }
    
    if (typeof param === 'boolean') {
      return { type: 'integer', value: param ? '1' : '0' }
    }
    
    return { type: 'text', value: String(param) }
  }

  private async request<T>(method: string, endpoint: string, body?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Turso API error (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(`Turso database error: ${data.error}`)
    }

    return data
  }
}

// Validate configuration
const databaseUrl = import.meta.env.VITE_TURSO_DATABASE_URL
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN

if (!databaseUrl || !authToken) {
  throw new Error(
    'Turso configuration missing! Please set VITE_TURSO_DATABASE_URL and VITE_TURSO_AUTH_TOKEN in your environment variables. ' +
    'Copy .env.example to .env.local and configure your Turso database credentials.'
  )
}

// Create and export configured client instance
export const tursoClient = new TursoClient({
  databaseUrl,
  authToken,
})

// Type-safe database row interfaces based on our schema
export interface UserRow {
  id: string
  email: string
  name: string
  password_hash: string
  created_at: string
  updated_at: string
}

export interface ProjectRow {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  created_at: string
  updated_at: string
}

export interface TimeEntryRow {
  id: string
  user_id: string
  project_id: string
  description: string | null
  start_time: string
  end_time: string
  duration: number
  created_at: string
  updated_at: string
}

export interface NoteRow {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string
  created_at: string
  updated_at: string
}

export interface TagRow {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface TimeEntryTagRow {
  time_entry_id: string
  tag_name: string
  user_id: string
}

export interface NoteTagRow {
  note_id: string
  tag_name: string
  user_id: string
}
