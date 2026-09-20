interface Env {
  DB: D1Database
}
import { requireAdmin, requireSession } from '../_lib/session'

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
    const method = ['pix', 'credit_card', 'boleto'].includes(data.payment_method) ? data.payment_method : 'pix'
    const address = data.shipping_address && typeof data.shipping_address === 'object' ? data.shipping_address : {}
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
    const discount = method === 'pix' ? subtotal * 0.05 : 0
    const total = Math.max(0, subtotal - discount + shipping)

    await context.env.DB.prepare(`
      INSERT INTO orders (id, user_id, user_name, user_email, status, subtotal, discount, shipping, total, payment_status, payment_method, shipping_address, tracking_code, assigned_serials, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      orderId,
      user.id, user.name, user.email, 'pending', subtotal, discount, shipping, total,
      'pending', method, JSON.stringify(address), null, '[]'
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
    return Response.json({ success: true, orderId, assignedSerials: [] }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do pedido obrigatório' }, { status: 400 })
    await requireAdmin(context.request, context.env.DB)

    await context.env.DB.prepare(`
      UPDATE orders
      SET status = COALESCE(?, status),
          payment_status = COALESCE(?, payment_status),
          tracking_code = COALESCE(?, tracking_code),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.status ?? null,
      data.payment_status ?? null,
      data.tracking_code ?? null,
      data.id
    ).run()

    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

