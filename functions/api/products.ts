interface Env {
  DB: D1Database
}
import { requireAdmin } from '../_lib/session'

const validStatuses = new Set(['active', 'inactive'])

const mapProduct = (product: any) => ({
  ...product,
  features: (() => {
    try { return JSON.parse(product.features || '[]') } catch { return [] }
  })(),
})

const fail = (message: string): never => { throw new Error(message) }

const text = (value: unknown, field: string, maxLength: number, required = false) => {
  if (value === undefined || value === null) {
    if (required) fail(`${field} é obrigatório`)
    return undefined
  }
  if (typeof value !== 'string') fail(`${field} inválido`)
  const result = value.trim()
  if (required && !result) fail(`${field} é obrigatório`)
  if (result.length > maxLength) fail(`${field} excede o limite permitido`)
  return result
}

const productInput = (data: any, creating: boolean) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail('Dados do produto inválidos')
  const name = text(data.name, 'Nome', 120, creating)
  const description = text(data.description, 'Descrição', 2000)
  const image = text(data.image, 'Imagem', 2048)
  if (image) {
    try {
      const url = new URL(image)
      if (url.protocol !== 'https:' && url.protocol !== 'http:') fail('A imagem deve usar uma URL http ou https')
    } catch { fail('URL da imagem inválida') }
  }

  const number = (value: unknown, field: string, integer = false) => {
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) fail(`${field} inválido`)
    return value
  }
  const price = number(data.price, 'Preço')
  const stock = number(data.stock, 'Estoque', true)
  if (creating && price === undefined) fail('Preço é obrigatório')
  if (creating && stock === undefined) fail('Estoque é obrigatório')
  const status = data.status === undefined ? undefined : validStatuses.has(data.status) ? data.status : fail('Status inválido')
  let features: string[] | undefined
  if (data.features !== undefined) {
    if (!Array.isArray(data.features) || data.features.length > 20) fail('Características inválidas')
    features = data.features.map((item: unknown) => {
      if (typeof item !== 'string') fail('Características inválidas')
      const feature = item.trim()
      if (!feature || feature.length > 120) fail('Características inválidas')
      return feature
    })
  }
  return { name, description, image, price, stock, status, features }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare('SELECT * FROM products ORDER BY price ASC').all()
    return Response.json((results as any[]).map(mapProduct))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const data = productInput(await context.request.json(), true)
    const id = 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10)
    await context.env.DB.prepare(`INSERT INTO products (id, name, description, image, price, stock, status, features, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
      .bind(id, data.name, data.description || '', data.image || '', data.price, data.stock, data.status || 'active', JSON.stringify(data.features || [])).run()
    const product = await context.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<any>()
    return Response.json(mapProduct(product), { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const raw: any = await context.request.json()
    if (!raw?.id || typeof raw.id !== 'string') return Response.json({ error: 'ID do produto obrigatório' }, { status: 400 })
    const data = productInput(raw, false)
    const current = await context.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(raw.id).first<any>()
    if (!current) return Response.json({ error: 'Produto não encontrado' }, { status: 404 })
    await context.env.DB.prepare(`UPDATE products SET price = ?, stock = ?, status = ?, name = ?, description = ?, image = ?, features = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(data.price ?? current.price, data.stock ?? current.stock, data.status ?? current.status, data.name ?? current.name, data.description ?? current.description, data.image ?? current.image, data.features === undefined ? current.features : JSON.stringify(data.features), raw.id).run()
    const product = await context.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(raw.id).first<any>()
    return Response.json(mapProduct(product))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = new URL(context.request.url).searchParams.get('id')
  if (!id) return Response.json({ error: 'ID do produto obrigatório' }, { status: 400 })
  try {
    await requireAdmin(context.request, context.env.DB)
    const result = await context.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    if (!result.meta.changes) return Response.json({ error: 'Produto não encontrado' }, { status: 404 })
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
