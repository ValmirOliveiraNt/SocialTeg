interface Env {
  DB: D1Database
}
import { requireAdmin } from '../_lib/session'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare('SELECT * FROM plans ORDER BY price ASC').all()
    const mapped = (results as any[]).map((p) => ({
      ...p,
      popular: Boolean(p.popular),
      analytics_enabled: Boolean(p.analytics_enabled),
      advanced_analytics: Boolean(p.advanced_analytics),
      features: JSON.parse(p.features || '[]')
    }))
    return Response.json(mapped)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do plano obrigatório' }, { status: 400 })

    await context.env.DB.prepare(`
      UPDATE plans
      SET price = COALESCE(?, price),
          status = COALESCE(?, status)
      WHERE id = ?
    `).bind(data.price ?? null, data.status ?? null, data.id).run()

    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

