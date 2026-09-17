export async function requireSession(request: Request, db: D1Database) {
  const token = request.headers
    .get('Authorization')
    ?.match(/^Bearer (.+)$/)?.[1]
  if (!token) throw new Response('Não autorizado', { status: 401 })
  const user = await db
    .prepare(
      `SELECT u.id, u.role, u.status FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')`,
    )
    .bind(token)
    .first<{ id: string; role: string; status: string }>()
  if (!user) throw new Response('Sessão expirada', { status: 401 })
  if (user.status !== 'active')
    throw new Response('Conta indisponível', { status: 403 })
  return user
}

export function apiFailure(error: unknown) {
  if (error instanceof Response) return error
  console.error('Dashboard API error', error)
  return Response.json(
    { error: 'Não foi possível carregar os dados. Tente novamente.' },
    { status: 500 },
  )
}
