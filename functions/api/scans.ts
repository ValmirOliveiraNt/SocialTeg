import { requireSession, apiFailure } from '../_lib/session'

interface Env {
  DB: D1Database
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
  const regionParts = String(row.region || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  // Older records may contain city, state and country. City-level IP data is
  // too imprecise for mobile networks, so expose only the broader estimate.
  const broadRegion =
    regionParts.length >= 3 ? regionParts.slice(-2).join(', ') : regionParts.join(', ')
  return {
    ...safe,
    region: broadRegion,
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
    const tag = await env.DB.prepare(
      `SELECT t.id, d.type FROM nfc_tags t JOIN tag_destinations d ON d.tag_id = t.id
      WHERE t.id = ? AND t.status = 'active' AND d.is_active = 1 ORDER BY d.updated_at DESC LIMIT 1`,
    )
      .bind(data.tag_id)
      .first<{ id: string; type: string }>()
    if (!tag)
      return Response.json(
        { error: 'Tag ou destino indisponível' },
        { status: 404 },
      )
    const parsed = parseUserAgent(request.headers.get('user-agent') || '')
    const cf = request.cf || ({} as Record<string, any>)
    const text = (value: unknown, max = 120) =>
      typeof value === 'string' ? value.slice(0, max) : ''
    const country = text(cf.country)
    // IP geolocation can point to a mobile carrier or ISP gateway in another
    // city. Keep only the broader state/country estimate and never present it
    // as the tag's physical location.
    const region = [text(cf.region || cf.regionCode), country]
      .filter(Boolean)
      .join(', ')
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
    return Response.json({ success: true, id }, { status: 201 })
  } catch (error) {
    if (error instanceof SyntaxError)
      return Response.json({ error: 'JSON inválido' }, { status: 400 })
    return apiFailure(error)
  }
}

