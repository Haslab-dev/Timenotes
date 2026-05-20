interface Env {
  TURSO_DATABASE_URL: string
  TURSO_AUTH_TOKEN: string
  MAIL_FROM: string
  MAIL_FROM_NAME?: string
  EMAIL_API_URL?: string
  CRON_BATCH_LIMIT?: string
  LOCAL_TIME_OFFSET_MINUTES?: string
  SEND_DELAY_MS?: string
}

interface TursoPipelineResponse {
  results: Array<{
    type: 'ok' | 'error'
    response: {
      result?: {
        cols?: Array<{ name: string }>
        rows?: unknown[][]
        affected_row_count?: number
      }
      error?: unknown
    }
  }>
}

interface EmailCandidate {
  id: string
  user_id: string
  user_email: string
  title: string
  status: string
  project_name: string | null
  description: string | null
  due_date: string
  due_time: string | null
  reminder_minutes: number | null
  mode: 'reminder' | 'due'
}

const DEFAULT_EMAIL_API_URL = 'https://api-gateway.hasdev.workers.dev/api/email/send'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default {
  async scheduled(event: { scheduledTime: number }, env: Env): Promise<void> {
    const utcNow = new Date(event.scheduledTime)
    const offsetMinutes = Number(env.LOCAL_TIME_OFFSET_MINUTES || '420')
    const now = toOffsetDate(utcNow, offsetMinutes)
    const batchLimit = Number(env.CRON_BATCH_LIMIT || '50')
    const sendDelayMs = Number(env.SEND_DELAY_MS || '250')
    const candidates = await getEmailCandidates(env, now, batchLimit)
    let sentCount = 0
    let invalidCount = 0
    let failedCount = 0

    console.log(
      `[scheduler] started at utc=${utcNow.toISOString()} local=${now.toISOString()} offset=${offsetMinutes} candidates=${candidates.length} limit=${batchLimit}`
    )

    for (const candidate of candidates) {
      const normalizedEmail = candidate.user_email.trim().toLowerCase()
      if (!isValidEmail(normalizedEmail)) {
        await markEmailError(env, candidate.id, `Invalid email: ${candidate.user_email}`)
        invalidCount += 1
        continue
      }

      const subject = candidate.title
      const projectLabel = candidate.project_name || 'No Project'
      const bodyLabel = candidate.description || '-'
      const text = [
        `Status Task: ${candidate.status}`,
        `Project Task: ${projectLabel}`,
        `Body Task: ${bodyLabel}`,
      ].join('\n')

      const html = [
        `<p><strong>Status Task:</strong> ${escapeHtml(candidate.status)}</p>`,
        `<p><strong>Project Task:</strong> ${escapeHtml(projectLabel)}</p>`,
        `<p><strong>Body Task:</strong> ${escapeHtml(bodyLabel)}</p>`,
      ].join('')

      try {
        await sendEmail(env, {
          to: normalizedEmail,
          subject,
          text,
          html,
        })
        await markEmailSent(env, candidate.id, candidate.mode)
        sentCount += 1
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown email error'
        console.error(
          `[scheduler] send_failed task=${candidate.id} to=${normalizedEmail} mode=${candidate.mode} error=${message}`
        )
        await markEmailError(env, candidate.id, message)
        failedCount += 1
      }

      if (sendDelayMs > 0) {
        await sleep(sendDelayMs)
      }
    }

    console.log(
      `[scheduler] finished sent=${sentCount} invalid=${invalidCount} failed=${failedCount}`
    )
  },
}

async function getEmailCandidates(env: Env, now: Date, limit: number): Promise<EmailCandidate[]> {
  const today = getLocalDateString(now)
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  const rows = await tursoQuery<EmailCandidate>(
    env,
    `SELECT
      t.id,
      t.user_id,
      u.email AS user_email,
      t.title,
      t.status,
      p.name AS project_name,
      t.description,
      t.due_date,
      t.due_time,
      t.reminder_minutes,
      CASE
        WHEN t.reminder_minutes IS NOT NULL
          AND (t.email_reminder_sent_at IS NULL OR t.email_reminder_sent_at = '')
          AND t.due_time IS NOT NULL
          AND ((CAST(substr(t.due_time, 1, 2) AS INTEGER) * 60 + CAST(substr(t.due_time, 4, 2) AS INTEGER)) - t.reminder_minutes) <= ?
        THEN 'reminder'
        ELSE 'due'
      END AS mode
    FROM tasks t
    INNER JOIN users u ON u.id = t.user_id
    LEFT JOIN projects p ON p.id = t.project_id
    WHERE t.status NOT IN ('completed', 'cancelled')
      AND t.due_date IS NOT NULL
      AND u.email IS NOT NULL
      AND TRIM(u.email) != ''
      AND (
        (
          t.reminder_minutes IS NOT NULL
          AND t.due_date = ?
          AND t.due_time IS NOT NULL
          AND (t.email_reminder_sent_at IS NULL OR t.email_reminder_sent_at = '')
          AND ((CAST(substr(t.due_time, 1, 2) AS INTEGER) * 60 + CAST(substr(t.due_time, 4, 2) AS INTEGER)) - t.reminder_minutes) <= ?
        )
        OR (
          (t.email_due_sent_at IS NULL OR t.email_due_sent_at = '')
          AND (
            t.due_date < ?
            OR (
              t.due_date = ?
              AND (
                t.due_time IS NULL
                OR (CAST(substr(t.due_time, 1, 2) AS INTEGER) * 60 + CAST(substr(t.due_time, 4, 2) AS INTEGER)) <= ?
              )
            )
          )
        )
      )
    ORDER BY t.due_date ASC, t.due_time ASC NULLS LAST
    LIMIT ?`,
    [currentMinutes, today, currentMinutes, today, today, currentMinutes, limit]
  )

  return rows
}

