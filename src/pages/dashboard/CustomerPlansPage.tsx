import React, { useEffect, useMemo, useState } from 'react'
import { BadgeCheck, CalendarClock, Check, Copy, PackageCheck, QrCode, ShieldCheck, Sparkles, WalletCards, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Plan, Subscription } from '../../types'
import { api } from '../../services/api'
import { PlateOrderModal } from '../../components/PlateOrderModal'

const dateLabel = (value?: string) => value
  ? new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—'

const statusLabels: Record<string, string> = {
  active: 'Ativa', trialing: 'Em teste', past_due: 'Pagamento pendente',
  canceled: 'Cancelada', expired: 'Encerrada', pending: 'Aguardando pagamento',
}

type PixAuthorization = { payload: string; image: string }

const emptyAuthorization = (): PixAuthorization => ({ payload: '', image: '' })

const findPixAuthorization = (value: unknown, depth = 0): PixAuthorization => {
  if (depth > 6 || value == null) return emptyAuthorization()
  if (typeof value === 'string') return value.startsWith('000201') ? { payload: value, image: '' } : emptyAuthorization()
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findPixAuthorization(item, depth + 1)
      if (found.payload || found.image) return found
    }
    return emptyAuthorization()
  }
  if (typeof value !== 'object') return emptyAuthorization()
  const record = value as Record<string, unknown>
  for (const key of ['pix_code', 'copy_paste', 'br_code', 'emv', 'payload', 'code']) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.startsWith('000201')) return { payload: candidate, image: '' }
  }
  for (const key of ['qr_code', 'qr_code_url', 'qr_image', 'image']) {
    const candidate = record[key]
    if (typeof candidate !== 'string') continue
    if (candidate.startsWith('000201')) return { payload: candidate, image: '' }
    if (/^data:image\//i.test(candidate) || /^https?:\/\//i.test(candidate)) return { payload: '', image: candidate }
    if (/^(iVBOR|\/9j\/)/.test(candidate)) return { payload: '', image: `data:image/png;base64,${candidate}` }
  }
  for (const candidate of Object.values(record)) {
    const found = findPixAuthorization(candidate, depth + 1)
    if (found.payload || found.image) return found
  }
  return emptyAuthorization()
}

