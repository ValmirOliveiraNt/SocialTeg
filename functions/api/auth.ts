interface Env {
  DB: D1Database
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder()
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const exported = await crypto.subtle.exportKey('raw', key)
  return {
    hash: bytesToHex(new Uint8Array(exported)),
    salt: bytesToHex(salt),
  }
}

async function verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
  const { hash } = await hashPassword(password, storedSalt)
  if (hash.length !== storedHash.length) return false
  let mismatch = 0
  for (let i = 0; i < hash.length; i++) mismatch |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i)
  return mismatch === 0
}

function validPassword(password: string): boolean {
  return password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password)
}

async function rateLimitKey(request: Request, email: string): Promise<string> {
  const source = `${request.headers.get('cf-connecting-ip') || 'unknown'}:${email}`
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
  return bytesToHex(new Uint8Array(digest))
}

async function checkLoginRateLimit(request: Request, db: D1Database, email: string): Promise<Response | null> {
  const key = await rateLimitKey(request, email)
  const row = await db.prepare('SELECT attempts, window_start, locked_until FROM auth_rate_limits WHERE key = ?').bind(key).first<{ attempts: number; window_start: string; locked_until: string | null }>()
  const now = Date.now()
  if (row?.locked_until && Date.parse(row.locked_until) > now)
    return Response.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((Date.parse(row.locked_until) - now) / 1000)) } })
  if (!row || now - Date.parse(row.window_start) > 15 * 60_000) {
    await db.prepare('INSERT OR REPLACE INTO auth_rate_limits (key, attempts, window_start, locked_until) VALUES (?, 1, ?, NULL)').bind(key, new Date(now).toISOString()).run()
  } else {
    const attempts = Number(row.attempts) + 1
    const lockedUntil = attempts >= 10 ? new Date(now + 15 * 60_000).toISOString() : null
    await db.prepare('UPDATE auth_rate_limits SET attempts = ?, locked_until = ? WHERE key = ?').bind(attempts, lockedUntil, key).run()
    if (lockedUntil) return Response.json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, { status: 429, headers: { 'Retry-After': '900' } })
  }
  return null
}

async function clearLoginRateLimit(request: Request, db: D1Database, email: string) {
  await db.prepare('DELETE FROM auth_rate_limits WHERE key = ?').bind(await rateLimitKey(request, email)).run()
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '').trim()

  try {
    const session: any = await context.env.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.phone, u.role, u.status, u.plan_id, u.created_at, u.updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at) > datetime('now')
    `).bind(token).first()

    if (!session) {
      return Response.json({ error: 'Sessão inválida ou expirada' }, { status: 401 })
    }

    if (session.status === 'blocked') {
      return Response.json({ error: 'Conta bloqueada' }, { status: 403 })
    }

    const user = {
      id: session.user_id,
      name: session.name,
      email: session.email,
      phone: session.phone,
      role: session.role,
      status: session.status,
      plan_id: session.plan_id,
      created_at: session.created_at,
      updated_at: session.updated_at,
    }

    return Response.json({ user })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const action = data.action || 'login'

    if (action === 'logout') {
      const authHeader = context.request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '').trim()
        await context.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run()
      }
      return Response.json({ success: true })
    }

    if (action === 'register') {
      const email = data.email?.trim().toLowerCase()
      const password = data.password || ''
      const name = data.name?.trim()

      if (!email || !name) {
        return Response.json({ error: 'Nome e e-mail são obrigatórios' }, { status: 400 })
      }

      if (!validPassword(password)) {
        return Response.json({ error: 'Use uma senha de pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo.' }, { status: 400 })
      }

      const existing = await context.env.DB.prepare('SELECT id FROM users WHERE lower(email) = ?').bind(email).first()
      if (existing) {
        return Response.json({ error: 'E-mail já cadastrado' }, { status: 409 })
      }

      const { hash, salt } = await hashPassword(password)
      const passwordRecord = `${salt}:${hash}`
      const userId = 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

      await context.env.DB.prepare(`
        INSERT INTO users (id, name, email, phone, password_hash, role, status, plan_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'customer', 'active', 'plan-starter', datetime('now'), datetime('now'))
      `).bind(userId, name, email, data.phone || null, passwordRecord).run()

      const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)))
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()
      const sessionId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

      await context.env.DB.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(sessionId, userId, token, expiresAt).run()

      const user = await context.env.DB.prepare(`
        SELECT id, name, email, phone, role, status, plan_id, created_at, updated_at
        FROM users WHERE id = ?
      `).bind(userId).first()

      return Response.json({ user, token }, { status: 201 })
    }

    if (action === 'login') {
      const email = data.email?.trim().toLowerCase()
      const password = data.password || ''

      if (!email) {
        return Response.json({ error: 'Informe o e-mail' }, { status: 400 })
      }
      const throttled = await checkLoginRateLimit(context.request, context.env.DB, email)
      if (throttled) return throttled

      const userRecord: any = await context.env.DB.prepare(`
        SELECT * FROM users WHERE lower(email) = ?
      `).bind(email).first()

      if (!userRecord) {
        return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })
      }

      if (userRecord.status === 'blocked') {
        return Response.json({ error: 'Conta bloqueada pelo administrador' }, { status: 403 })
      }

      if (userRecord.password_hash && userRecord.password_hash.includes(':')) {
        const [storedSalt, storedHash] = userRecord.password_hash.split(':')
        const isValid = await verifyPassword(password, storedHash, storedSalt)
        if (!isValid) {
          return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })
        }
      } else {
        // Password creation must never happen as part of a login: otherwise any
        // visitor could take over an imported account that has no password yet.
        return Response.json({ error: 'Conta sem senha configurada. Solicite a redefinição de senha ao suporte.' }, { status: 403 })
      }

      await clearLoginRateLimit(context.request, context.env.DB, email)

      const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)))
      const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString()
      const sessionId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

      await context.env.DB.prepare(`
        INSERT INTO sessions (id, user_id, token, expires_at, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `).bind(sessionId, userRecord.id, token, expiresAt).run()
      await context.env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').bind(userRecord.id, sessionId).run()

      delete userRecord.password_hash

      return Response.json({ user: userRecord, token })
    }

    return Response.json({ error: 'Ação não suportada' }, { status: 400 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

