interface Env {
  DB: D1Database
}

function mapBusiness(b: any) {
  if (!b) return null
  return {
    ...b,
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

  try {
    if (id) {
      const biz = await context.env.DB.prepare('SELECT * FROM businesses WHERE id = ?').bind(id).first()
      return Response.json(mapBusiness(biz))
    }

    if (ownerId) {
      const { results } = await context.env.DB.prepare('SELECT * FROM businesses WHERE owner_id = ? ORDER BY created_at DESC').bind(ownerId).all()
      return Response.json((results as any[]).map(mapBusiness))
    }

    const { results } = await context.env.DB.prepare('SELECT * FROM businesses ORDER BY created_at DESC').all()
    return Response.json((results as any[]).map(mapBusiness))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const id = data.id || 'b-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    const menuUrl = data.menuUrl || data.menu_url || null
    const googleReviewsUrl = data.googleReviewsUrl || data.google_reviews_url || null
    const instagramUrl = data.instagramUrl || data.instagram_url || null

    await context.env.DB.prepare(`
      INSERT INTO businesses (
        id, owner_id, name, description, logo_url, cover_url, phone, email, website,
        address, city, state, country, menu_url, google_reviews_url, instagram_url,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id,
      data.owner_id,
      data.name,
      data.description || '',
      data.logo_url || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=200&h=200&fit=crop',
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
      instagramUrl
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

    const menuUrl = data.menuUrl !== undefined ? data.menuUrl : (data.menu_url !== undefined ? data.menu_url : null)
    const googleReviewsUrl = data.googleReviewsUrl !== undefined ? data.googleReviewsUrl : (data.google_reviews_url !== undefined ? data.google_reviews_url : null)
    const instagramUrl = data.instagramUrl !== undefined ? data.instagramUrl : (data.instagram_url !== undefined ? data.instagram_url : null)

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
    await context.env.DB.prepare('DELETE FROM businesses WHERE id = ?').bind(id).run()
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

