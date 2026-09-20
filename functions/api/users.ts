interface Env {
  DB: D1Database
}
import { requireSession } from '../_lib/session'

const fields = 'id, name, email, phone, avatar, role, status, plan_id, created_at, updated_at'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  const email = url.searchParams.get('email')

  try {
    const requester = await requireSession(context.request, context.env.DB)
    const admin = requester.role === 'admin'
    if (id) {
      if (!admin && id !== requester.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      const user = await context.env.DB.prepare(`SELECT ${fields} FROM users WHERE id = ?`).bind(id).first()
      return Response.json(user || null)
    }

    if (email) {
      if (!admin) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      const user = await context.env.DB.prepare(`SELECT ${fields} FROM users WHERE lower(email) = lower(?)`).bind(email).first()
      return Response.json(user || null)
    }

    if (!admin) {
      const user = await context.env.DB.prepare(`SELECT ${fields} FROM users WHERE id = ?`).bind(requester.id).first()
      return Response.json(user ? [user] : [])
    }
    const { results } = await context.env.DB.prepare(`SELECT ${fields} FROM users ORDER BY created_at DESC`).all()
    return Response.json(results)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do usuário obrigatório' }, { status: 400 })
    const requester = await requireSession(context.request, context.env.DB)
    const admin = requester.role === 'admin'
    if (!admin && data.id !== requester.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })

    const statement = admin ? `
      UPDATE users
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          status = COALESCE(?, status),
          plan_id = COALESCE(?, plan_id),
          updated_at = datetime('now')
      WHERE id = ?
    ` : `
      UPDATE users
      SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = datetime('now')
      WHERE id = ?
    `
    const values = admin ? [
      data.name ?? null,
      data.phone ?? null,
      data.status ?? null,
      data.plan_id ?? null,
      data.id
    ] : [data.name ?? null, data.phone ?? null, data.id]
    await context.env.DB.prepare(statement).bind(...values).run()

    const updated = await context.env.DB.prepare(`SELECT ${fields} FROM users WHERE id = ?`).bind(data.id).first()
    return Response.json(updated)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

