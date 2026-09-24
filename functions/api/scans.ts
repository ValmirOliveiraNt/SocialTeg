import { requireSession, apiFailure } from '../_lib/session'

interface Env {
  DB: D1Database
}

const RAW_SCAN_RETENTION_DAYS = 90
const MAX_READINGS_PER_TAG = 100

async function pruneScanHistory(db: D1Database, tagId: string) {
  const pageView = `(NOT json_valid(ip_hash)
    OR json_extract(ip_hash, '$.version') != 2
    OR COALESCE(json_extract(ip_hash, '$.event'), 'page_view') = 'page_view')`
  await db.batch([
    db.prepare(
      `DELETE FROM tag_scans
       WHERE julianday(scanned_at) < julianday('now', ?)`
    ).bind(`-${RAW_SCAN_RETENTION_DAYS} days`),
    db.prepare(
      `DELETE FROM tag_scans
       WHERE id IN (
         SELECT id FROM tag_scans
         WHERE tag_id = ? AND ${pageView}
         ORDER BY julianday(scanned_at) DESC, id DESC
         LIMIT -1 OFFSET ?
       )`
    ).bind(tagId, MAX_READINGS_PER_TAG),
  ])
  await db.prepare(
    `DELETE FROM tag_scans AS child
     WHERE child.tag_id = ?
       AND json_valid(child.ip_hash)
       AND json_extract(child.ip_hash, '$.version') = 2
       AND json_extract(child.ip_hash, '$.event') = 'destination_open'
       AND NOT EXISTS (
         SELECT 1 FROM tag_scans AS parent
         WHERE parent.tag_id = child.tag_id
           AND parent.id = 'scan-' || json_extract(child.ip_hash, '$.parent_event_id')
       )`
  ).bind(tagId).run()
}

async function scanRateLimit(request: Request, db: D1Database, tagId: string): Promise<boolean> {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  const source = new TextEncoder().encode(`${ip}:${tagId}`)
  const digest = await crypto.subtle.digest('SHA-256', source)
  const key = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  const now = Date.now()
  const row = await db.prepare('SELECT requests, window_start FROM scan_rate_limits WHERE key = ?').bind(key).first<{ requests: number; window_start: string }>()
  if (!row || now - Date.parse(row.window_start) > 60_000) {
    await db.prepare('INSERT OR REPLACE INTO scan_rate_limits (key, requests, window_start) VALUES (?, 1, ?)').bind(key, new Date(now).toISOString()).run()
    return true
  }
  if (Number(row.requests) >= 60) return false
  await db.prepare('UPDATE scan_rate_limits SET requests = requests + 1 WHERE key = ?').bind(key).run()
  return true
}

export function parseUserAgent(ua: string) {
  const device = !ua
    ? 'Não identificado'
    : /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))
      ? 'Tablet'
      : /Mobi|Android|iPhone/i.test(ua)
        ? 'Mobile'
        : 'Desktop'
  const os = /iPhone|iPad|iPod/i.test(ua)
    ? 'iOS'
    : /Android/i.test(ua)
      ? 'Android'
      : /Win/i.test(ua)
        ? 'Windows'
        : /Mac/i.test(ua)
          ? 'macOS'
          : /Linux/i.test(ua)
            ? 'Linux'
            : 'Não identificado'
  const browser = /Edg/i.test(ua)
    ? 'Edge'
    : /OPR|Opera/i.test(ua)
      ? 'Opera'
      : /Firefox|FxiOS/i.test(ua)
        ? 'Firefox'
        : /Chrome|CriOS/i.test(ua)
          ? 'Chrome'
          : /Safari/i.test(ua)
            ? 'Safari'
            : 'Não identificado'
  return { device, os, browser }
}

