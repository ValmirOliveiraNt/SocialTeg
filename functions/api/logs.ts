interface Env {
  DB: D1Database
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500').all()
    return Response.json(results)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const id = 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

    await context.env.DB.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      id,
      data.user_id || null,
      data.user_email || null,
      data.action,
      data.entity_type,
      data.entity_id,
      data.details || null,
      context.request.headers.get('cf-connecting-ip') || null
    ).run()

    return Response.json({ success: true, id }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
