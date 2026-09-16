interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const ownerId = url.searchParams.get('owner_id')
  const tagId = url.searchParams.get('id')
  const publicId = url.searchParams.get('public_id')
  const serial = url.searchParams.get('serial')

  try {
    if (tagId) {
      const tag = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE id = ?').bind(tagId).first()
      return Response.json(tag || null)
    }

    if (publicId) {
      const tag = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE lower(public_id) = lower(?)').bind(publicId.trim()).first()
      return Response.json(tag || null)
    }

    if (serial) {
      const tag = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE lower(replace(serial_number, " ", "")) = lower(replace(?, " ", ""))').bind(serial.trim()).first()
      return Response.json(tag || null)
    }

    if (ownerId) {
      const { results } = await context.env.DB.prepare('SELECT * FROM nfc_tags WHERE owner_id = ? ORDER BY created_at DESC').bind(ownerId).all()
      return Response.json(results)
    }

    const { results } = await context.env.DB.prepare('SELECT * FROM nfc_tags ORDER BY created_at DESC').all()
    return Response.json(results)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
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
    if (!data.id) {
      return Response.json({ error: 'ID da Tag obrigatório' }, { status: 400 })
    }

    await context.env.DB.prepare(`
      UPDATE nfc_tags 
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          status = COALESCE(?, status),
          owner_id = COALESCE(?, owner_id),
          business_id = COALESCE(?, business_id),
          activated_at = COALESCE(?, activated_at),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      data.name ?? null,
      data.location ?? null,
      data.status ?? null,
      data.owner_id ?? null,
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
    await context.env.DB.prepare('DELETE FROM nfc_tags WHERE id = ?').bind(id).run()
    return Response.json({ success: true })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
