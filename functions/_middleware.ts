import { requireSession } from './_lib/session'

interface Env {
  DB: D1Database
}

// Keep only the endpoints needed before a visitor signs in public. All dashboard
// APIs must carry a valid, active session; authorization inside each handler
// continues to enforce the resource-level scope.
export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  if (!url.pathname.startsWith('/api/')) return context.next()

  const publicRequest =
    url.pathname === '/api/auth' ||
    (url.pathname === '/api/scans' && context.request.method === 'POST') ||
    (url.pathname === '/api/tags' &&
      context.request.method === 'GET' &&
      url.searchParams.has('public_id')) ||
    (url.pathname === '/api/destinations' &&
      context.request.method === 'GET' &&
      url.searchParams.has('tag_id')) ||
    ((url.pathname === '/api/products' || url.pathname === '/api/plans') &&
      context.request.method === 'GET')

  if (publicRequest) return context.next()

  try {
    await requireSession(context.request, context.env.DB)
    return context.next()
  } catch (error) {
    if (error instanceof Response) return error
    return Response.json({ error: 'Não foi possível validar a sessão.' }, { status: 500 })
  }
}
