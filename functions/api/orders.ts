interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const userId = url.searchParams.get('user_id')
  const orderId = url.searchParams.get('id')

  try {
    if (orderId) {
      const order: any = await context.env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(orderId).first()
      if (!order) return Response.json(null)
      const { results: items } = await context.env.DB.prepare('SELECT * FROM order_items WHERE order_id = ?').bind(orderId).all()
      order.items = items
      order.shipping_address = JSON.parse(order.shipping_address || '{}')
      order.assigned_serials = JSON.parse(order.assigned_serials || '[]')
      return Response.json(order)
    }

    let ordersQuery = 'SELECT * FROM orders ORDER BY created_at DESC'
    let stmt = context.env.DB.prepare(ordersQuery)
    if (userId) {
      ordersQuery = 'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC'
      stmt = context.env.DB.prepare(ordersQuery).bind(userId)
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
    const orderId = data.id || ('ORD-' + Date.now().toString().slice(-6))

    const assignedSerials: string[] = []
    const totalItems = data.items?.reduce((acc: number, it: any) => acc + (it.quantity || 1), 0) || 1
    for (let i = 0; i < totalItems; i++) {
      const serial = `TAG-${Math.floor(1000 + Math.random() * 9000)}-BR`
      assignedSerials.push(serial)
    }

    await context.env.DB.prepare(`
      INSERT INTO orders (id, user_id, user_name, user_email, status, subtotal, discount, shipping, total, payment_status, payment_method, shipping_address, tracking_code, assigned_serials, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      orderId,
      data.user_id,
      data.user_name,
      data.user_email,
      data.status || 'paid',
      data.subtotal || 0,
      data.discount || 0,
      data.shipping || 0,
      data.total || 0,
      data.payment_status || 'approved',
      data.payment_method || 'pix',
      JSON.stringify(data.shipping_address || {}),
      'BR' + Math.floor(100000000 + Math.random() * 900000000) + 'SP',
      JSON.stringify(assignedSerials)
    ).run()

    if (Array.isArray(data.items)) {
      for (const it of data.items) {
        const itemId = 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
        await context.env.DB.prepare(`
          INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          itemId,
          orderId,
          it.product_id,
          it.product_name,
          it.quantity,
          it.unit_price,
          it.total
        ).run()
      }
    }

    for (const serial of assignedSerials) {
      const tagId = 'tag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
      const publicId = 'tag-' + serial.toLowerCase().replace(/[^a-z0-9]/g, '')
      await context.env.DB.prepare(`
        INSERT INTO nfc_tags (id, public_id, serial_number, status, owner_id, name, created_at, updated_at)
        VALUES (?, ?, ?, 'pending_activation', ?, ?, datetime('now'), datetime('now'))
      `).bind(tagId, publicId, serial, data.user_id, `Tag NFC #${serial}`).run()
    }

    return Response.json({ success: true, orderId, assignedSerials }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do pedido obrigatório' }, { status: 400 })

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

