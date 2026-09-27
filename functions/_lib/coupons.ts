export type CouponRow = {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  minimum_order_amount: number
  maximum_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  starts_at: string | null
  expires_at: string | null
  status: 'active' | 'inactive'
}

export const normalizeCouponCode = (value: unknown) =>
  typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : ''

export async function validateCoupon(db: D1Database, rawCode: unknown, rawSubtotal: unknown) {
  const code = normalizeCouponCode(rawCode)
  const subtotal = Math.round(Number(rawSubtotal) * 100) / 100
  if (!code) throw new Error('Informe um cupom de desconto.')
  if (!Number.isFinite(subtotal) || subtotal <= 0) throw new Error('O carrinho precisa ter produtos para aplicar o cupom.')
  const coupon = await db.prepare('SELECT * FROM coupons WHERE code = ? COLLATE NOCASE').bind(code).first<CouponRow>()
  if (!coupon || coupon.status !== 'active') throw new Error('Cupom inválido ou inativo.')
  const now = Date.now()
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) throw new Error('Este cupom ainda não está disponível.')
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now) throw new Error('Este cupom expirou.')
  if (coupon.usage_limit !== null && Number(coupon.usage_count) >= Number(coupon.usage_limit)) throw new Error('Este cupom atingiu o limite de utilizações.')
  if (subtotal < Number(coupon.minimum_order_amount || 0)) {
    throw new Error(`Este cupom exige pedido mínimo de R$ ${Number(coupon.minimum_order_amount).toFixed(2).replace('.', ',')}.`)
  }
  let discount = coupon.discount_type === 'percentage'
    ? subtotal * (Number(coupon.discount_value) / 100)
    : Number(coupon.discount_value)
  if (coupon.maximum_discount_amount !== null) discount = Math.min(discount, Number(coupon.maximum_discount_amount))
  discount = Math.round(Math.min(discount, subtotal) * 100) / 100
  return { coupon, discount, subtotal }
}
