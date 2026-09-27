interface Env { DB: D1Database; SYNCPAY_WEBHOOK_SECRET?: string; SYNCPAY_CASHIN_WEBHOOK_SECRET?: string }

function hex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function base64(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let mismatch = 0
  for (let index = 0; index < left.length; index++) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return mismatch === 0
}

export async function validSignature(raw: string, signature: string | null, authorization: string | null, configuredSecrets?: string) {
  const secrets = (configuredSecrets || '').split(',').map((value) => value.trim()).filter(Boolean)
  if (!secrets.length) return false

  const bearer = authorization?.replace(/^Bearer\s+/i, '').trim()
  if (bearer && secrets.some((secret) => safeEqual(secret, bearer))) return true
  if (!signature) return false

  const timestamp = signature.match(/(?:^|,)\s*t=(\d+)/)?.[1]
  const versioned = signature.match(/(?:^|,)\s*v1=([a-z0-9+/=]+)/i)?.[1]
  if (timestamp && versioned) {
    const age = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
    if (!Number.isFinite(age) || age > 300) return false
    for (const secret of secrets) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`))
      if (safeEqual(hex(digest).toLowerCase(), versioned.toLowerCase()) || safeEqual(base64(digest), versioned)) return true
    }
    return false
  }

  const received = signature.replace(/^sha256=/i, '').trim()
  for (const secret of secrets) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(raw))
    if (safeEqual(hex(digest).toLowerCase(), received.toLowerCase()) || safeEqual(base64(digest), received)) return true
  }
  return false
}

export function classifySyncPayTransaction(status: unknown, event: unknown) {
  const normalizedStatus = String(status || '').toLowerCase()
  const normalizedEvent = String(event || '').toLowerCase()
  return {
    status: normalizedStatus,
    paid: ['completed', 'paid', 'approved'].includes(normalizedStatus) || ['cashin_paid', 'pix_paid'].includes(normalizedEvent),
    failed: ['failed', 'refused', 'cancelled', 'canceled', 'expired'].includes(normalizedStatus),
    refunded: ['refunded', 'refund', 'chargeback'].includes(normalizedStatus),
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const raw = await context.request.text()
  const signature = context.request.headers.get('X-Webhook-Signature') || context.request.headers.get('X-SyncPay-Signature')
  const authorization = context.request.headers.get('Authorization')
  const webhookSecrets = [context.env.SYNCPAY_WEBHOOK_SECRET, context.env.SYNCPAY_CASHIN_WEBHOOK_SECRET].filter(Boolean).join(',')
  if (!await validSignature(raw, signature, authorization, webhookSecrets))
    return Response.json({ error: 'Assinatura inválida.' }, { status: 401 })

  let payload: any
  try { payload = JSON.parse(raw) } catch { return Response.json({ error: 'JSON inválido.' }, { status: 400 }) }
  const digest = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)))
  const eventId = String(payload.id || payload.event_id || digest)
  const existing = await context.env.DB.prepare('SELECT id FROM webhook_events WHERE id = ?').bind(eventId).first()
  if (existing) return Response.json({ received: true, duplicate: true })

  const event = String(payload.event || payload.type || '')
  const data = payload.data || payload
  const transaction = data.transaction || payload.transaction || {}
  const transactionId = data.identifier || data.transaction_id || data.reference_id || data.id || transaction.identifier || transaction.reference_id
  const transactionAmount = Number(data.amount ?? transaction.amount)
  const { paid, failed, refunded } = classifySyncPayTransaction(data.status || transaction.status, event)

  if (transactionId) {
    const order: any = await context.env.DB.prepare('SELECT id,total,payment_status FROM orders WHERE provider_transaction_id=?').bind(String(transactionId)).first()
    if (order) {
      if (paid && (!Number.isFinite(transactionAmount) || Math.abs(Number(order.total) - transactionAmount) > 0.01))
        return Response.json({ error: 'Valor da transação não corresponde ao pedido.' }, { status: 409 })

      if (paid && order.payment_status === 'pending') {
        const { results: items } = await context.env.DB.prepare('SELECT product_id,quantity FROM order_items WHERE order_id=?').bind(order.id).all<any>()
        await context.env.DB.batch([
          ...items.map((item) => context.env.DB.prepare(`UPDATE products SET stock=MAX(0,stock-?),updated_at=datetime('now')
            WHERE id=? AND EXISTS (SELECT 1 FROM orders WHERE id=? AND payment_status='pending')`).bind(item.quantity, item.product_id, order.id)),
          context.env.DB.prepare(`UPDATE orders SET payment_status='approved',status='paid',paid_at=datetime('now'),updated_at=datetime('now')
            WHERE id=? AND payment_status='pending'`).bind(order.id),
        ])
      } else if (failed && order.payment_status === 'pending') {
        await context.env.DB.prepare(`UPDATE orders SET payment_status='failed',status='cancelled',updated_at=datetime('now') WHERE id=? AND payment_status='pending'`).bind(order.id).run()
      } else if (refunded && order.payment_status === 'approved') {
        await context.env.DB.prepare(`UPDATE orders SET payment_status='refunded',status='cancelled',updated_at=datetime('now') WHERE id=?`).bind(order.id).run()
      }
      await context.env.DB.prepare('INSERT INTO webhook_events (id, provider, event_type, received_at) VALUES (?, ?, ?, datetime(\'now\'))')
        .bind(eventId, 'syncpay', event).run()
      return Response.json({ received: true })
    }

    const plateOrder: any = await context.env.DB.prepare('SELECT id,total,payment_status FROM plate_orders WHERE provider_transaction_id=?').bind(String(transactionId)).first()
    if (plateOrder) {
      if (paid && (!Number.isFinite(transactionAmount) || Math.abs(Number(plateOrder.total) - transactionAmount) > 0.01))
        return Response.json({ error: 'Valor da transação não corresponde ao pedido.' }, { status: 409 })
      if (paid) await context.env.DB.prepare(`UPDATE plate_orders SET payment_status='approved',status='paid',updated_at=datetime('now') WHERE id=? AND payment_status='pending'`).bind(plateOrder.id).run()
      else if (failed) await context.env.DB.prepare(`UPDATE plate_orders SET payment_status='failed',status='cancelled',updated_at=datetime('now') WHERE id=? AND payment_status='pending'`).bind(plateOrder.id).run()
      else if (refunded) await context.env.DB.prepare(`UPDATE plate_orders SET payment_status='refunded',status='cancelled',updated_at=datetime('now') WHERE id=?`).bind(plateOrder.id).run()
      await context.env.DB.prepare('INSERT INTO webhook_events (id, provider, event_type, received_at) VALUES (?, ?, ?, datetime(\'now\'))')
        .bind(eventId, 'syncpay', event).run()
      return Response.json({ received: true })
    }
  }
  const providerId = data.subscription_token || data.subscription?.token || data.token
  await context.env.DB.prepare('INSERT INTO webhook_events (id, provider, event_type, received_at) VALUES (?, ?, ?, datetime(\'now\'))')
    .bind(eventId, 'syncpay', event).run()

  if (!providerId) return Response.json({ received: true })
  const subscription: any = await context.env.DB.prepare('SELECT * FROM subscriptions WHERE provider = ? AND provider_subscription_id = ? ORDER BY datetime(created_at) DESC LIMIT 1')
    .bind('syncpay', providerId).first()
  if (!subscription) return Response.json({ received: true })

  const end = data.current_period_end || data.period_end || data.next_billing_at || null
  if (['assinatura_ativada', 'assinatura_reativada', 'assinatura_renovada', 'cobranca_paga'].includes(event)) {
    await context.env.DB.prepare(`UPDATE subscriptions SET status = 'active',
      current_period_start = COALESCE(?, datetime('now')),
      current_period_end = COALESCE(?, datetime('now', '+30 days')),
      next_billing_at = COALESCE(?, datetime('now', '+30 days')),
      grace_period_ends_at = NULL, updated_at = datetime('now') WHERE id = ?`)
      .bind(data.current_period_start || null, end, data.next_billing_at || end, subscription.id).run()
  } else if (event === 'assinatura_em_atraso' || event === 'cobranca_falhou') {
    await context.env.DB.prepare(`UPDATE subscriptions SET status = 'past_due',
      grace_period_ends_at = datetime('now', '+7 days'), updated_at = datetime('now') WHERE id = ?`)
      .bind(subscription.id).run()
  } else if (event === 'assinatura_suspensa') {
    await context.env.DB.prepare(`UPDATE subscriptions SET status = 'past_due',
      grace_period_ends_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`).bind(subscription.id).run()
  } else if (event === 'assinatura_cancelada') {
    await context.env.DB.prepare(`UPDATE subscriptions SET cancel_at_period_end = 1,
      canceled_at = COALESCE(canceled_at, datetime('now')), collection_status = 'pending',
      updated_at = datetime('now') WHERE id = ?`).bind(subscription.id).run()
  } else if (event === 'assinatura_expirada') {
    await context.env.DB.prepare(`UPDATE subscriptions SET status = 'expired',
      ended_at = COALESCE(ended_at, datetime('now')), collection_status = 'pending',
      grace_period_ends_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
      .bind(subscription.id).run()
  }
  return Response.json({ received: true })
}
