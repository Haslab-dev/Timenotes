const R2_PUBLIC_URL = 'https://pub-e9f8e24ea55741c2b8339e9e52d47d05.r2.dev'

export const onRequestGet: PagesFunction = async (context) => {
  const segments = context.params.path
  const key = Array.isArray(segments) ? segments.join('/') : (segments as string)
  if (!key) {
    return new Response('Not Found', { status: 404 })
  }

  const r2Url = `${R2_PUBLIC_URL}/${key}`
  const res = await fetch(r2Url)

  if (!res.ok) {
    return new Response('Not Found', { status: 404 })
  }

  const headers = new Headers(res.headers)
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  headers.delete('cf-cache-status')

  return new Response(res.body, { headers })
}
