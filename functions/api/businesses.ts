interface Env {
  DB: D1Database
}
import { requireSession } from '../_lib/session'

async function requireBusinessAccess(request: Request, db: D1Database, id: string) {
  const user = await requireSession(request, db)
  const business = await db.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first<{ owner_id: string }>()
  if (!business) throw new Response('Estabelecimento não encontrado', { status: 404 })
  if (user.role !== 'admin' && business.owner_id !== user.id) throw new Response('Acesso restrito', { status: 403 })
  return user
}

function mapBusiness(b: any) {
  if (!b) return null
  let defaultConfiguration = b.default_destination_configuration || {}
  if (typeof defaultConfiguration === 'string') {
    try { defaultConfiguration = JSON.parse(defaultConfiguration) } catch { defaultConfiguration = {} }
  }
  return {
    ...b,
    default_destination_configuration: defaultConfiguration,
    menuUrl: b.menu_url || b.menuUrl || '',
    googleReviewsUrl: b.google_reviews_url || b.googleReviewsUrl || '',
    instagramUrl: b.instagram_url || b.instagramUrl || '',
    menu_url: b.menu_url || b.menuUrl || '',
    google_reviews_url: b.google_reviews_url || b.googleReviewsUrl || '',
    instagram_url: b.instagram_url || b.instagramUrl || '',
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const ownerId = url.searchParams.get('owner_id')
  const id = url.searchParams.get('id')
  const publicView = url.searchParams.get('public') === '1'

  try {
    if (id && publicView) {
      const biz = await context.env.DB.prepare(`SELECT id, name, description, logo_url, cover_url, phone, website, address, city, state, country, menu_url, google_reviews_url, instagram_url FROM businesses WHERE id = ?`).bind(id).first()
      return Response.json(mapBusiness(biz))
    }
    const user = await requireSession(context.request, context.env.DB)
    const admin = user.role === 'admin'
    if (id) {
      if (!admin) await requireBusinessAccess(context.request, context.env.DB, id)
      const biz = await context.env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first()
      return Response.json(mapBusiness(biz))
    }

    if (ownerId) {
      if (!admin && ownerId !== user.id) return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      const { results } = await context.env.DB.prepare('SELECT * FROM businesses WHERE owner_id = ? ORDER BY created_at DESC').bind(ownerId).all()
      return Response.json((results as any[]).map(mapBusiness))
    }

    const statement = admin
      ? context.env.DB.prepare('SELECT * FROM businesses ORDER BY created_at DESC')
      : context.env.DB.prepare('SELECT * FROM businesses WHERE owner_id = ? ORDER BY created_at DESC').bind(user.id)
    const { results } = await statement.all()
    return Response.json((results as any[]).map(mapBusiness))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const user = await requireSession(context.request, context.env.DB)
    const id = data.id || 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    const menuUrl = data.menuUrl || data.menu_url || null
    const googleReviewsUrl = data.googleReviewsUrl || data.google_reviews_url || null
    const instagramUrl = data.instagramUrl || data.instagram_url || null
    const defaultConfiguration = typeof data.default_destination_configuration === 'string'
      ? data.default_destination_configuration
      : JSON.stringify(data.default_destination_configuration || {})

    await context.env.DB.prepare(`
      INSERT INTO businesses (
        id, owner_id, name, description, logo_url, cover_url, phone, email, website,
        address, city, state, country, menu_url, google_reviews_url, instagram_url,
        default_destination_type, default_target_url, default_destination_configuration,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      user.role === 'admin' ? data.owner_id : user.id,
      data.name,
      data.description || '',
      data.logo_url || '',
      data.cover_url || null,
      data.phone || null,
      data.email || null,
      data.website || null,
      data.address || '',
      data.city || '',
      data.state || '',
      data.country || 'Brasil',
      menuUrl,
      googleReviewsUrl,
      instagramUrl,
      data.default_destination_type || 'google_review',
      data.default_target_url || null,
      defaultConfiguration
    ).run()

    const created = await context.env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first()
    return Response.json(mapBusiness(created), { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.id) {
      return Response.json({ error: 'ID do estabelecimento obrigatório' }, { status: 400 })
    }

    await requireBusinessAccess(context.request, context.env.DB, data.id)
    const menuUrl = data.menuUrl !== undefined ? data.menuUrl : (data.menu_url !== undefined ? data.menu_url : null)
    const googleReviewsUrl = data.googleReviewsUrl !== undefined ? data.googleReviewsUrl : (data.google_reviews_url !== undefined ? data.google_reviews_url : null)
    const instagramUrl = data.instagramUrl !== undefined ? data.instagramUrl : (data.instagram_url !== undefined ? data.instagram_url : null)
    const defaultConfiguration = data.default_destination_configuration === undefined
      ? null
      : typeof data.default_destination_configuration === 'string'
        ? data.default_destination_configuration
        : JSON.stringify(data.default_destination_configuration || {})

    await context.env.DB.prepare(`
      UPDATE businesses
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          logo_url = COALESCE(?, logo_url),
          cover_url = COALESCE(?, cover_url),
          phone = COALESCE(?, phone),
          email = COALESCE(?, email),
          website = COALESCE(?, website),
          address = COALESCE(?, address),
          city = COALESCE(?, city),
          state = COALESCE(?, state),
          menu_url = COALESCE(?, menu_url),
          google_reviews_url = COALESCE(?, google_reviews_url),
          instagram_url = COALESCE(?, instagram_url),
          default_destination_type = COALESCE(?, default_destination_type),
          default_target_url = COALESCE(?, default_target_url),
          default_destination_configuration = COALESCE(?, default_destination_configuration),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name ?? null,
      data.description ?? null,
      data.logo_url ?? null,
      data.cover_url ?? null,
      data.phone ?? null,
      data.email ?? null,
      data.website ?? null,
      data.address ?? null,
      data.city ?? null,
      data.state ?? null,
      menuUrl,
      googleReviewsUrl,
      instagramUrl,
      data.default_destination_type ?? null,
      data.default_target_url ?? null,
      defaultConfiguration,
      data.id
    ).run()

    const updated = await context.env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(data.id).first()
    return Response.json(mapBusiness(updated))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return Response.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    await requireBusinessAccess(context.request, context.env.DB, id)
    await context.env.DB.prepare('DELETE FROM businesses WHERE id = ?').bind(id).run()
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