function formatScanRow(row: Record<string, any>) {
  let meta: Record<string, any> = {}
  try {
    meta = JSON.parse(row.ip_hash || '{}') || {}
  } catch {}
  const normalized = /[zZ]|[+-]\d{2}:?\d{2}$/.test(row.scanned_at)
    ? row.scanned_at
    : row.scanned_at.replace(' ', 'T') + 'Z'
  const scanned = new Date(normalized)
  let timezone =
    typeof meta.timezone === 'string' ? meta.timezone : 'America/Sao_Paulo'
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: timezone })
  } catch {
    timezone = 'America/Sao_Paulo'
  }
  const { ip_hash: _metadata, ...safe } = row
  return {
    ...safe,
    region: String(row.region || '').trim(),
    location_precision: meta.location_precision || 'ip_state',
    timezone,
    local_date: scanned.toLocaleDateString('pt-BR', { timeZone: timezone }),
    local_time: scanned.toLocaleTimeString('pt-BR', { timeZone: timezone }),
    reading_method:
      meta.version === 2
        ? {
            nfc: 'NFC Aproximação',
            qr: 'QR Code',
            direct: 'Link direto',
            nfc_legacy: 'NFC provável / link antigo',
          }[meta.reading_method] ||
          'Não identificada'
        : 'Legado / não verificado',
    screen_resolution: meta.screen || null,
    language: meta.language || null,
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireSession(request, env.DB)
    const url = new URL(request.url)
    const tagId = url.searchParams.get('tag_id')
    const ownerId =
      user.role === 'admin' ? url.searchParams.get('owner_id') : user.id
    const filters: string[] = []
    const params: string[] = []
    if (tagId) {
      filters.push('s.tag_id = ?')
      params.push(tagId)
    }
    if (ownerId) {
      filters.push('t.owner_id = ?')
      params.push(ownerId)
    }
    const { results } = await env.DB.prepare(
      `
      SELECT s.*, t.name as tag_name, t.location as tag_location, t.serial_number, t.business_id
      FROM tag_scans s JOIN nfc_tags t ON s.tag_id = t.id
      ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''}
      ORDER BY julianday(s.scanned_at) DESC LIMIT 500
    `,
    )
      .bind(...params)
      .all()
    return Response.json((results || []).map(formatScanRow), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return apiFailure(error)
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data: any = await request.json()
    if (!data || typeof data.tag_id !== 'string' || data.tag_id.length > 200)
      return Response.json({ error: 'Tag inválida' }, { status: 400 })
    if (
      data.event_id !== undefined &&
      (typeof data.event_id !== 'string' ||
        !/^[0-9a-f-]{36}$/i.test(data.event_id))
    )
      return Response.json({ error: 'Evento inválido' }, { status: 400 })
    const tagRow = await env.DB.prepare(
      `SELECT t.id, t.configuration_mode, b.default_destination_type, b.default_target_url,
        (SELECT d.type FROM tag_destinations d WHERE d.tag_id = t.id AND d.is_active = 1 ORDER BY datetime(d.updated_at) DESC LIMIT 1) AS tag_destination_type,
        (SELECT d.target_url FROM tag_destinations d WHERE d.tag_id = t.id AND d.is_active = 1 ORDER BY datetime(d.updated_at) DESC LIMIT 1) AS tag_target_url
      FROM nfc_tags t
      LEFT JOIN businesses b ON b.id = t.business_id
      WHERE t.id = ? AND t.status = 'active'`,
    )
      .bind(data.tag_id)
      .first<{
        id: string
        configuration_mode: string | null
        default_destination_type: string | null
        default_target_url: string | null
        tag_destination_type: string | null
        tag_target_url: string | null
      }>()
    const usesBusiness = tagRow?.configuration_mode !== 'custom' && Boolean(tagRow?.default_target_url)
    const destinationType = usesBusiness ? tagRow?.default_destination_type : tagRow?.tag_destination_type
    const targetUrl = usesBusiness ? tagRow?.default_target_url : tagRow?.tag_target_url
    const tag = tagRow && destinationType && targetUrl ? { id: tagRow.id, type: destinationType } : null
    if (!tag)
      return Response.json(
        { error: 'Tag ou destino indisponível' },
        { status: 404 },
      )
    if (!(await scanRateLimit(request, env.DB, tag.id)))
      return Response.json({ error: 'Muitas leituras. Tente novamente em instantes.' }, { status: 429, headers: { 'Retry-After': '60' } })
    const parsed = parseUserAgent(request.headers.get('user-agent') || '')
    const cf = request.cf || ({} as Record<string, any>)
    const text = (value: unknown, max = 120) =>
      typeof value === 'string' ? value.slice(0, max) : ''
    const country = text(cf.country)
    const city = text(cf.city)
    const regionCode = text(cf.regionCode)
    const regionName = text(cf.region)
    // Cloudflare derives these values from the visitor's network IP. Prefer
    // city/UF when available, while keeping a clear fallback for older or less
    // precise carrier networks.
    const region = city
      ? `${city}/${regionCode || regionName}`
      : [regionName || regionCode, country].filter(Boolean).join(', ')
    const source = text(data.reading_method)
    const readingMethod =
      source === 'qr' || source === 'QR Code'
        ? 'qr'
        : source === 'nfc' || source === 'NFC Aproximação'
          ? 'nfc'
          : source === 'direct' || source === 'Link direto'
            ? 'direct'
            : source === 'NFC provável / link antigo'
              ? 'nfc_legacy'
          : 'unknown'
    const id = data.event_id
      ? 'scan-' + data.event_id
      : 'scan-' + crypto.randomUUID()
    const eventType =
      data.event_type === 'destination_open' ? 'destination_open' : 'page_view'
    const parentEventId =
      eventType === 'destination_open' &&
      typeof data.parent_event_id === 'string' &&
      /^[0-9a-f-]{36}$/i.test(data.parent_event_id)
        ? data.parent_event_id
        : null
    const clickedDestination = [
      'google_review',
      'instagram',
      'whatsapp',
      'website',
      'contact',
      'address',
      'ifood',
      'youtube',
      'wifi',
      'custom_url',
    ].includes(data.destination_type)
      ? data.destination_type
      : tag.type
    const meta = {
      version: data.telemetry_version === 2 ? 2 : 1,
      event: eventType,
      parent_event_id: parentEventId,
      reading_method: readingMethod,
      timezone: text(cf.timezone || data.timezone),
      screen: text(data.screen, 40),
      language: text(data.language, 40),
      location_precision: city ? 'ip_city' : 'ip_state',
    }
    // Repeated submissions of the same page opening are idempotent, without tracking individual visitors.
    await env.DB.prepare(
      `INSERT OR IGNORE INTO tag_scans
      (id, tag_id, scanned_at, destination_type, device_type, operating_system, browser, country, region, referrer, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        tag.id,
        new Date().toISOString(),
        eventType === 'destination_open' ? clickedDestination : tag.type,
        parsed.device,
        parsed.os,
        parsed.browser,
        country,
        region,
        text(data.referrer, 500),
        JSON.stringify(meta),
      )
      .run()
    await pruneScanHistory(env.DB, tag.id)
    return Response.json({ success: true, id }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json({ error: 'JSON inválido' }, { status: 400 })
    return apiFailure(error)
  }
}
