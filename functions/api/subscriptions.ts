interface Env {
  DB: D1Database
  SYNCPAY_CLIENT_ID?: string
  SYNCPAY_CLIENT_SECRET?: string
  SYNCPAY_PIX_AUTO_PLAN_TOKEN?: string
}

import { requireAdmin, requireSession } from '../_lib/session'
import { cancelSyncPaySubscription, enrollSyncPayPix, getSyncPaySubscription } from '../_lib/syncpay'

const subscriptionFields = `
  s.id, s.user_id, s.plan_id, s.provider, s.provider_subscription_id,
  s.status, s.started_at, s.current_period_start, s.current_period_end,
  s.next_billing_at, s.grace_period_ends_at, s.cancel_at_period_end,
  s.canceled_at, s.ended_at, s.billing_method, s.payment_method_brand, s.payment_method_last4,
  s.collection_status, s.collection_requested_at, s.returned_at,
  s.expires_at, s.created_at, s.updated_at`

async function latestForUser(db: D1Database, userId: string) {
  return db.prepare(`SELECT ${subscriptionFields} FROM subscriptions s
    WHERE s.user_id = ? ORDER BY datetime(s.created_at) DESC LIMIT 1`)
    .bind(userId).first()
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const user = await requireSession(context.request, context.env.DB)
    const url = new URL(context.request.url)
    const requestedUserId = url.searchParams.get('user_id')

    if (requestedUserId) {
      if (user.role !== 'admin' && requestedUserId !== user.id)
        return Response.json({ error: 'Acesso restrito' }, { status: 403 })
      return Response.json(await latestForUser(context.env.DB, requestedUserId))
    }

    if (user.role === 'admin' && url.searchParams.get('all') === '1') {
      const { results } = await context.env.DB.prepare(`
        SELECT ${subscriptionFields}, u.name AS user_name, u.email AS user_email
        FROM subscriptions s JOIN users u ON u.id = s.user_id
        WHERE s.id = (SELECT s2.id FROM subscriptions s2 WHERE s2.user_id = s.user_id
          ORDER BY datetime(s2.created_at) DESC LIMIT 1)
        ORDER BY datetime(s.created_at) DESC`).all()
      return Response.json(results)
    }

    return Response.json(await latestForUser(context.env.DB, user.id))
  } catch (err: any) {
    if (err instanceof Response) return err
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const user = await requireSession(context.request, context.env.DB)
    const data: any = await context.request.json()
    const subscription = await latestForUser(context.env.DB, user.id) as any

    if (data.action === 'authorization') {
      if (!subscription || subscription.provider !== 'syncpay' || !subscription.provider_subscription_id)
        return Response.json({ error: 'Não existe uma autorização Pix pendente.' }, { status: 404 })

      const saved = await context.env.DB.prepare(
        'SELECT provider_authorization_data FROM subscriptions WHERE id = ?'
      ).bind(subscription.id).first<{ provider_authorization_data?: string }>()
      if (saved?.provider_authorization_data) {
        try {
          return Response.json({ subscription, payment: JSON.parse(saved.provider_authorization_data) })
        } catch {
          // Ignore malformed legacy data and ask SyncPay for the current state.
        }
      }

      const provider = await getSyncPaySubscription(context.env, subscription.provider_subscription_id)
      const payment = provider.payment || provider.mandate || provider.authorization || provider.current_charge?.payment || provider.charge?.payment || null
      if (payment) {
        await context.env.DB.prepare(`UPDATE subscriptions SET
          provider_authorization_data = ?, updated_at = datetime('now') WHERE id = ?`)
          .bind(JSON.stringify(payment), subscription.id).run()
      }
      return Response.json({
        subscription,
        payment,
      })
    }

    if (data.action === 'cancel') {
      if (!subscription || !['active', 'trialing', 'past_due'].includes(subscription.status))
        return Response.json({ error: 'Não existe uma assinatura ativa para cancelar.' }, { status: 400 })

      if (subscription.provider === 'syncpay' && subscription.provider_subscription_id)
        await cancelSyncPaySubscription(context.env, subscription.provider_subscription_id)

      // SyncPay stops future charges immediately; AvaliaTag keeps access through
      // the period already paid and schedules collection for its end.
      await context.env.DB.prepare(`UPDATE subscriptions SET
        cancel_at_period_end = 1, canceled_at = datetime('now'),
        collection_status = 'pending', updated_at = datetime('now') WHERE id = ?`)
        .bind(subscription.id).run()
      return Response.json(await latestForUser(context.env.DB, user.id))
    }

    if (data.action === 'subscribe') {
      if (subscription && ['active', 'trialing', 'past_due', 'pending'].includes(subscription.status) && !subscription.cancel_at_period_end)
        return Response.json({ error: 'Já existe uma assinatura em andamento.' }, { status: 409 })

      const document = String(data.document || '').replace(/\D/g, '')
      const phone = String(user.phone || '').replace(/\D/g, '')
      if (![11, 14].includes(document.length)) return Response.json({ error: 'Informe um CPF ou CNPJ válido.' }, { status: 400 })
      if (phone.length < 10) return Response.json({ error: 'Cadastre um telefone com DDD antes de assinar.' }, { status: 400 })
      if (!data.accepted_terms) return Response.json({ error: 'É necessário aceitar os termos do comodato e da assinatura.' }, { status: 400 })

      const billingMethod = 'pix_automatico'
      const result = await enrollSyncPayPix(context.env, {
        name: user.name, email: user.email, document, phone,
      })
      if (!result.subscriptionToken) throw new Error('A SyncPay não devolveu o identificador da assinatura.')

      const id = `sub-${crypto.randomUUID()}`
      await context.env.DB.prepare(`INSERT INTO subscriptions
        (id, user_id, plan_id, provider, provider_subscription_id, status,
         started_at, billing_method, provider_authorization_data,
         collection_status, created_at, updated_at)
        VALUES (?, ?, 'plan-pro', 'syncpay', ?, 'pending', datetime('now'), ?, ?,
          'not_required', datetime('now'), datetime('now'))`)
        .bind(id, user.id, result.subscriptionToken, billingMethod,
          result.payment ? JSON.stringify(result.payment) : null).run()

      return Response.json({ subscription: await latestForUser(context.env.DB, user.id), payment: result.payment, awaiting_confirmation: true }, { status: 201 })
    }

    return Response.json({ error: 'Ação inválida.' }, { status: 400 })
  } catch (err: any) {
    if (err instanceof Response) return err
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    await requireAdmin(context.request, context.env.DB)
    const data: any = await context.request.json()
    if (!data.id) return Response.json({ error: 'Assinatura obrigatória.' }, { status: 400 })

    const allowedStatuses = ['pending', 'active', 'past_due', 'canceled', 'expired', 'trialing']
    const allowedCollections = ['not_required', 'pending', 'scheduled', 'collected', 'not_returned']
    if (data.status && !allowedStatuses.includes(data.status))
      return Response.json({ error: 'Status de assinatura inválido.' }, { status: 400 })
    if (data.collection_status && !allowedCollections.includes(data.collection_status))
      return Response.json({ error: 'Status de recolhimento inválido.' }, { status: 400 })

    await context.env.DB.prepare(`UPDATE subscriptions SET
      status = COALESCE(?, status),
      current_period_end = COALESCE(?, current_period_end),
      grace_period_ends_at = COALESCE(?, grace_period_ends_at),
      collection_status = COALESCE(?, collection_status),
      collection_requested_at = CASE WHEN ? = 'scheduled' THEN datetime('now') ELSE collection_requested_at END,
      returned_at = CASE WHEN ? = 'collected' THEN datetime('now') ELSE returned_at END,
      ended_at = CASE WHEN ? = 'expired' THEN datetime('now') ELSE ended_at END,
      updated_at = datetime('now') WHERE id = ?`)
      .bind(data.status ?? null, data.current_period_end ?? null, data.grace_period_ends_at ?? null,
        data.collection_status ?? null, data.collection_status ?? null,
        data.collection_status ?? null, data.status ?? null, data.id).run()

    const row = await context.env.DB.prepare(`SELECT ${subscriptionFields} FROM subscriptions s WHERE s.id = ?`)
      .bind(data.id).first()
    return Response.json(row)
  } catch (err: any) {
    if (err instanceof Response) return err
    return Response.json({ error: err.message }, { status: 500 })
  }
}
