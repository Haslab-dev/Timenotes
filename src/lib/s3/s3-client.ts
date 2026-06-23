/**
 * Minimal S3-compatible (Cloudflare R2) client using AWS Signature V4.
 *
 * Uses the Web Crypto API so it works in the browser without any SDK
 * dependency. Credentials are read from the VITE_S3_* environment variables.
 *
 * NOTE: Browser uploads to R2 require CORS to be configured on the bucket,
 * allowing PUT/DELETE from your origin with the request headers below.
 */

interface S3ClientConfig {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  region: string
  publicUrl?: string
}

const SERVICE = 's3'
const encoder = new TextEncoder()

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(input: string | ArrayBuffer): Promise<string> {
  const data = typeof input === 'string' ? encoder.encode(input) : input
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

async function hmac(message: string, key: ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
}

async function hmacHex(message: string, key: ArrayBuffer): Promise<string> {
  return toHex(await hmac(message, key))
}

async function deriveSigningKey(
  secretAccessKey: string,
  dateStamp: string,
  region: string
): Promise<ArrayBuffer> {
  const kDate = await hmac(dateStamp, encoder.encode('AWS4' + secretAccessKey))
  const kRegion = await hmac(region, kDate)
  const kService = await hmac(SERVICE, kRegion)
  return hmac('aws4_request', kService)
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function buildTimestamps(): { amzDate: string; dateStamp: string } {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  const y = now.getUTCFullYear()
  const mo = pad(now.getUTCMonth() + 1)
  const d = pad(now.getUTCDate())
  const h = pad(now.getUTCHours())
  const mi = pad(now.getUTCMinutes())
  const s = pad(now.getUTCSeconds())
  return { amzDate: `${y}${mo}${d}T${h}${mi}${s}Z`, dateStamp: `${y}${mo}${d}` }
}

export class S3Client {
  private host: string
  private config: S3ClientConfig

  constructor(config: S3ClientConfig) {
    this.config = config
    this.host = new URL(config.endpoint).host
  }

  private async signAndFetch(
    method: string,
    key: string,
    body: ArrayBuffer,
    contentType: string
  ): Promise<Response> {
    const { amzDate, dateStamp } = buildTimestamps()
    const payloadHash = await sha256Hex(body)
    const canonicalUri = encodePath(`/${this.config.bucket}/${key}`)

    const headers: Record<string, string> = {
      host: this.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
      ...(contentType ? { 'content-type': contentType } : {}),
    }

    const sortedKeys = Object.keys(headers).sort()
    const canonicalHeaders = sortedKeys.map((k) => `${k}:${headers[k].trim()}\n`).join('')
    const signedHeaders = sortedKeys.join(';')

    const canonicalRequest = [
      method,
      canonicalUri,
      '', // empty canonical query string
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n')

    const scope = `${dateStamp}/${this.config.region}/${SERVICE}/aws4_request`
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      await sha256Hex(canonicalRequest),
    ].join('\n')

    const signingKey = await deriveSigningKey(
      this.config.secretAccessKey,
      dateStamp,
      this.config.region
    )
    const signature = await hmacHex(stringToSign, signingKey)
    const authorization = `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    return fetch(`${this.config.endpoint}${canonicalUri}`, {
      method,
      headers: { ...headers, authorization },
      body,
    })
  }

  async putObject(key: string, data: Blob, contentType: string): Promise<string> {
    const buffer = await data.arrayBuffer()
    const response = await this.signAndFetch('PUT', key, buffer, contentType)
    if (!response.ok) {
      throw new Error(`S3 upload failed (${response.status}): ${await response.text()}`)
    }
    return this.publicUrlFor(key)
  }

  async deleteObject(key: string): Promise<void> {
    const response = await this.signAndFetch('DELETE', key, new ArrayBuffer(0), '')
    if (!response.ok && response.status !== 404) {
      throw new Error(`S3 delete failed (${response.status}): ${await response.text()}`)
    }
  }

  publicUrlFor(key: string): string {
    const encoded = encodePath(key)
    if (this.config.publicUrl) {
      return `${this.config.publicUrl.replace(/\/$/, '')}/${encoded}`
    }
    return `${this.config.endpoint}/${encodePath(`${this.config.bucket}/${key}`)}`
  }
}

let cachedClient: S3Client | null | undefined

export function getS3Client(): S3Client | null {
  if (cachedClient !== undefined) return cachedClient

  const endpoint = import.meta.env.VITE_S3_ENDPOINT
  const accessKeyId = import.meta.env.VITE_S3_ACCESS_KEY_ID
  const secretAccessKey = import.meta.env.VITE_S3_SECRET_ACCESS_KEY
  const bucket = import.meta.env.VITE_S3_BUCKET
  const publicUrl = import.meta.env.VITE_S3_PUBLIC_URL

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    cachedClient = null
    return null
  }

  cachedClient = new S3Client({
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucket,
    region: 'auto',
    publicUrl,
  })
  return cachedClient
}

export function isS3Configured(): boolean {
  return getS3Client() !== null
}

export function buildMarkdownFileKey(userId: string, docId: string): string {
  return `markdown/${userId}/${docId}.md`
}

export function buildAttachmentKey(userId: string, docId: string, fileName: string): string {
  const sanitized =
    fileName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'attachment'
  return `markdown/${userId}/${docId}/${Date.now()}-${sanitized}`
}

export function buildGenericAttachmentKey(userId: string, fileName: string): string {
  const now = new Date()
  const month = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  const sanitized =
    fileName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9._-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '') || 'image'
  return `attachments/${userId}/${month}/${Date.now()}-${sanitized}`
}
