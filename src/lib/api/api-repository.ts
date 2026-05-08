type RequestConfig = {
  signal?: AbortSignal
  headers?: HeadersInit
}

export class ApiRepository {
  private readonly baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  protected async get<T>(path: string, config: RequestConfig = {}): Promise<T> {
    const response = await fetch(this.composeUrl(path), {
      method: 'GET',
      headers: config.headers,
      signal: config.signal,
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  protected async post<TPayload, TResponse>(
    path: string,
    payload: TPayload,
    config: RequestConfig = {}
  ): Promise<TResponse> {
    const response = await fetch(this.composeUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
      signal: config.signal,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as TResponse
    }

    return response.json() as Promise<TResponse>
  }

  protected async simulateDelay(ms = 300) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private composeUrl(path: string) {
    if (!this.baseUrl) return path
    return `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }
}
