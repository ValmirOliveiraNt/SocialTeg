import { requireSession, apiFailure } from '../_lib/session'

interface Env {
  DB: D1Database
}
// Business reporting uses a fixed, explicit timezone; all stored timestamps are UTC.
const OFFSET = 3 * 60 * 60 * 1000
const DAY = 86400000
export function reportingWindow(now: Date, days: number) {
  const local = new Date(now.getTime() - OFFSET)
  const today =
    Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) +
    OFFSET
  const start = today - (days - 1) * DAY
  return {
    today,
    start,
    previous: start - days * DAY,
    previousEnd: now.getTime() - days * DAY,
    end: now.getTime(),
  }
}

const metadata = `CASE WHEN json_valid(s.ip_hash) THEN s.ip_hash ELSE '{}' END`
const method = `CASE WHEN json_extract(${metadata}, '$.version') = 2 THEN
  CASE json_extract(${metadata}, '$.reading_method') WHEN 'nfc' THEN 'NFC' WHEN 'qr' THEN 'QR Code' ELSE 'Não identificada' END
  ELSE 'Legado / não verificado' END`

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const user = await requireSession(request, env.DB)
    const url = new URL(request.url)
    const days = Number(url.searchParams.get('days') || 30)
    if (![7, 30, 90].includes(days))
      return Response.json({ error: 'Período inválido' }, { status: 400 })
    const admin = user.role === 'admin'
    const businessId = url.searchParams.get('business_id') || ''
    const now = new Date()
    const w = reportingWindow(now, days)
    const iso = (n: number) => new Date(n).toISOString()
    const conditions = [admin ? '1 = 1' : 't.owner_id = ?']
    const scope: string[] = admin ? [] : [user.id]
    if (businessId) {
      conditions.push('t.business_id = ?')
      scope.push(businessId)
    }
    const where = conditions.join(' AND ')
    const from = `FROM tag_scans s JOIN nfc_tags t ON t.id = s.tag_id LEFT JOIN businesses b ON b.id = t.business_id WHERE ${where}`
    const period = ` AND julianday(s.scanned_at) >= julianday(?) AND julianday(s.scanned_at) <= julianday(?)`
    const current = [...scope, iso(w.start), iso(w.end)]
    const statement = (sql: string, values: (string | number)[] = []) =>
      env.DB.prepare(sql).bind(...values)
    const group = (expression: string) =>
      statement(
        `SELECT ${expression} AS label, COUNT(*) AS total ${from}${period} GROUP BY label ORDER BY total DESC, label`,
        current,
      )
    const results = await env.DB.batch([
      statement(
        `SELECT COUNT(*) AS total, COUNT(DISTINCT s.tag_id) AS active_tags,
        COALESCE(SUM(CASE WHEN ${method} IN ('NFC','QR Code') THEN 1 ELSE 0 END),0) AS identified,
        COALESCE(SUM(CASE WHEN ${method} = 'Legado / não verificado' THEN 1 ELSE 0 END),0) AS legacy,
        COALESCE(SUM(CASE WHEN julianday(s.scanned_at) >= julianday(?) THEN 1 ELSE 0 END),0) AS today ${from}${period}`,
        [iso(w.today), ...current],
      ),
      statement(`SELECT COUNT(*) AS total ${from}${period}`, [
        ...scope,
        iso(w.previous),
        iso(w.previousEnd),
      ]),
      statement(
        `SELECT date(s.scanned_at, '-3 hours') AS date, COUNT(*) AS total ${from}${period} GROUP BY date ORDER BY date`,
        current,
      ),
      statement(
        `SELECT CAST(strftime('%H', s.scanned_at, '-3 hours') AS INTEGER) AS hour, COUNT(*) AS total ${from}${period} GROUP BY hour`,
        current,
      ),
      group(method),
      group(`COALESCE(NULLIF(s.operating_system,''), 'Não identificado')`),
      group(`COALESCE(NULLIF(s.destination_type,''), 'Não informado')`),
      group(`COALESCE(NULLIF(s.region,''), 'Não informada')`),
      statement(
        `SELECT t.id, t.name, t.location, t.status, b.name AS business, COUNT(s.id) AS total, MAX(s.scanned_at) AS last_scan
        FROM nfc_tags t LEFT JOIN businesses b ON b.id = t.business_id LEFT JOIN tag_scans s ON s.tag_id = t.id
        AND julianday(s.scanned_at) >= julianday(?) AND julianday(s.scanned_at) <= julianday(?)
        WHERE ${where} GROUP BY t.id ORDER BY total DESC, t.name LIMIT 10`,
        [iso(w.start), iso(w.end), ...scope],
      ),
      statement(
        `SELECT s.id, s.scanned_at, t.name, t.location, s.operating_system, s.browser, s.region, s.destination_type, ${method} AS method
        ${from}${period} ORDER BY julianday(s.scanned_at) DESC, s.id DESC LIMIT 20`,
        current,
      ),
      statement(
        `SELECT COUNT(*) AS tags, COALESCE(SUM(t.status = 'active'),0) AS active,
        COALESCE(SUM(t.status IN ('pending_activation','sold','reserved')),0) AS pending,
        COALESCE(SUM(t.status = 'active' AND NOT EXISTS (SELECT 1 FROM tag_scans s WHERE s.tag_id = t.id
          AND julianday(s.scanned_at) >= julianday(?) AND julianday(s.scanned_at) <= julianday(?))),0) AS silent
        FROM nfc_tags t WHERE ${where}`,
        [iso(w.start), iso(w.end), ...scope],
      ),
      statement(
        `SELECT id, name FROM businesses ${admin ? '' : 'WHERE owner_id = ?'} ORDER BY name`,
        admin ? [] : [user.id],
      ),
      ...(admin
        ? [
            statement(
              `SELECT COUNT(*) AS customers, COALESCE(SUM(status = 'active'),0) AS active_customers FROM users WHERE role = 'customer'`,
            ),
            statement(
              `SELECT COALESCE(SUM(CASE WHEN payment_status = 'approved' AND status != 'cancelled' THEN total ELSE 0 END),0) AS revenue,
          COALESCE(SUM(payment_status = 'approved' AND status != 'cancelled'),0) AS approved
          FROM orders WHERE julianday(created_at) >= julianday(?) AND julianday(created_at) <= julianday(?)`,
              [iso(w.start), iso(w.end)],
            ),
            statement(
              `SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE payment_status = 'approved' AND status != 'cancelled'
          AND julianday(created_at) >= julianday(?) AND julianday(created_at) <= julianday(?)`,
              [iso(w.previous), iso(w.previousEnd)],
            ),
            statement(`SELECT COALESCE(SUM(payment_status = 'pending' AND status != 'cancelled'),0) AS pending_orders,
          COALESCE(SUM(payment_status = 'approved' AND status IN ('paid','pending')),0) AS awaiting_shipping FROM orders`),
            statement(
              `SELECT id, user_name, total, payment_status, status, created_at FROM orders ORDER BY julianday(created_at) DESC LIMIT 5`,
            ),
          ]
        : []),
    ])
    const rows = (i: number) => results[i].results as Record<string, any>[]
    const first = (i: number) => rows(i)[0] || {}
    const timelineMap = new Map(rows(2).map((r) => [r.date, r.total]))
    const hoursMap = new Map(rows(3).map((r) => [r.hour, r.total]))
    return Response.json(
      {
        generated_at: now.toISOString(),
        days,
        timezone: 'America/Sao_Paulo',
        start: iso(w.start),
        end: iso(w.end),
        summary: { ...first(0), previous: first(1).total },
        timeline: Array.from({ length: days }, (_, i) => {
          const date = iso(w.start - OFFSET + i * DAY).slice(0, 10)
          return { date, total: timelineMap.get(date) || 0 }
        }),
        hours: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          total: hoursMap.get(hour) || 0,
        })),
        methods: rows(4),
        systems: rows(5),
        destinations: rows(6),
        regions: rows(7),
        ranking: rows(8),
        recent: rows(9),
        inventory: {
          ...first(10),
          businesses: businessId
            ? rows(11).filter((b) => b.id === businessId).length
            : rows(11).length,
        },
        businesses: rows(11),
        admin: admin
          ? {
              ...first(12),
              ...first(13),
              previous_revenue: first(14).revenue,
              ...first(15),
              average_ticket: first(13).approved
                ? first(13).revenue / first(13).approved
                : 0,
              recent_orders: rows(16),
            }
          : null,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return apiFailure(error)
  }
}
