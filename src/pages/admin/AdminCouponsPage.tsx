import React, { useEffect, useState } from 'react'
import { CalendarClock, Check, Pencil, Plus, TicketPercent, Trash2, X } from 'lucide-react'
import { api } from '../../services/api'
import type { Coupon } from '../../types'

type CouponDraft = {
  id?: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  minimum_order_amount: string
  maximum_discount_amount: string
  usage_limit: string
  starts_at: string
  expires_at: string
  status: 'active' | 'inactive'
}

const emptyDraft: CouponDraft = { code: '', description: '', discount_type: 'percentage', discount_value: '', minimum_order_amount: '0', maximum_discount_amount: '', usage_limit: '', starts_at: '', expires_at: '', status: 'active' }
const localDate = (value?: string | null) => value ? new Date(value).toISOString().slice(0, 16) : ''
const draftFrom = (coupon: Coupon): CouponDraft => ({
  id: coupon.id, code: coupon.code, description: coupon.description || '', discount_type: coupon.discount_type,
  discount_value: String(coupon.discount_value), minimum_order_amount: String(coupon.minimum_order_amount || 0),
  maximum_discount_amount: coupon.maximum_discount_amount == null ? '' : String(coupon.maximum_discount_amount),
  usage_limit: coupon.usage_limit == null ? '' : String(coupon.usage_limit), starts_at: localDate(coupon.starts_at), expires_at: localDate(coupon.expires_at), status: coupon.status,
})
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const AdminCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [draft, setDraft] = useState<CouponDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = () => api.coupons.getAll().then(setCoupons).catch((err) => setError(err.message)).finally(() => setLoading(false))
  useEffect(() => { void load() }, [])
  const update = <K extends keyof CouponDraft>(key: K, value: CouponDraft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current)

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft) return
    setSaving(true); setError('')
    try {
      const coupon = await api.coupons.save({
        id: draft.id, code: draft.code, description: draft.description, discount_type: draft.discount_type,
        discount_value: Number(draft.discount_value), minimum_order_amount: Number(draft.minimum_order_amount || 0),
        maximum_discount_amount: draft.maximum_discount_amount === '' ? null : Number(draft.maximum_discount_amount),
        usage_limit: draft.usage_limit === '' ? null : Number(draft.usage_limit), starts_at: draft.starts_at || null,
        expires_at: draft.expires_at || null, status: draft.status,
      })
      setCoupons((current) => draft.id ? current.map((item) => item.id === coupon.id ? coupon : item) : [coupon, ...current])
      setDraft(null); setMessage(draft.id ? 'Cupom atualizado com sucesso.' : 'Cupom criado com sucesso.')
      window.setTimeout(() => setMessage(''), 3000)
    } catch (err: any) { setError(err.message || 'Não foi possível salvar o cupom.') } finally { setSaving(false) }
  }

  const remove = async (coupon: Coupon) => {
    if (!window.confirm(`Excluir o cupom ${coupon.code}? Cupons já utilizados serão apenas desativados.`)) return
    try {
      const result = await api.coupons.delete(coupon.id)
      if (result.deactivated) setCoupons((current) => current.map((item) => item.id === coupon.id ? { ...item, status: 'inactive' } : item))
      else setCoupons((current) => current.filter((item) => item.id !== coupon.id))
      setMessage(result.deactivated ? 'Cupom utilizado anteriormente: ele foi desativado.' : 'Cupom excluído.')
    } catch (err: any) { setError(err.message || 'Não foi possível remover o cupom.') }
  }

  return <div className="space-y-6 pb-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-black tracking-tight text-slate-900">Cupons de desconto</h1><p className="mt-1 text-xs text-slate-500">Crie campanhas com validade, pedido mínimo e limite de utilizações.</p></div><button onClick={() => { setDraft(emptyDraft); setError('') }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Novo cupom</button></div>
    {message && <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><Check className="h-4 w-4" />{message}</div>}
    {error && !draft && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {loading ? <div className="text-sm text-slate-500">Carregando cupons...</div> : coupons.length === 0 ? <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center"><TicketPercent className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-3 font-bold text-slate-800">Nenhum cupom cadastrado</h2><p className="mt-1 text-xs text-slate-500">Crie o primeiro código promocional para a loja.</p></div> : coupons.map((coupon) => {
        const exhausted = coupon.usage_limit != null && coupon.usage_count >= coupon.usage_limit
        const expired = Boolean(coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
        const active = coupon.status === 'active' && !expired && !exhausted
        return <article key={coupon.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{active ? 'Disponível' : expired ? 'Expirado' : exhausted ? 'Esgotado' : 'Inativo'}</span><h2 className="mt-3 font-mono text-xl font-black tracking-wider text-slate-950">{coupon.code}</h2><p className="mt-1 min-h-8 text-xs text-slate-500">{coupon.description || 'Sem descrição.'}</p></div><TicketPercent className="h-7 w-7 text-blue-600" /></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-xs"><div><span className="block text-slate-400">Desconto</span><strong>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : money(coupon.discount_value)}</strong></div><div><span className="block text-slate-400">Utilizações</span><strong>{coupon.usage_count}{coupon.usage_limit == null ? ' / ilimitado' : ` / ${coupon.usage_limit}`}</strong></div><div><span className="block text-slate-400">Pedido mínimo</span><strong>{money(coupon.minimum_order_amount || 0)}</strong></div><div><span className="block text-slate-400">Validade</span><strong>{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('pt-BR') : 'Sem prazo'}</strong></div></div><div className="mt-4 flex gap-2"><button onClick={() => { setDraft(draftFrom(coupon)); setError('') }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Editar</button><button onClick={() => remove(coupon)} aria-label={`Excluir ${coupon.code}`} className="rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div></article>
      })}
    </div>
    {draft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4"><form onSubmit={save} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black text-slate-900">{draft.id ? 'Editar cupom' : 'Novo cupom'}</h2><p className="mt-1 text-xs text-slate-500">O desconto será recalculado com segurança no fechamento do pedido.</p></div><button type="button" onClick={() => setDraft(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}<div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Código<input required minLength={3} maxLength={32} value={draft.code} onChange={(e) => update('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="EX: BEMVINDO10" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm uppercase" /></label><label className="text-xs font-bold text-slate-700">Status<select value={draft.status} onChange={(e) => update('status', e.target.value as CouponDraft['status'])} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label><label className="sm:col-span-2 text-xs font-bold text-slate-700">Descrição<input value={draft.description} maxLength={240} onChange={(e) => update('description', e.target.value)} placeholder="Ex: Campanha para novos clientes" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label><label className="text-xs font-bold text-slate-700">Tipo de desconto<select value={draft.discount_type} onChange={(e) => update('discount_type', e.target.value as CouponDraft['discount_type'])} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"><option value="percentage">Percentual (%)</option><option value="fixed">Valor fixo (R$)</option></select></label><label className="text-xs font-bold text-slate-700">Valor do desconto<input required type="number" min="0.01" max={draft.discount_type === 'percentage' ? 100 : undefined} step="0.01" value={draft.discount_value} onChange={(e) => update('discount_value', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold text-slate-700">Pedido mínimo (R$)<input type="number" min="0" step="0.01" value={draft.minimum_order_amount} onChange={(e) => update('minimum_order_amount', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold text-slate-700">Desconto máximo (R$)<input type="number" min="0" step="0.01" value={draft.maximum_discount_amount} onChange={(e) => update('maximum_discount_amount', e.target.value)} placeholder="Opcional" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold text-slate-700">Limite de utilizações<input type="number" min="1" step="1" value={draft.usage_limit} onChange={(e) => update('usage_limit', e.target.value)} placeholder="Ilimitado" className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label><div /><label className="text-xs font-bold text-slate-700"><span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Início</span><input type="datetime-local" value={draft.starts_at} onChange={(e) => update('starts_at', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label><label className="text-xs font-bold text-slate-700"><span className="flex items-center gap-1"><CalendarClock className="h-3.5 w-3.5" /> Expiração</span><input type="datetime-local" value={draft.expires_at} onChange={(e) => update('expires_at', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm" /></label></div><div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5"><button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={saving} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Salvando...' : 'Salvar cupom'}</button></div></form></div>}
  </div>
}
