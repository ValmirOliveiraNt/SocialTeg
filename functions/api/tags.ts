interface Env {
  DB: D1Database
}
import { requireAdmin, requireSession } from '../_lib/session'

const publicFields = 'id, public_id, status, name, location, business_id'

async function requireOwnedTag(request: Request, db: D1Database, id: string) {
  const user = await requireSession(request, db)
  const tag = await db.prepare('SELECT * FROM nfc_tags WHERE id = ?').bind(id).first<{ owner_id: string | null }>()
  if (!tag) throw new Response('Tag não encontrada', { status: 404 })
  if (user.role !== 'admin' && tag.owner_id !== user.id) throw new Response('Acesso restrito', { status: 403 })
  return { user, tag }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const ownerId = url.searchParams.get('owner_id')
  const tagId = url.searchParams.get('id')
  const publicId = url.searchParams.get('public_id')
  const includeSerial = url.searchParams.get('include_serial') === '1'
  const serial = url.searchParams.get('serial')

  try {
    if (tagId) {
      await requireOwnedTag(context.request, context.env.DB, tagId)
      const tag = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE id = ?').bind(tagId).first()
      return Response.json(tag || null)
    }

    if (publicId) {
      if (includeSerial) {
        const tag = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE lower(public_id) = lower(?)').bind(publicId.trim()).first<{ id: string; owner_id: string | null }>()
        if (!tag) return Response.json(null)
        const user = await requireSession(context.request, context.env.DB)
        if (user.role !== 'admin' && tag.owner_id !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
        return Response.json(tag)
      }
      const tag = await context.env.DB.prepare(`SELECT ${publicFields} FROM nfc_tags WHERE lower(public_id) = lower(?)`).bind(publicId.trim()).first()
      return Response.json(tag || null)
    }

    if (serial) {
      const user = await requireSession(context.request, context.env.DB)
      const tag = await context.env.DB.prepare('SELECT id, public_id, serial_number, status, name, location, owner_id, business_id FROM nfc_tags WHERE lower(replace(serial_number, " ", "")) = lower(replace(?, " ", ""))').bind(serial.trim()).first<{ owner_id: string | null }>()
      if (tag && user.role !== 'admin' && tag.owner_id && tag.owner_id !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      return Response.json(tag || null)
    }

    const user = await requireSession(context.request, context.env.DB)
    if (ownerId) {
      if (user.role !== 'admin' && ownerId !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      const { results } = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE owner_id = ? ORDER BY created_at DESC').bind(ownerId).all()
      return Response.json(results)
    }

    const statement = user.role === 'admin'
      ? context.env.DB.prepare('SELECT * FROM nfc_tags ORDER BY created_at DESC')
      : context.env.DB.prepare('SELECT * FROM nfc_tags WHERE owner_id = ? ORDER BY created_at DESC').bind(user.id)
    const { results } = await statement.all()
    return Response.json(results)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const body: any = await context.request.json()
    const items = Array.isArray(body) ? body : (body.items ? body.items : [body])
    const statements = []

    for (const data of items) {
      const id = data.id || 'tag-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
      const cleanSerial = data.serial_number.replace(/^#+/, '').trim()
      const publicId = data.public_id || ('tag-' + cleanSerial.toLowerCase().replace(/[^a-z0-9]/g, ''))

      statements.push(
        context.env.DB.prepare(`
          INSERT INTO nfc_tags (id, public_id, serial_number, uid, product_id, status, owner_id, business_id, name, location, activated_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
          id,
          publicId,
          cleanSerial,
          data.uid || null,
          data.product_id || null,
          data.status || 'available',
          data.owner_id || null,
          data.business_id || null,
          data.name || ('Tag ' + cleanSerial),
          data.location || 'Estoque',
          data.activated_at || null
        )
      )
    }

    await context.env.DB.batch(statements)
    return Response.json({ success: true, count: statements.length }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const user = await requireSession(context.request, context.env.DB)
    if (Array.isArray(data.ids) && data.ids.length > 0) {
      if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      const ids = [...new Set(data.ids.filter((id: unknown) => typeof id === 'string'))].slice(0, 200)
      if (!ids.length) return Response.json({ error: 'Nenhuma Tag válida informada' }, { status: 400 })
      const statements = ids.map((id: string, index: number) => {
        if (data.operation === 'return_to_stock') {
          return context.env.DB.prepare(`UPDATE nfc_tags SET owner_id = NULL, business_id = NULL, status = 'available', location = 'Estoque', activated_at = NULL, updated_at = datetime('now') WHERE id = ?`).bind(id)
        }
        if (data.operation === 'assign') {
          const location = data.location_mode === 'sequence'
            ? `${String(data.location_prefix || 'Ponto').trim()} ${String(Number(data.location_start || 1) + index).padStart(2, '0')}`
            : String(data.location || 'Ponto principal').trim()
          return context.env.DB.prepare(`UPDATE nfc_tags SET owner_id = ?, business_id = ?, status = 'active', location = ?, activated_at = COALESCE(activated_at, datetime('now')), updated_at = datetime('now') WHERE id = ?`).bind(data.owner_id, data.business_id || null, location, id)
        }
        throw new Error('Operação em lote inválida')
      })
      await context.env.DB.batch(statements)
      return Response.json({ success: true, count: statements.length })
    }
    if (!data.id) {
      return Response.json({ error: 'ID da Tag obrigatório' }, { status: 400 })
    }

    const existing = await context.env.DB.prepare('SELECT owner_id FROM nfc_tags WHERE id = ?').bind(data.id).first<{ owner_id: string | null }>()
    if (!existing) return Response.json({ error: 'Tag não encontrada' }, { status: 404 })
    if (user.role !== 'admin') {
      if (existing.owner_id && existing.owner_id !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      if (data.owner_id !== undefined && data.owner_id !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      if (data.business_id) {
        const business = await context.env.DB.prepare('SELECT id FROM businesses WHERE id = ? AND owner_id = ?').bind(data.business_id, user.id).first()
        if (!business) return Response.json({ error: 'Estabelecimento inválido' }, { status: 403 })
      }
      data.owner_id = user.id
    }

    const ownerProvided = Object.prototype.hasOwnProperty.call(data, 'owner_id')
    const businessProvided = Object.prototype.hasOwnProperty.call(data, 'business_id')
    await context.env.DB.prepare(`
      UPDATE nfc_tags 
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          status = COALESCE(?, status),
          owner_id = CASE WHEN ? THEN ? ELSE owner_id END,
          business_id = CASE WHEN ? THEN ? ELSE business_id END,
          activated_at = COALESCE(?, activated_at),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name ?? null,
      data.location ?? null,
      data.status ?? null,
      ownerProvided ? 1 : 0,
      data.owner_id ?? null,
      businessProvided ? 1 : 0,
      data.business_id ?? null,
      data.activated_at ?? null,
      data.id
    ).run()

    const updated = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE id = ?').bind(data.id).first()
    return Response.json(updated)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    await requireAdmin(context.request, context.env.DB)
    await context.env.DB.prepare('DELETE FROM nfc_tags WHERE id = ?').bind(id).run()
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