export const CustomerPlansPage: React.FC = () => {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [document, setDocument] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [pixPayment, setPixPayment] = useState<Record<string, any> | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [plateOrderOpen, setPlateOrderOpen] = useState(false)

  useEffect(() => {
    Promise.all([api.plans.getAll(), api.subscriptions.getMine()])
      .then(([plans, current]) => {
        setPlan(plans.find((item) => item.id === 'plan-pro') || plans.find((item) => item.status === 'active') || null)
        setSubscription(current)
      })
      .finally(() => setLoading(false))
  }, [])

  const isAccessActive = useMemo(() => {
    if (!subscription) return false
    const end = subscription.current_period_end ? Date.parse(subscription.current_period_end) : Infinity
    return ['active', 'trialing', 'canceled'].includes(subscription.status) && end > Date.now()
  }, [subscription])

  const cancelSubscription = async () => {
    setBusy(true)
    try {
      const updated = await api.subscriptions.cancel()
      setSubscription(updated)
      setConfirmCancel(false)
      setMessage(`Cancelamento agendado. Suas placas continuam ativas até ${dateLabel(updated.current_period_end)}.`)
    } catch (error: any) {
      setMessage(error.message || 'Não foi possível agendar o cancelamento.')
    } finally { setBusy(false) }
  }

  const subscribe = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setCheckoutError(null)
    try {
      const result = await api.subscriptions.subscribe({ document, accepted_terms: acceptedTerms })
      setSubscription(result.subscription)
      setPixPayment(result.payment || null)
      if (!result.payment) throw new Error('A SyncPay não devolveu o QR Code de autorização. Tente novamente ou fale com o suporte.')
      setMessage('Solicitação criada. Autorize o Pix Automático no aplicativo do seu banco para concluir.')
    } catch (error: any) {
      const errorMessage = error.message || 'Não foi possível iniciar a assinatura.'
      setCheckoutError(errorMessage)
      setMessage(errorMessage)
    } finally { setBusy(false) }
  }

  const resumeAuthorization = async () => {
    setCheckoutOpen(true)
    setCheckoutError(null)
    setBusy(true)
    try {
      const result = await api.subscriptions.getAuthorization()
      setSubscription(result.subscription)
      setPixPayment(result.payment || null)
      const authorization = findPixAuthorization(result.payment)
      if (!authorization.payload && !authorization.image) throw new Error('A autorização foi criada, mas a SyncPay ainda não disponibilizou um QR Code Pix válido. Aguarde alguns segundos e tente novamente.')
    } catch (error: any) {
      setCheckoutError(error.message || 'Não foi possível recuperar o QR Code de autorização.')
    } finally { setBusy(false) }
  }

  const pixAuthorization = findPixAuthorization(pixPayment)
  const authorizationCode = pixAuthorization.payload
  const authorizationImage = pixAuthorization.image
  const hasPixAuthorization = Boolean(authorizationCode || authorizationImage)

  const paidPeriodEnd = subscription?.current_period_end ? Date.parse(subscription.current_period_end) : NaN
  const hasPaidPeriod = Number.isFinite(paidPeriodEnd)
  const authorizationCanceled = subscription?.status === 'canceled' && !hasPaidPeriod
  const cancellationScheduled = Boolean(subscription?.cancel_at_period_end && hasPaidPeriod)
  const displayedStatus = authorizationCanceled
    ? 'Autorização cancelada'
    : cancellationScheduled
      ? 'Cancelamento agendado'
      : subscription ? statusLabels[subscription.status] || subscription.status : ''

  if (loading) return <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Carregando sua assinatura…</div>

  const features = plan?.features?.length ? plan.features : [
    '1 placa padrão AvaliaTag incluída', 'NFC e QR Code dinâmicos',
    'Todos os destinos e modelos', 'Telemetria e relatórios completos',
    'Cancelamento a qualquer momento', 'Suporte e atualizações',
  ]
  const monthlyPrice = plan?.price ?? 29.9
  const formattedMonthlyPrice = monthlyPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[.18em] text-blue-600">Assinatura e comodato</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Meu plano AvaliaTag</h1>
        <p className="mt-1 text-sm text-slate-500">Uma mensalidade por estabelecimento, com todos os recursos liberados.</p>
      </div>

      {message && <div role="status" className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">{message}</div>}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <section className="overflow-hidden rounded-3xl border border-blue-200 bg-white shadow-sm">
          <div className="bg-[#0B1F3B] p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-400/15 px-3 py-1 text-[11px] font-bold text-blue-100 ring-1 ring-blue-300/25"><Sparkles className="h-3.5 w-3.5" /> Todos os recursos incluídos</span>
                <h2 className="mt-4 text-2xl font-black">{plan?.name || 'AvaliaTag Completo'}</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Placa inteligente em comodato, NFC e QR Code ativos enquanto a assinatura estiver vigente.</p>
              </div>
              <div className="text-right"><div className="text-4xl font-black">{formattedMonthlyPrice}</div><div className="text-xs text-slate-400">por mês / estabelecimento</div></div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div className="space-y-3">
              {features.map((feature) => <div key={feature} className="flex items-start gap-2.5 text-sm text-slate-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span>{feature}</span></div>)}
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900"><PackageCheck className="h-4 w-4 text-blue-600" /> Placas adicionais</div>
              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Da 2ª à 10ª</span><strong>R$ 19,90/un.</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Da 11ª à 20ª</span><strong>R$ 14,90/un.</strong></div>
                <div className="flex justify-between"><span className="text-slate-500">Acima de 20</span><strong>R$ 9,90/un.</strong></div>
                <div className="border-t border-slate-200 pt-2.5 text-slate-500">Logo personalizada: + R$ 5/un. até 10 unidades; incluída acima disso.</div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2"><h2 className="font-black text-slate-900">Situação da assinatura</h2>{subscription && <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${isAccessActive ? 'bg-emerald-100 text-emerald-700' : authorizationCanceled ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'}`}>{displayedStatus}</span>}</div>

          {!subscription || authorizationCanceled ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-center"><QrCode className="mx-auto h-7 w-7 text-slate-400" /><p className="mt-3 text-sm font-bold text-slate-800">{authorizationCanceled ? 'Pix não autorizado' : 'Assinatura ainda não ativada'}</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{authorizationCanceled ? 'A tentativa anterior foi cancelada e nenhuma mensalidade foi ativada. Você pode iniciar uma nova autorização.' : 'Autorize o Pix Automático uma vez e as mensalidades serão renovadas pelo banco.'}</p><button onClick={() => { setCheckoutError(null); setPixPayment(null); setCheckoutOpen(true) }} className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white">{authorizationCanceled ? 'Tentar novamente' : `Assinar por ${formattedMonthlyPrice}`}</button></div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 p-3"><CalendarClock className="mb-2 h-4 w-4 text-blue-600" /><span className="block text-slate-400">Acesso garantido até</span><strong className="mt-1 block text-slate-900">{dateLabel(subscription.current_period_end || subscription.expires_at)}</strong></div>
                <div className="rounded-2xl bg-slate-50 p-3"><WalletCards className="mb-2 h-4 w-4 text-blue-600" /><span className="block text-slate-400">Pagamento</span><strong className="mt-1 block text-slate-900">Pix Automático</strong></div>
              </div>

              {subscription.status === 'pending' && <button disabled={busy} onClick={resumeAuthorization} className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{busy ? 'Buscando QR Code…' : 'Continuar autorização do Pix'}</button>}

              {cancellationScheduled ? <div className="rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">A renovação foi encerrada. Para continuar depois da vigência, será necessário fazer uma nova assinatura.</div> : <button disabled={busy || !isAccessActive} onClick={() => setConfirmCancel(true)} className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40">Cancelar ao fim da vigência</button>}

              <div className="flex gap-2 rounded-2xl bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800"><ShieldCheck className="h-4 w-4 shrink-0" /><span>Ao cancelar, as placas continuam funcionando até o último dia já pago. Depois disso, o recolhimento é agendado.</span></div>
            </div>
          )}
        </aside>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        {[['Pix Automático', 'Autorize uma vez e renove sem ações mensais.'], ['Sem fidelidade', 'Cancele quando quiser, sem multa.'], ['Placas em comodato', 'Os dispositivos retornam à AvaliaTag após o encerramento.']].map(([title, description]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><BadgeCheck className="h-5 w-5 text-blue-600" /><h3 className="mt-3 text-sm font-black text-slate-900">{title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p></div>)}
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-6 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-slate-950">Precisa de mais placas?</h2><p className="mt-1 max-w-2xl text-sm text-slate-600">Solicite placas adicionais com recursos completos ou compre placas definitivas sem mensalidade. Escolha também se deseja usar a logo do estabelecimento.</p></div><button onClick={() => setPlateOrderOpen(true)} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-blue-700">Solicitar placas</button></section>

      {confirmCancel && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-black text-slate-900">Agendar cancelamento?</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Você continuará usando todos os recursos até <strong>{dateLabel(subscription?.current_period_end)}</strong>. Depois, as placas serão desativadas e o recolhimento será combinado.</p></div><button onClick={() => setConfirmCancel(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div><div className="mt-6 flex gap-3"><button onClick={() => setConfirmCancel(false)} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700">Manter assinatura</button><button disabled={busy} onClick={cancelSubscription} className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{busy ? 'Processando…' : 'Confirmar cancelamento'}</button></div></div></div>}

      {checkoutOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"><div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">Assinar com Pix Automático</h2><p className="mt-1 text-xs text-slate-500">{formattedMonthlyPrice} por mês · primeira placa incluída</p></div><button onClick={() => setCheckoutOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{pixPayment && hasPixAuthorization ? <div className="mt-6 space-y-4 text-center"><div className="rounded-2xl bg-emerald-50 p-5"><QrCode className="mx-auto h-8 w-8 text-emerald-600" /><h3 className="mt-3 font-black text-emerald-900">Autorize no aplicativo do seu banco</h3><p className="mt-1 text-xs text-emerald-700">Escaneie o QR Code Pix. A liberação ocorre após a confirmação da SyncPay.</p></div><div className="rounded-2xl border border-slate-200 p-4">{authorizationImage ? <img src={authorizationImage} alt="QR Code de autorização do Pix Automático" className="mx-auto h-52 w-52 rounded-xl bg-white object-contain p-2" /> : <QRCodeSVG value={authorizationCode} size={208} level="M" className="mx-auto max-w-full rounded-xl bg-white p-2" />}{authorizationCode && <div className="mt-4 text-left"><span className="text-[10px] font-bold uppercase text-slate-400">Pix Copia e Cola</span><p className="mt-2 max-h-20 overflow-y-auto break-all font-mono text-[10px] text-slate-600">{authorizationCode}</p><button onClick={() => navigator.clipboard.writeText(authorizationCode)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"><Copy className="h-3.5 w-3.5" /> Copiar código Pix</button></div>}</div><button onClick={() => setCheckoutOpen(false)} className="w-full rounded-xl border border-slate-300 py-2.5 text-xs font-bold">Fechar</button></div> : subscription?.status === 'pending' ? <div className="mt-6 space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong className="block">Autorização pendente</strong><span className="mt-1 block text-xs">Busque novamente o QR Code Pix gerado pela SyncPay.</span></div>{checkoutError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{checkoutError}</div>}<button disabled={busy} onClick={resumeAuthorization} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? 'Buscando QR Code…' : 'Buscar QR Code novamente'}</button></div> : <form onSubmit={subscribe} className="mt-6 space-y-5"><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><strong className="block text-sm text-blue-950">Como funciona</strong><span className="mt-1 block text-xs leading-relaxed text-blue-800">Você autoriza uma vez no aplicativo do banco. Depois, as mensalidades são renovadas automaticamente, sem usar cartão.</span></div>{checkoutError && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">{checkoutError}</div>}<label className="block text-xs font-bold text-slate-700">CPF ou CNPJ<input required value={document} onChange={(event) => setDocument(event.target.value)} inputMode="numeric" placeholder="Somente números" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500" /></label><label className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600"><input required type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5" /><span>Li e aceito a cobrança mensal por Pix Automático e o comodato das placas, que deverão ser devolvidas após o encerramento da assinatura.</span></label><button disabled={busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? 'Conectando à SyncPay…' : 'Autorizar Pix Automático'}</button></form>}</div></div>}
      {plateOrderOpen && <PlateOrderModal onClose={() => setPlateOrderOpen(false)} subscriptionActive={isAccessActive} />}
    </div>
  )
}
