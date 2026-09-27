interface Env {
  DB: D1Database
  SYNCPAY_CLIENT_ID?: string
  SYNCPAY_CLIENT_SECRET?: string
}
import { requireAdmin, requireSession } from '../_lib/session'
import { validateCoupon } from '../_lib/coupons'
import { createSyncPayPixCharge } from '../_lib/syncpay'

function shippingFor(zip: unknown): number {
  const clean = typeof zip === 'string' ? zip.replace(/\D/g, '') : ''
  return clean.length >= 8 && (clean.startsWith('0') || clean.startsWith('1')) ? 0 : 19.9
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const userId = url.searchParams.get('user_id')
  const orderId = url.searchParams.get('id')

  try {
    const user = await requireSession(context.request, context.env.DB)
    const admin = user.role === 'admin'
    if (orderId) {
      const order: any = await context.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first()
      if (!order) return Response.json(null)
      if (!admin && order.user_id !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      const { results: items } = await context.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all()
      order.items = items
      order.shipping_address = JSON.parse(order.shipping_address || '{}')
      order.assigned_serials = JSON.parse(order.assigned_serials || '[]')
      return Response.json(order)
    }

    let ordersQuery = 'SELECT * FROM orders ORDER BY created_at DESC'
    let stmt = context.env.DB.prepare(ordersQuery)
    if (!admin || userId) {
      if (!admin && userId && userId !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      ordersQuery = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
      stmt = context.env.DB.prepare(ordersQuery).bind(admin ? userId : user.id)
    }

    const { results: orders } = await stmt.all()
    for (const ord of orders as any[]) {
      const { results: items } = await context.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(ord.id).all()
      ord.items = items
      ord.shipping_address = JSON.parse(ord.shipping_address || '{}')
      ord.assigned_serials = JSON.parse(ord.assigned_serials || '[]')
    }

    return Response.json(orders)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const user = await requireSession(context.request, context.env.DB)
    if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 50)
      return Response.json({ error: 'Itens do pedido inválidos' }, { status: 400 })
    const orderId = `ORD-${crypto.randomUUID()}`
    if (data.payment_method && data.payment_method !== 'pix')
      return Response.json({ error: 'No momento, o checkout aceita somente pagamento por Pix.' }, { status: 400 })
    const method = 'pix'
    const address = data.shipping_address && typeof data.shipping_address === 'object' ? data.shipping_address : {}
    if (!address.street || !address.number || !address.city || !address.state || !address.zip)
      return Response.json({ error: 'Endereço de entrega incompleto.' }, { status: 400 })
    const document = String(data.document || '').replace(/\D/g, '')
    const phone = String(data.phone || user.phone || '').replace(/\D/g, '')
    if (![11, 14].includes(document.length))
      return Response.json({ error: 'Informe um CPF ou CNPJ válido para gerar o Pix.' }, { status: 400 })
    if (phone.length < 10 || phone.length > 13)
      return Response.json({ error: 'Informe um telefone válido com DDD para gerar o Pix.' }, { status: 400 })
    const orderItems: Array<{ product: any; quantity: number; total: number }> = []
    let subtotal = 0
    for (const item of data.items) {
      const quantity = Number(item?.quantity)
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100 || typeof item?.product_id !== 'string')
        return Response.json({ error: 'Item do pedido inválido' }, { status: 400 })
      const product = await context.env.DB.prepare("SELECT id, name, price, stock FROM products WHERE id = ? AND status = 'active'").bind(item.product_id).first<any>()
      if (!product || Number(product.stock) < quantity) return Response.json({ error: 'Produto indisponível' }, { status: 400 })
      const total = Number(product.price) * quantity
      subtotal += total
      orderItems.push({ product, quantity, total })
    }
    const shipping = shippingFor(address.zip)
    const couponResult = data.coupon_code ? await validateCoupon(context.env.DB, data.coupon_code, subtotal) : null
    const discount = couponResult?.discount || 0
    const total = Math.max(0, subtotal - discount + shipping)
    if (total < 1) return Response.json({ error: 'O valor mínimo para pagamento por Pix é R$ 1,00.' }, { status: 400 })

    const charge = await createSyncPayPixCharge(context.env, {
      amount: total,
      name: user.name,
      document,
      email: user.email,
      phone,
      description: `Pedido AvaliaTag ${orderId}`,
      webhookUrl: new URL('/api/syncpay-webhook', context.request.url).toString(),
    })
    const transactionId = String(
      charge.identifier || charge.transaction_id || charge.reference_id || charge.idTransaction || ''
    )
    const pixCode = String(
      charge.pix_code || charge.payment?.pix_code || charge.paymentCode || ''
    )
    if (!transactionId || !pixCode.startsWith('000201'))
      throw new Error('A SyncPay não devolveu uma cobrança Pix válida. Tente novamente em instantes.')

    await context.env.DB.prepare(`
      INSERT INTO orders (id, user_id, user_name, user_email, status, subtotal, discount, shipping, total, payment_status, payment_method, shipping_address, tracking_code, assigned_serials, coupon_id, coupon_code, provider_transaction_id, pix_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      orderId,
      user.id, user.name, user.email, 'pending', subtotal, discount, shipping, total,
      'pending', method, JSON.stringify(address), null, '[]', couponResult?.coupon.id || null, couponResult?.coupon.code || null,
      transactionId, pixCode
    ).run()

    for (const item of orderItems) {
        const itemId = 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
        await context.env.DB.prepare(`
          INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId,
          orderId,
          item.product.id, item.product.name, item.quantity, item.product.price, item.total
        ).run()
    }
    if (couponResult) {
      const update = await context.env.DB.prepare(`UPDATE coupons SET usage_count=usage_count+1,updated_at=datetime('now') WHERE id=? AND status='active' AND (usage_limit IS NULL OR usage_count < usage_limit)`)
        .bind(couponResult.coupon.id).run()
      if (!update.meta.changes) {
        await context.env.DB.prepare('DELETE FROM orders WHERE id=?').bind(orderId).run()
        return Response.json({ error: 'Este cupom acabou de atingir o limite de utilizações.' }, { status: 409 })
      }
      await context.env.DB.prepare(`INSERT INTO coupon_redemptions (id,coupon_id,order_id,user_id,discount_amount) VALUES (?,?,?,?,?)`)
        .bind(`redemption-${crypto.randomUUID()}`,couponResult.coupon.id,orderId,user.id,discount).run()
    }
    return Response.json({
      success: true,
      orderId,
      assignedSerials: [],
      subtotal,
      discount,
      shipping,
      total,
      coupon_code: couponResult?.coupon.code || null,
      payment_status: 'pending',
      provider_transaction_id: transactionId,
      pix_code: pixCode,
    }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do pedido obrigatório' }, { status: 400 })
    await requireAdmin(context.request, context.env.DB)
    const order = await context.env.DB.prepare('SELECT payment_status FROM orders WHERE id=?').bind(data.id).first<{ payment_status: string }>()
    if (!order) return Response.json({ error: 'Pedido não encontrado.' }, { status: 404 })
    if (data.status && ['paid', 'shipped', 'delivered'].includes(data.status) && order.payment_status !== 'approved')
      return Response.json({ error: 'A SyncPay ainda não confirmou o pagamento deste pedido.' }, { status: 409 })

    await context.env.DB.prepare(`
      UPDATE orders
      SET status = COALESCE(?, status),
          tracking_code = COALESCE(?, tracking_code),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.status ?? null,
      data.tracking_code ?? null,
      data.id
    ).run()

    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

