interface Env {
  DB: D1Database
  SYNCPAY_CLIENT_ID?: string
  SYNCPAY_CLIENT_SECRET?: string
}

import { requireAdmin, requireSession } from '../_lib/session'
import { createSyncPayPixCharge } from '../_lib/syncpay'

const unitPrice = (mode: string, quantity: number) => {
  if (mode === 'subscription') return quantity <= 10 ? 19.9 : quantity <= 20 ? 14.9 : 9.9
  return quantity === 1 ? 80 : quantity <= 10 ? 69.9 : quantity <= 20 ? 59.9 : 49.9
}

const mapRows = (rows: any[]) => rows.map((row) => ({
  ...row,
  has_custom_logo: Boolean(row.has_custom_logo),
  requires_return: Boolean(row.requires_return),
  assigned_serials: JSON.parse(row.assigned_serials || '[]'),
}))

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = await requireSession(context.request, context.env.DB)
    const statement = user.role === 'admin'
      ? context.env.DB.prepare(`SELECT p.*, u.name AS user_name, u.email AS user_email, b.name AS business_name, b.logo_url
          FROM plate_orders p JOIN users u ON u.id=p.user_id JOIN businesses b ON b.id=p.business_id ORDER BY datetime(p.created_at) DESC`)
      : context.env.DB.prepare(`SELECT p.*, b.name AS business_name, b.logo_url
          FROM plate_orders p JOIN businesses b ON b.id=p.business_id WHERE p.user_id=? ORDER BY datetime(p.created_at) DESC`).bind(user.id)
    const { results } = await statement.all()
    return Response.json(mapRows(results as any[]))
  } catch (error: any) {
    if (error instanceof Response) return error
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await requireSession(context.request, context.env.DB)
    const data: any = await context.request.json()
    const mode = data.mode === 'outright' ? 'outright' : 'subscription'
    const quantity = Number(data.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100)
      return Response.json({ error: 'Informe uma quantidade entre 1 e 100.' }, { status: 400 })
    const business = await context.env.DB.prepare('SELECT * FROM businesses WHERE id=? AND owner_id=?').bind(data.business_id, user.id).first<any>()
    if (!business) return Response.json({ error: 'Estabelecimento inválido.' }, { status: 400 })
    if (mode === 'subscription') {
      const active = await context.env.DB.prepare(`SELECT id FROM subscriptions WHERE user_id=? AND status IN ('active','trialing') AND (current_period_end IS NULL OR datetime(current_period_end)>datetime('now')) ORDER BY datetime(created_at) DESC LIMIT 1`).bind(user.id).first()
      if (!active) return Response.json({ error: 'É necessária uma assinatura ativa para solicitar placas com os recursos completos.' }, { status: 400 })
    }
    const hasLogo = Boolean(data.has_custom_logo)
    if (hasLogo && !business.logo_url) return Response.json({ error: 'Cadastre a logo do estabelecimento antes de escolher a personalização.' }, { status: 400 })
    const fixedUrl = mode === 'outright' ? String(data.fixed_destination_url || '').trim() : null
    if (mode === 'outright') {
      try { new URL(fixedUrl!) } catch { return Response.json({ error: 'Informe um destino fixo válido, começando com https://.' }, { status: 400 }) }
    }
    const document = String(data.document || '').replace(/\D/g, '')
    const phone = String(user.phone || '').replace(/\D/g, '')
    if (![11, 14].includes(document.length)) return Response.json({ error: 'Informe um CPF ou CNPJ válido.' }, { status: 400 })
    if (phone.length < 10) return Response.json({ error: 'Cadastre um telefone com DDD antes de comprar.' }, { status: 400 })
    if (!data.accepted_terms) return Response.json({ error: 'Aceite as condições de propriedade e funcionamento das placas.' }, { status: 400 })

    const price = unitPrice(mode, quantity)
    const customization = mode === 'subscription' && hasLogo && quantity <= 10 ? quantity * 5 : 0
    const total = Math.round((price * quantity + customization) * 100) / 100
    const id = `PLQ-${crypto.randomUUID()}`
    const charge = await createSyncPayPixCharge(context.env, {
      amount: total, name: user.name, document, email: user.email, phone,
      description: `${quantity} placa(s) AvaliaTag - ${id}`,
      webhookUrl: new URL('/api/syncpay-webhook', context.request.url).toString(),
    })
    const transactionId = String(charge.identifier || charge.transaction_id || charge.reference_id || '')
    const pixCode = String(charge.pix_code || charge.payment?.pix_code || '')
    if (!transactionId || !pixCode.startsWith('000201')) throw new Error('A SyncPay não devolveu uma cobrança Pix válida.')
    const ownership = mode === 'outright' || hasLogo ? 'customer' : 'avaliatag'
    const requiresReturn = ownership === 'avaliatag' ? 1 : 0
    const digitalAccess = mode === 'outright' ? 'fixed_destination' : 'full_subscription'
    await context.env.DB.prepare(`INSERT INTO plate_orders
      (id,user_id,business_id,mode,quantity,has_custom_logo,ownership,requires_return,digital_access,fixed_destination_url,unit_price,customization_total,total,provider_transaction_id,pix_code)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,user.id,business.id,mode,quantity,hasLogo ? 1 : 0,ownership,requiresReturn,digitalAccess,fixedUrl,price,customization,total,transactionId,pixCode).run()
    return Response.json({ id, pix_code: pixCode, total, ownership, requires_return: Boolean(requiresReturn), digital_access: digitalAccess }, { status: 201 })
  } catch (error: any) {
    if (error instanceof Response) return error
    return Response.json({ error: error.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const data: any = await context.request.json()
    const allowed = ['awaiting_payment','paid','in_production','ready','shipped','delivered','tags_linked','cancelled']
    if (!data.id || (data.status && !allowed.includes(data.status))) return Response.json({ error: 'Atualização inválida.' }, { status: 400 })
    await context.env.DB.prepare(`UPDATE plate_orders SET status=COALESCE(?,status),tracking_code=COALESCE(?,tracking_code),assigned_serials=COALESCE(?,assigned_serials),updated_at=datetime('now') WHERE id=?`)
      .bind(data.status ?? null, data.tracking_code ?? null, data.assigned_serials ? JSON.stringify(data.assigned_serials) : null, data.id).run()
    return Response.json({ success: true })
  } catch (error: any) {
    if (error instanceof Response) return error
    return Response.json({ error: error.message }, { status: 400 })
  }
}