async function sendEmail(
  env: Env,
  payload: { to: string; subject: string; text: string; html: string }
): Promise<void> {
  const fromEmail = normalizeUrl(env.MAIL_FROM || '')
  if (!fromEmail) {
    throw new Error('Missing MAIL_FROM in worker bindings')
  }

  const configuredUrl = normalizeUrl(env.EMAIL_API_URL || '')
  const urlsToTry = configuredUrl && configuredUrl !== DEFAULT_EMAIL_API_URL
    ? [configuredUrl, DEFAULT_EMAIL_API_URL]
    : [DEFAULT_EMAIL_API_URL]

  let lastError = ''

  for (const emailApiUrl of urlsToTry) {
    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromName: env.MAIL_FROM_NAME || 'Timenotes',
        fromEmail,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      }),
    })

    if (response.ok) {
      return
    }

    const body = await response.text()
    lastError = `Email API returned ${response.status} url=${emailApiUrl}: ${body}`

    if (response.status !== 404) {
      throw new Error(lastError)
    }
  }

  throw new Error(lastError || 'Email API request failed without response body')
}

async function markEmailSent(env: Env, taskId: string, mode: 'reminder' | 'due'): Promise<void> {
  if (mode === 'reminder') {
    await tursoRun(
      env,
      `UPDATE tasks
       SET email_reminder_sent_at = CURRENT_TIMESTAMP,
           email_last_error = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [taskId]
    )
    return
  }

  await tursoRun(
    env,
    `UPDATE tasks
     SET email_due_sent_at = CURRENT_TIMESTAMP,
         email_last_error = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [taskId]
  )
}

async function markEmailError(env: Env, taskId: string, errorMessage: string): Promise<void> {
  await tursoRun(
    env,
    `UPDATE tasks
     SET email_last_error = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [errorMessage.slice(0, 500), taskId]
  )
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toOffsetDate(date: Date, offsetMinutes: number): Date {
  return new Date(date.getTime() + offsetMinutes * 60 * 1000)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

async function tursoQuery<T>(
  env: Env,
  sql: string,
  params: Array<string | number | null>
): Promise<T[]> {
  const response = await tursoRequest(env, sql, params)
  const first = response.results[0]
  const cols = first?.response?.result?.cols ?? []
  const rows = first?.response?.result?.rows ?? []

  return rows.map((row) => {
    const record: Record<string, unknown> = {}
    cols.forEach((col, index) => {
      const value = row[index]
      if (value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
        record[col.name] = (value as { value: unknown }).value
      } else if (value && typeof value === 'object' && 'type' in (value as Record<string, unknown>)) {
        const maybeType = (value as { type?: string }).type
        record[col.name] = maybeType === 'null' ? null : value
      } else {
        record[col.name] = value
      }
    })
    return record as T
  })
}

async function tursoRun(env: Env, sql: string, params: Array<string | number | null>): Promise<void> {
  await tursoRequest(env, sql, params)
}

async function tursoRequest(
  env: Env,
  sql: string,
  params: Array<string | number | null>
): Promise<TursoPipelineResponse> {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error('Missing Turso credentials in worker bindings')
  }

  const databaseUrl = normalizeDatabaseUrl(env.TURSO_DATABASE_URL)
  const endpoint = databaseUrl.replace('libsql://', 'https://') + '/v2/pipeline'

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args: params.map(formatParam),
          },
        },
        { type: 'close' },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Turso HTTP ${response.status}: ${await response.text()}`)
  }

  const data = (await response.json()) as TursoPipelineResponse
  const firstResult = data.results[0]
  if (firstResult?.type === 'error' || firstResult?.response?.error) {
    throw new Error(`Turso query failed: ${JSON.stringify(firstResult.response.error)}`)
  }

  return data
}

function normalizeDatabaseUrl(value: string): string {
  return value.trim().replace(/^['\"]+|['\"]+$/g, '').replace(/\/+$/, '')
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/^['\"]+|['\"]+$/g, '')
}

function formatParam(param: string | number | null) {
  if (param === null) return { type: 'null' }
  if (typeof param === 'number') return { type: 'integer', value: String(param) }
  return { type: 'text', value: param }
}
