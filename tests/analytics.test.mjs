import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { readFileSync } from 'node:fs'
import { registerHooks, stripTypeScriptTypes } from 'node:module'

registerHooks({
  resolve(specifier, context, next) {
    if (
      specifier.startsWith('.') &&
      context.parentURL?.includes('/functions/') &&
      !specifier.endsWith('.ts')
    )
      specifier += '.ts'
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('.ts'))
      return {
        format: 'module',
        shortCircuit: true,
        source: stripTypeScriptTypes(readFileSync(new URL(url), 'utf8')),
      }
    return next(url, context)
  },
})
const { onRequestGet: analytics, reportingWindow } =
  await import('../functions/api/analytics.ts')
const {
  onRequestGet: history,
  onRequestPost: record,
  parseUserAgent,
} = await import('../functions/api/scans.ts')

function setup() {
  const sqlite = new DatabaseSync(':memory:')
  sqlite.exec(readFileSync(new URL('../schema.sql', import.meta.url), 'utf8'))
  sqlite.exec(`CREATE TABLE sessions (token TEXT, user_id TEXT, expires_at TEXT);
    INSERT INTO users(id,name,email,role,status) VALUES ('a','Ana','a@example.test','customer','active'), ('b','Bruno','b@example.test','customer','active'), ('blocked','Blocked','blocked@example.test','customer','blocked');
    INSERT INTO sessions VALUES ('a','a','2099-01-01'), ('b','b','2099-01-01'), ('admin','u-admin','2099-01-01'), ('blocked','blocked','2099-01-01'), ('expired','a','2000-01-01');
    INSERT INTO businesses(id,owner_id,name) VALUES ('ba','a','Loja A'), ('bb','b','Loja B');
    INSERT INTO nfc_tags(id,public_id,serial_number,name,status,owner_id,business_id) VALUES ('ta','pa','sa','Tag A','active','a','ba'), ('tb','pb','sb','Tag B','active','b','bb'), ('silent','ps','ss','Sem movimento','active','a','ba');
    INSERT INTO tag_destinations(id,tag_id,title,target_url,type) VALUES ('da','ta','Site','https://example.test','website');`)
  const DB = {
    prepare(sql) {
      let args = []
      return {
        bind(...values) {
          args = values
          return this
        },
        async first() {
          return sqlite.prepare(sql).get(...args) || null
        },
        async all() {
          return { results: sqlite.prepare(sql).all(...args), success: true }
        },
        async run() {
          return sqlite.prepare(sql).run(...args)
        },
      }
    },
    async batch(statements) {
      return Promise.all(statements.map((s) => s.all()))
    },
  }
  const request = (token = 'a', query = '') => ({
    request: new Request('https://example.test/api/analytics?' + query, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
    env: { DB },
  })
  const insert = (id, tag, time, meta = { version: 2, reading_method: 'qr' }) =>
    sqlite
      .prepare(
        'INSERT INTO tag_scans(id,tag_id,scanned_at,destination_type,operating_system,ip_hash) VALUES (?,?,?,?,?,?)',
      )
      .run(id, tag, time, 'website', 'Android', JSON.stringify(meta))
  return { sqlite, DB, request, insert }
}

test('reporting window handles Brasília midnight, year boundary and equal elapsed comparison', () => {
  const w = reportingWindow(new Date('2026-01-01T02:30:00Z'), 7)
  assert.equal(new Date(w.today).toISOString(), '2025-12-31T03:00:00.000Z')
  assert.equal(new Date(w.start).toISOString(), '2025-12-25T03:00:00.000Z')
  assert.equal(w.end - w.start, w.previousEnd - w.previous)
})

test('aggregates more than 500 events and isolates customer, business, dates and recent limit', async () => {
  const f = setup()
  const now = new Date()
  const w = reportingWindow(now, 7)
  for (let i = 0; i < 601; i++)
    f.insert('s' + i, 'ta', new Date(now.getTime() - 1000).toISOString())
  f.insert('other', 'tb', now.toISOString())
  f.insert('past', 'ta', new Date(w.previous + 1000).toISOString())
  f.insert('old', 'ta', '2020-01-01 00:00:00')
  f.insert('future', 'ta', '2099-01-01T00:00:00Z')
  const data = await (
    await analytics(f.request('a', 'days=7&owner_id=b'))
  ).json()
  assert.equal(data.summary.total, 601)
  assert.equal(data.summary.previous, 1)
  assert.equal(data.summary.identified, 601)
  assert.equal(data.summary.active_tags, 1)
  assert.equal(data.inventory.silent, 1)
  assert.equal(data.recent.length, 20)
  assert.equal(data.timeline.length, 7)
  assert.equal(
    data.timeline.reduce((sum, d) => sum + d.total, 0),
    601,
  )
  assert.equal(
    data.hours.reduce((sum, d) => sum + d.total, 0),
    601,
  )
  assert.equal(data.admin, null)
  assert.deepEqual(
    data.businesses.map((b) => b.id),
    ['ba'],
  )
  const forbiddenBusiness = await (
    await analytics(f.request('a', 'business_id=bb'))
  ).json()
  assert.equal(forbiddenBusiness.summary.total, 0)
  assert.equal(forbiddenBusiness.inventory.tags, 0)
  f.sqlite.close()
})

test('empty and legacy data do not invent values or classify old NFC claims as verified', async () => {
  const f = setup()
  const empty = await (await analytics(f.request())).json()
  assert.equal(empty.summary.total, 0)
  assert.deepEqual(empty.systems, [])
  assert.equal(empty.hours.length, 24)
  f.insert('legacy', 'ta', new Date().toISOString(), {
    reading_method: 'NFC Aproximação',
  })
  const data = await (await analytics(f.request())).json()
  assert.equal(data.summary.identified, 0)
  assert.equal(data.summary.legacy, 1)
  f.sqlite.close()
})

test('admin revenue counts only approved noncancelled orders; active customers exclude admin', async () => {
  const f = setup()
  const insert = f.sqlite.prepare(
    `INSERT INTO orders(id,user_id,user_name,user_email,status,subtotal,total,payment_status,shipping_address,created_at) VALUES (?,'a','Ana','a@example.test',?,100,100,?,'{}',?)`,
  )
  const now = new Date().toISOString()
  insert.run('paid', 'paid', 'approved', now)
  insert.run('pending', 'pending', 'pending', now)
  insert.run('refunded', 'delivered', 'refunded', now)
  insert.run('cancelled', 'cancelled', 'approved', now)
  const data = await (await analytics(f.request('admin'))).json()
  assert.equal(data.admin.revenue, 100)
  assert.equal(data.admin.approved, 1)
  assert.equal(data.admin.average_ticket, 100)
  assert.equal(data.admin.active_customers, 2)
  assert.equal(data.admin.awaiting_shipping, 1)
  assert.equal(data.admin.pending_orders, 1)
  f.sqlite.close()
})

test('authentication and period validation reject missing, expired or blocked sessions', async () => {
  const f = setup()
  for (const [token, status] of [
    ['', 401],
    ['expired', 401],
    ['blocked', 403],
  ])
    assert.equal((await analytics(f.request(token))).status, status)
  assert.equal((await analytics(f.request('a', 'days=365'))).status, 400)
  assert.equal((await history(f.request(''))).status, 401)
  f.sqlite.close()
})

test('scan history cannot be accessed with another customer owner or tag id', async () => {
  const f = setup()
  f.insert('bscan', 'tb', new Date().toISOString())
  const data = await (
    await history(f.request('a', 'tag_id=tb&owner_id=b'))
  ).json()
  assert.deepEqual(data, [])
  f.sqlite.close()
})

test('collection is idempotent, uses server destination, and leaves missing location/source unknown', async () => {
  const f = setup()
  const payload = {
    tag_id: 'ta',
    telemetry_version: 2,
    event_id: '12345678-1234-4234-8234-123456789abc',
    destination_type: 'google_review',
    country: 'BR',
    city: 'São Paulo',
  }
  const call = (body) =>
    record({
      request: new Request('https://example.test/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
      env: { DB: f.DB },
    })
  assert.equal((await call(payload)).status, 201)
  assert.equal((await call(payload)).status, 201)
  const rows = f.sqlite.prepare('SELECT * FROM tag_scans').all()
  assert.equal(rows.length, 1)
  assert.equal(rows[0].destination_type, 'website')
  assert.equal(rows[0].region, '')
  assert.equal(rows[0].country, '')
  assert.equal(JSON.parse(rows[0].ip_hash).reading_method, 'unknown')
  assert.equal((await call({ ...payload, tag_id: 'missing' })).status, 404)
  assert.equal((await call({ ...payload, event_id: 'bad' })).status, 400)
  f.sqlite.exec("UPDATE nfc_tags SET status = 'blocked' WHERE id = 'ta'")
  assert.equal((await call(payload)).status, 404)
  f.sqlite.close()
})

test('Firefox iOS and Android tablets are classified correctly', () => {
  assert.equal(
    parseUserAgent('Mozilla iPhone FxiOS/100 Safari/604').browser,
    'Firefox',
  )
  assert.equal(parseUserAgent('Mozilla Android 12 Chrome/100').device, 'Tablet')
  assert.equal(parseUserAgent('').device, 'Não identificado')
})
