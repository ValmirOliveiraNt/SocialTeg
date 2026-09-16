interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const tagId = url.searchParams.get('tag_id')

  try {
    if (tagId) {
      const dest = await context.env.DB.prepare('SELECT * FROM tag_destinations WHERE tag_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1').bind(tagId).first()
      return Response.json(dest || null)
    }

    const { results } = await context.env.DB.prepare('SELECT * FROM tag_destinations').all()
    return Response.json(results)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    if (!data.tag_id || !data.target_url) {
      return Response.json({ error: 'tag_id e target_url são obrigatórios' }, { status: 400 })
    }

    const existing = await context.env.DB.prepare('SELECT id FROM tag_destinations WHERE tag_id = ?').bind(data.tag_id).first()
    const configStr = typeof data.configuration === 'string' ? data.configuration : JSON.stringify(data.configuration || {})

    if (existing) {
      await context.env.DB.prepare(`
        UPDATE tag_destinations
        SET type = ?, title = ?, target_url = ?, configuration = ?, is_active = 1, updated_at = datetime('now')
        WHERE tag_id = ?
      `).bind(data.type || 'google_review', data.title || 'Google Avaliações', data.target_url, configStr, data.tag_id).run()

      const updated = await context.env.DB.prepare('SELECT * FROM tag_destinations WHERE tag_id = ?').bind(data.tag_id).first()
      return Response.json(updated)
    } else {
      const id = 'dest-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
      await context.env.DB.prepare(`
        INSERT INTO tag_destinations (id, tag_id, type, title, target_url, configuration, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).bind(id, data.tag_id, data.type || 'google_review', data.title || 'Google Avaliações', data.target_url, configStr).run()

      const created = await context.env.DB.prepare('SELECT * FROM tag_destinations WHERE id = ?').bind(id).first()
      return Response.json(created, { status: 201 })
    }
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
