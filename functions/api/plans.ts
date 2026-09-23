interface Env {
  DB: D1Database
  SYNCPAY_CLIENT_ID?: string
  SYNCPAY_CLIENT_SECRET?: string
  SYNCPAY_PIX_AUTO_PLAN_TOKEN?: string
}
import { requireAdmin } from '../_lib/session'
import { updateSyncPayPlanAmount } from '../_lib/syncpay'

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

    let price: number | null = null
    if (data.price !== undefined) {
      price = Number(data.price)
      if (!Number.isFinite(price) || price <= 0)
        return Response.json({ error: 'Informe uma mensalidade maior que zero.' }, { status: 400 })
      price = Math.round(price * 100) / 100
      if (data.id === 'plan-pro') {
        if (!context.env.SYNCPAY_PIX_AUTO_PLAN_TOKEN)
          return Response.json({ error: 'O plano Pix Automático não está configurado na SyncPay.' }, { status: 400 })
        await updateSyncPayPlanAmount(context.env, context.env.SYNCPAY_PIX_AUTO_PLAN_TOKEN, price)
      }
    }

    await context.env.DB.prepare(`
      UPDATE plans
      SET price = COALESCE(?, price),
          status = COALESCE(?, status)
      WHERE id = ?
    `).bind(price, data.status ?? null, data.id).run()

    const updated = await context.env.DB.prepare('SELECT * FROM plans WHERE id = ?').bind(data.id).first<any>()
    return Response.json({ ...updated, popular: Boolean(updated?.popular), analytics_enabled: Boolean(updated?.analytics_enabled), advanced_analytics: Boolean(updated?.advanced_analytics), features: JSON.parse(updated?.features || '[]') })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

