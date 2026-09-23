interface SyncPayEnv {
  SYNCPAY_CLIENT_ID?: string
  SYNCPAY_CLIENT_SECRET?: string
  SYNCPAY_PIX_AUTO_PLAN_TOKEN?: string
}

const baseUrl = 'https://api.syncpayments.com.br/api/partner/v1'

function configured(env: SyncPayEnv) {
  if (!env.SYNCPAY_CLIENT_ID || !env.SYNCPAY_CLIENT_SECRET)
    throw new Error('A integração SyncPay ainda não foi configurada no servidor.')
}

async function readResponse(response: Response) {
  const payload: any = await response.json().catch(() => ({}))
  if (!response.ok) {
    const validation = payload?.errors ? Object.values(payload.errors).flat().join(' ') : ''
    throw new Error(validation || payload?.message || payload?.error_description || 'A SyncPay recusou a solicitação.')
  }
  return payload
}

export async function syncPayAccessToken(env: SyncPayEnv): Promise<string> {
  configured(env)
  const response = await fetch(`${baseUrl}/auth-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: env.SYNCPAY_CLIENT_ID, client_secret: env.SYNCPAY_CLIENT_SECRET }),
  })
  const payload = await readResponse(response)
  if (!payload.access_token) throw new Error('A SyncPay não devolveu um token de acesso.')
  return payload.access_token
}

async function syncPayRequest(env: SyncPayEnv, path: string, init: RequestInit) {
  const token = await syncPayAccessToken(env)
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json', ...(init.headers || {}) },
  })
  return readResponse(response)
}

export async function enrollSyncPayPix(env: SyncPayEnv, input: {
  name: string
  email: string
  document: string
  phone: string
}) {
  configured(env)
  const planToken = env.SYNCPAY_PIX_AUTO_PLAN_TOKEN
  if (!planToken) throw new Error('O plano Pix Automático ainda não foi configurado na SyncPay.')
  const enrolled = await syncPayRequest(env, `/subscription-plans/${encodeURIComponent(planToken)}/enroll`, {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      document: input.document,
      phone: input.phone,
    }),
  })
  const payload = (enrolled.data || enrolled) as Record<string, any>
  return {
    subscriptionToken: payload.subscription_token as string,
    providerStatus: payload.status as string,
    billingMethod: payload.billing_method || 'pix_automatico',
    payment: payload.payment || payload.mandate || payload.authorization || null,
  }
}

export async function getSyncPaySubscription(env: SyncPayEnv, subscriptionToken: string) {
  const response = await syncPayRequest(env, `/subscriptions/${encodeURIComponent(subscriptionToken)}`, {
    method: 'GET',
  })
  return response.data || response
}

export async function updateSyncPayPlanAmount(env: SyncPayEnv, planToken: string, amount: number) {
  return syncPayRequest(env, `/subscription-plans/${encodeURIComponent(planToken)}`, {
    method: 'PATCH',
    body: JSON.stringify({ amount: amount.toFixed(2) }),
  })
}

export async function createSyncPayPixCharge(env: SyncPayEnv, input: {
  amount: number
  name: string
  document: string
  email: string
  phone: string
  description: string
  webhookUrl: string
}) {
  const response = await syncPayRequest(env, '/cash-in', {
    method: 'POST',
    body: JSON.stringify({
      amount: input.amount,
      client: { name: input.name, cpf: input.document, email: input.email, phone: input.phone },
      description: input.description,
      webhook_url: input.webhookUrl,
    }),
  })
  return response.data || response
}

export async function cancelSyncPaySubscription(env: SyncPayEnv, subscriptionToken: string) {
  return syncPayRequest(env, `/subscriptions/${encodeURIComponent(subscriptionToken)}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason: 'Cancelamento solicitado pelo cliente no painel AvaliaTag' }),
  })
}
