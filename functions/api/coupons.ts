interface Env { DB: D1Database }
import { requireAdmin } from '../_lib/session'
import { normalizeCouponCode, validateCoupon } from '../_lib/coupons'

const failure = (error: unknown, status = 400) => {
  if (error instanceof Response) return error
  return Response.json({ error: error instanceof Error ? error.message : 'Não foi possível processar o cupom.' }, { status })
}

const optionalNumber = (value: unknown, integer = false) => {
  if (value === '' || value === null || value === undefined) return null
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0 || (integer && !Number.isInteger(number))) throw new Error('Valor numérico inválido.')
  return number
}

function couponInput(data: any) {
  const code = normalizeCouponCode(data.code)
  if (code.length < 3 || code.length > 32) throw new Error('O código deve ter entre 3 e 32 caracteres.')
  const discountType = data.discount_type === 'fixed' ? 'fixed' : data.discount_type === 'percentage' ? 'percentage' : null
  if (!discountType) throw new Error('Selecione o tipo de desconto.')
  const discountValue = Number(data.discount_value)
  if (!Number.isFinite(discountValue) || discountValue <= 0 || (discountType === 'percentage' && discountValue > 100)) throw new Error('Informe um desconto válido.')
  const description = String(data.description || '').trim().slice(0, 240)
  const minimum = optionalNumber(data.minimum_order_amount) || 0
  const maximum = optionalNumber(data.maximum_discount_amount)
  const usageLimit = optionalNumber(data.usage_limit, true)
  const startsAt = data.starts_at ? new Date(data.starts_at).toISOString() : null
  const expiresAt = data.expires_at ? new Date(data.expires_at).toISOString() : null
  if (startsAt && expiresAt && startsAt >= expiresAt) throw new Error('A data final deve ser posterior à data inicial.')
  const status = data.status === 'inactive' ? 'inactive' : 'active'
  return { code, description, discountType, discountValue, minimum, maximum, usageLimit, startsAt, expiresAt, status }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const code = url.searchParams.get('code')
  try {
    if (code) {
      const result = await validateCoupon(context.env.DB, code, url.searchParams.get('subtotal'))
      return Response.json({ code: result.coupon.code, description: result.coupon.description, discount_type: result.coupon.discount_type, discount_value: Number(result.coupon.discount_value), discount: result.discount })
    }
    await requireAdmin(context.request, context.env.DB)
    const { results } = await context.env.DB.prepare('SELECT * FROM coupons ORDER BY datetime(created_at) DESC').all()
    return Response.json(results)
  } catch (error) { return failure(error) }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const input = couponInput(await context.request.json())
    const id = `coupon-${crypto.randomUUID()}`
    await context.env.DB.prepare(`INSERT INTO coupons (id,code,description,discount_type,discount_value,minimum_order_amount,maximum_discount_amount,usage_limit,starts_at,expires_at,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,input.code,input.description,input.discountType,input.discountValue,input.minimum,input.maximum,input.usageLimit,input.startsAt,input.expiresAt,input.status).run()
    return Response.json(await context.env.DB.prepare('SELECT * FROM coupons WHERE id=?').bind(id).first(), { status: 201 })
  } catch (error: any) {
    if (String(error?.message).includes('UNIQUE')) return Response.json({ error: 'Já existe um cupom com este código.' }, { status: 409 })
    return failure(error)
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const data: any = await context.request.json()
    if (typeof data.id !== 'string') return Response.json({ error: 'Cupom não informado.' }, { status: 400 })
    const input = couponInput(data)
    await context.env.DB.prepare(`UPDATE coupons SET code=?,description=?,discount_type=?,discount_value=?,minimum_order_amount=?,maximum_discount_amount=?,usage_limit=?,starts_at=?,expires_at=?,status=?,updated_at=datetime('now') WHERE id=?`)
      .bind(input.code,input.description,input.discountType,input.discountValue,input.minimum,input.maximum,input.usageLimit,input.startsAt,input.expiresAt,input.status,data.id).run()
    return Response.json(await context.env.DB.prepare('SELECT * FROM coupons WHERE id=?').bind(data.id).first())
  } catch (error: any) {
    if (String(error?.message).includes('UNIQUE')) return Response.json({ error: 'Já existe um cupom com este código.' }, { status: 409 })
    return failure(error)
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const id = new URL(context.request.url).searchParams.get('id')
    if (!id) return Response.json({ error: 'Cupom não informado.' }, { status: 400 })
    const coupon = await context.env.DB.prepare('SELECT usage_count FROM coupons WHERE id=?').bind(id).first<{ usage_count: number }>()
    if (!coupon) return Response.json({ error: 'Cupom não encontrado.' }, { status: 404 })
    if (Number(coupon.usage_count) > 0) {
      await context.env.DB.prepare("UPDATE coupons SET status='inactive',updated_at=datetime('now') WHERE id=?").bind(id).run()
      return Response.json({ success: true, deactivated: true })
    }
    await context.env.DB.prepare('DELETE FROM coupons WHERE id=?').bind(id).run()
    return Response.json({ success: true, deactivated: false })
  } catch (error) { return failure(error) }
}
