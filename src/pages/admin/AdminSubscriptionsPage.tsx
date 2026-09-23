import React, { useEffect, useMemo, useState } from 'react'
import { CalendarClock, CreditCard, PackageCheck, RefreshCw, Search } from 'lucide-react'
import { CollectionStatus, Plan, Subscription, SubscriptionStatus } from '../../types'
import { api } from '../../services/api'

type AdminSubscription = Subscription & { user_name?: string; user_email?: string }
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('pt-BR') : '—'
const statusLabel: Record<string, string> = { pending: 'Pendente', active: 'Ativa', past_due: 'Em atraso', canceled: 'Cancelada', expired: 'Encerrada', trialing: 'Em teste' }
const collectionLabel: Record<string, string> = { not_required: 'Não necessário', pending: 'Aguardando agendamento', scheduled: 'Agendado', collected: 'Recolhido', not_returned: 'Não devolvido' }

export const AdminSubscriptionsPage: React.FC = () => {
  const [items, setItems] = useState<AdminSubscription[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([api.subscriptions.getAll(), api.plans.getAll()])
      .then(([subscriptions, plans]) => {
        setItems(subscriptions)
        setPlan(plans.find((item) => item.id === 'plan-pro') || null)
      })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const filtered = useMemo(() => items.filter((item) => `${item.user_name} ${item.user_email}`.toLowerCase().includes(search.toLowerCase())), [items, search])
  const active = items.filter((item) => ['active', 'trialing'].includes(item.status)).length
  const pendingCollection = items.filter((item) => ['pending', 'scheduled', 'not_returned'].includes(item.collection_status || '')).length

  const update = async (item: AdminSubscription, changes: { status?: SubscriptionStatus; collection_status?: CollectionStatus }) => {
    const saved = await api.subscriptions.update({ id: item.id, ...changes })
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, ...saved } : row))
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-black uppercase tracking-[.18em] text-blue-600">Receita recorrente</p><h1 className="mt-1 text-2xl font-black text-slate-950">Assinaturas e recolhimentos</h1><p className="mt-1 text-xs text-slate-500">Controle da vigência paga, inadimplência e retorno das placas em comodato.</p></div><button onClick={load} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700"><RefreshCw className="h-4 w-4" /> Atualizar</button></div>

    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><CreditCard className="h-5 w-5 text-emerald-600" /><div className="mt-3 text-2xl font-black">{active}</div><p className="text-xs text-slate-500">assinaturas ativas</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><PackageCheck className="h-5 w-5 text-amber-600" /><div className="mt-3 text-2xl font-black">{pendingCollection}</div><p className="text-xs text-slate-500">recolhimentos pendentes</p></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><CalendarClock className="h-5 w-5 text-blue-600" /><div className="mt-3 text-2xl font-black">{(active * (plan?.price ?? 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div><p className="text-xs text-slate-500">receita mensal contratada</p></div>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead><tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Assinatura</th><th className="px-4 py-3">Vigência paga</th><th className="px-4 py-3">Cartão</th><th className="px-4 py-3">Recolhimento</th></tr></thead><tbody className="divide-y divide-slate-100">
        {loading ? <tr><td colSpan={5} className="p-10 text-center text-slate-400">Carregando…</td></tr> : filtered.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-400">Nenhuma assinatura encontrada.</td></tr> : filtered.map((item) => <tr key={item.id} className="hover:bg-slate-50/60">
          <td className="px-4 py-4"><strong className="block text-slate-900">{item.user_name || item.user_id}</strong><span className="text-slate-400">{item.user_email}</span></td>
          <td className="px-4 py-4"><select value={item.status} onChange={(event) => update(item, { status: event.target.value as SubscriptionStatus })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold"><option value="pending">Pendente</option><option value="active">Ativa</option><option value="past_due">Em atraso</option><option value="canceled">Cancelada</option><option value="expired">Encerrada</option><option value="trialing">Em teste</option></select><div className="mt-1 text-[10px] text-slate-400">{statusLabel[item.status]}</div></td>
          <td className="px-4 py-4"><strong>{dateLabel(item.current_period_end || item.expires_at)}</strong>{item.cancel_at_period_end && <div className="mt-1 text-[10px] font-bold text-amber-700">Não renovar</div>}</td>
          <td className="px-4 py-4">{item.payment_method_brand ? `${item.payment_method_brand} •••• ${item.payment_method_last4}` : 'Não informado'}</td>
          <td className="px-4 py-4"><select value={item.collection_status || 'not_required'} onChange={(event) => update(item, { collection_status: event.target.value as CollectionStatus })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-bold"><option value="not_required">Não necessário</option><option value="pending">Aguardando</option><option value="scheduled">Agendado</option><option value="collected">Recolhido</option><option value="not_returned">Não devolvido</option></select><div className="mt-1 text-[10px] text-slate-400">{collectionLabel[item.collection_status || 'not_required']}</div></td>
        </tr>)}
      </tbody></table></div>
    </div>
  </div>
}
