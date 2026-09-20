interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  const email = url.searchParams.get('email')

  try {
    if (id) {
      const user = await context.env.DB.prepare('SELECT id, name, email, phone, avatar, role, status, plan_id, created_at, updated_at FROM users WHERE id = ?').bind(id).first()
      return Response.json(user || null)
    }

    if (email) {
      const user = await context.env.DB.prepare('SELECT id, name, email, phone, avatar, role, status, plan_id, created_at, updated_at FROM users WHERE lower(email) = lower(?)').bind(email).first()
      return Response.json(user || null)
    }

    const { results } = await context.env.DB.prepare('SELECT id, name, email, phone, avatar, role, status, plan_id, created_at, updated_at FROM users ORDER BY created_at DESC').all()
    return Response.json(results)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do usuário obrigatório' }, { status: 400 })

    await context.env.DB.prepare(`
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status),
          plan_id = COALESCE(?, plan_id),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name ?? null,
      data.phone ?? null,
      data.status ?? null,
      data.plan_id ?? null,
      data.id
    ).run()

    const updated = await context.env.DB.prepare('SELECT id, name, email, phone, avatar, role, status, plan_id, created_at, updated_at FROM users WHERE id = ?').bind(data.id).first()
    return Response.json(updated)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

