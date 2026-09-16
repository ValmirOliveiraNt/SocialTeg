interface Env {
  DB: D1Database
}

function parseUserAgent(ua: string): { device: string; os: string; browser: string } {
  let device = 'Mobile'
  if (/iPad|Tablet/i.test(ua)) device = 'Tablet'
  else if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile'
  else device = 'Desktop'

  let os = 'Outro'
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/Win/i.test(ua)) os = 'Windows'
  else if (/Mac/i.test(ua)) os = 'macOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  let browser = 'Outro'
  if (/Edg/i.test(ua)) browser = 'Edge'
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome'
  else if (/Safari/i.test(ua)) browser = 'Safari'
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox'

  return { device, os, browser }
}

function formatScanRow(row: any) {
  let meta: any = {}
  try {
    if (row.ip_hash && row.ip_hash.startsWith('{')) {
      meta = JSON.parse(row.ip_hash)
    }
  } catch {}

  const scanDate = new Date(row.scanned_at || Date.now())
  const tz = meta.timezone || 'America/Sao_Paulo'

  let localDate = meta.local_date
  let localTime = meta.local_time

  if (!localDate || !localTime) {
    try {
      localDate = scanDate.toLocaleDateString('pt-BR', { timeZone: tz, day: '2-digit', month: '2-digit', year: 'numeric' })
      localTime = scanDate.toLocaleTimeString('pt-BR', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      localDate = scanDate.toISOString().split('T')[0]
      localTime = scanDate.toISOString().split('T')[1]?.substring(0, 8) || ''
    }
  }

  const method =
    meta.reading_method ||
    (row.referrer && row.referrer.toLowerCase().includes('qr') ? 'QR Code' : null) ||
    (row.referrer && row.referrer.toLowerCase().includes('nfc') ? 'NFC Aproximação' : null) ||
    'NFC Aproximação'

  return {
    ...row,
    local_date: localDate,
    local_time: localTime,
    timezone: tz,
    reading_method: method,
    screen_resolution: meta.screen || null,
    language: meta.language || 'pt-BR',
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const tagId = url.searchParams.get('tag_id')
  const ownerId = url.searchParams.get('owner_id')

  try {
    if (tagId) {
      const { results } = await context.env.DB.prepare(`
        SELECT s.*, t.name as tag_name, t.location as tag_location, t.serial_number, t.business_id
        FROM tag_scans s
        JOIN nfc_tags t ON s.tag_id = t.id
        WHERE s.tag_id = ?
        ORDER BY s.scanned_at DESC
        LIMIT 500
      `).bind(tagId).all()
      return Response.json((results || []).map(formatScanRow))
    }

    if (ownerId) {
      const { results } = await context.env.DB.prepare(`
        SELECT s.*, t.name as tag_name, t.location as tag_location, t.serial_number, t.business_id
        FROM tag_scans s
        JOIN nfc_tags t ON s.tag_id = t.id
        WHERE t.owner_id = ?
        ORDER BY s.scanned_at DESC
        LIMIT 500
      `).bind(ownerId).all()
      return Response.json((results || []).map(formatScanRow))
    }

    const { results } = await context.env.DB.prepare(`
      SELECT s.*, t.name as tag_name, t.location as tag_location, t.serial_number
      FROM tag_scans s
      LEFT JOIN nfc_tags t ON s.tag_id = t.id
      ORDER BY s.scanned_at DESC
      LIMIT 500
    `).all()
    return Response.json((results || []).map(formatScanRow))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const data: any = await context.request.json()
    const id = 'scan-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)

    const ua = context.request.headers.get('user-agent') || ''
    const parsed = parseUserAgent(ua)

    const cf: any = (context.request as any).cf || {}
    const city = cf.city || context.request.headers.get('cf-ipcity') || data.city || ''
    const region = cf.regionCode || cf.region || context.request.headers.get('cf-region') || data.region || ''
    const country = cf.country || context.request.headers.get('cf-ipcountry') || data.country || 'BR'
    const cfTz = cf.timezone || context.request.headers.get('cf-timezone') || data.timezone || 'America/Sao_Paulo'

    let formattedLocation = ''
    if (city && region) {
      formattedLocation = `${city}, ${region}`
    } else if (city) {
      formattedLocation = city
    } else if (region) {
      formattedLocation = `${region}, ${country}`
    } else {
      formattedLocation = country === 'BR' ? 'Brasil' : country
    }

    const readingMethod = data.reading_method || (data.referrer?.toLowerCase().includes('qr') ? 'QR Code' : 'NFC Aproximação')
    const nowIso = new Date().toISOString()

    const meta = {
      reading_method: readingMethod,
      local_time: data.local_time,
      local_date: data.local_date,
      timezone: cfTz,
      screen: data.screen,
      language: data.language,
    }

    await context.env.DB.prepare(`
      INSERT INTO tag_scans (id, tag_id, scanned_at, destination_type, device_type, operating_system, browser, country, region, referrer, ip_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      data.tag_id,
      nowIso,
      data.destination_type || 'google_review',
      parsed.device,
      parsed.os,
      parsed.browser,
      country,
      formattedLocation,
      readingMethod,
      JSON.stringify(meta)
    ).run()

    return Response.json({ success: true, id }, { status: 201 })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
