interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare('SELECT * FROM products ORDER BY price ASC').all()
    const mapped = (results as any[]).map((p) => ({
      ...p,
      features: JSON.parse(p.features || '[]')
    }))
    return Response.json(mapped)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const id = data.id || 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

    await context.env.DB.prepare(`
      INSERT INTO products (id, name, description, image, price, stock, status, features, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      data.name,
      data.description || '',
      data.image || '',
      data.price || 0,
      data.stock || 0,
      data.status || 'active',
      JSON.stringify(data.features || [])
    ).run()

    return Response.json({ success: true, id }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'ID do produto obrigatório' }, { status: 400 })

    await context.env.DB.prepare(`
      UPDATE products
      SET price = COALESCE(?, price),
          stock = COALESCE(?, stock),
          status = COALESCE(?, status),
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.price ?? null,
      data.stock ?? null,
      data.status ?? null,
      data.name ?? null,
      data.description ?? null,
      data.id
    ).run()

    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return Response.json({ error: 'ID do produto obrigatório' }, { status: 400 })

  try {
    await context.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
