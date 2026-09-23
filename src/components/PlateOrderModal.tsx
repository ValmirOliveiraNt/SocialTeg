import React, { useEffect, useMemo, useState } from 'react'
import { Building2, Check, Copy, Image, Package, QrCode, ShieldCheck, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Business } from '../types'
import { api } from '../services/api'

type Props = { onClose: () => void; subscriptionActive: boolean }

const subscriptionUnit = (quantity: number) => quantity <= 10 ? 19.9 : quantity <= 20 ? 14.9 : 9.9
const outrightUnit = (quantity: number) => quantity === 1 ? 80 : quantity <= 10 ? 69.9 : quantity <= 20 ? 59.9 : 49.9
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const PlateOrderModal: React.FC<Props> = ({ onClose, subscriptionActive }) => {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [businessId, setBusinessId] = useState('')
  const [mode, setMode] = useState<'subscription' | 'outright'>(subscriptionActive ? 'subscription' : 'outright')
  const [quantity, setQuantity] = useState(1)
  const [hasLogo, setHasLogo] = useState(false)
  const [fixedUrl, setFixedUrl] = useState('')
  const [document, setDocument] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [logoFailed, setLogoFailed] = useState(false)
  const [payment, setPayment] = useState<{ id: string; pix_code: string; total: number } | null>(null)

  useEffect(() => { api.businesses.getAll().then((items) => { setBusinesses(items); setBusinessId(items[0]?.id || '') }) }, [])
  const business = businesses.find((item) => item.id === businessId)
  useEffect(() => setLogoFailed(false), [businessId, business?.logo_url])
  const unit = mode === 'subscription' ? subscriptionUnit(quantity) : outrightUnit(quantity)
  const customization = mode === 'subscription' && hasLogo && quantity <= 10 ? quantity * 5 : 0
  const total = useMemo(() => Math.round((unit * quantity + customization) * 100) / 100, [unit, quantity, customization])
  const customerOwns = mode === 'outright' || hasLogo

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const result = await api.plateOrders.create({ business_id: businessId, mode, quantity, has_custom_logo: hasLogo, fixed_destination_url: fixedUrl, document, accepted_terms: accepted })
      setPayment({ id: result.id, pix_code: result.pix_code, total: result.total })
    } catch (e: any) { setError(e.message || 'Não foi possível gerar a cobrança.') } finally { setBusy(false) }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4"><div role="dialog" aria-modal="true" className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
    <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white p-5 sm:p-6"><div><h2 className="text-xl font-black text-slate-950">Solicitar placas AvaliaTag</h2><p className="mt-1 text-xs text-slate-500">Escolha entre recursos completos por assinatura ou compra definitiva sem mensalidade.</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    {payment ? <div className="p-6 text-center"><div className="mx-auto max-w-md rounded-3xl bg-emerald-50 p-6"><QrCode className="mx-auto h-8 w-8 text-emerald-600"/><h3 className="mt-3 text-lg font-black text-emerald-950">Pedido criado</h3><p className="mt-1 text-sm text-emerald-800">Pague {money(payment.total)} pelo Pix para iniciarmos a produção.</p></div><div className="mx-auto mt-5 max-w-sm rounded-2xl border border-slate-200 p-5"><QRCodeSVG value={payment.pix_code} size={220} className="mx-auto max-w-full"/><button onClick={() => navigator.clipboard.writeText(payment.pix_code)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"><Copy className="h-4 w-4"/>Copiar Pix</button></div><p className="mt-4 text-xs text-slate-500">Pedido {payment.id}. O status será atualizado após a confirmação da SyncPay.</p></div> : <form onSubmit={submit} className="space-y-6 p-5 sm:p-6">
      {!subscriptionActive && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong className="block">Você não possui uma assinatura ativa</strong><span className="mt-1 block text-xs leading-relaxed">Por isso, a modalidade “Com assinatura” está indisponível. Você ainda pode comprar a placa sem mensalidade usando a opção ao lado.</span></div>}
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => setMode('subscription')} disabled={!subscriptionActive} className={`relative rounded-2xl border p-4 text-left ${mode === 'subscription' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200'} disabled:cursor-not-allowed disabled:bg-slate-50`}><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${subscriptionActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{subscriptionActive ? 'Assinatura ativa' : 'Exige assinatura ativa'}</span><ShieldCheck className={`mt-3 h-5 w-5 ${subscriptionActive ? 'text-blue-600' : 'text-slate-400'}`}/><strong className="mt-2 block text-sm">Placas adicionais com assinatura</strong><span className="mt-1 block text-xs leading-relaxed text-slate-500">Disponível somente para assinantes. Inclui painel, telemetria e destino editável. Placa padrão é comodato; com logo, a placa é sua.</span>{!subscriptionActive && <span className="mt-3 block text-xs font-bold text-amber-700">Indisponível até a assinatura ser ativada.</span>}</button>
        <button type="button" onClick={() => setMode('outright')} className={`rounded-2xl border p-4 text-left ${mode === 'outright' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200'}`}><span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-blue-700">Não exige assinatura</span><Package className="mt-3 h-5 w-5 text-blue-600"/><strong className="mt-2 block text-sm">Comprar sem mensalidade</strong><span className="mt-1 block text-xs leading-relaxed text-slate-500">Qualquer cliente pode comprar. A placa é sua e usa NFC e QR para um destino fixo, sem painel ou telemetria.</span></button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-slate-700">Estabelecimento<select required value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm">{businesses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="text-xs font-bold text-slate-700">Quantidade<input required type="number" min={1} max={100} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></label></div>
      <label className={`flex items-start gap-3 rounded-2xl border p-4 ${hasLogo ? 'border-blue-300 bg-blue-50' : 'border-slate-200'}`}><input type="checkbox" checked={hasLogo} onChange={(e) => setHasLogo(e.target.checked)} className="mt-1 accent-blue-600"/><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white">{business?.logo_url && !logoFailed ? <img src={business.logo_url} alt={`Logo de ${business.name}`} onError={() => setLogoFailed(true)} className="h-full w-full object-contain p-1"/> : <Image className="h-5 w-5 text-slate-400"/>}</div><span><strong className="block text-sm">Usar a logo do estabelecimento</strong><span className="mt-0.5 block text-[11px] font-semibold text-blue-700">{business?.name || 'Selecione um estabelecimento'}</span><span className="mt-1 block text-xs text-slate-500">{mode === 'subscription' ? 'A placa passa a ser sua. Acréscimo de R$ 5 por unidade até 10 placas; acima disso, incluído.' : 'Personalização incluída na compra definitiva.'}</span>{hasLogo && !business?.logo_url && <span className="mt-2 block text-xs font-bold text-amber-700">Este estabelecimento ainda não possui logo cadastrada.</span>}{business?.logo_url && logoFailed && <span className="mt-2 block text-xs font-bold text-red-700">O endereço cadastrado não pôde ser exibido. Atualize a logo no estabelecimento.</span>}</span></label>
      {mode === 'outright' && <label className="block text-xs font-bold text-slate-700">Destino fixo do NFC e QR Code<input required type="url" value={fixedUrl} onChange={(e) => setFixedUrl(e.target.value)} placeholder="https://..." className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/><span className="mt-1 block font-normal text-slate-400">Não poderá ser alterado remotamente sem contratar o serviço ou regravar a tag.</span></label>}
      <label className="block text-xs font-bold text-slate-700">CPF ou CNPJ do pagador<input required inputMode="numeric" value={document} onChange={(e) => setDocument(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"/></label>
      <div className="rounded-2xl bg-slate-950 p-5 text-white"><div className="flex justify-between text-sm"><span>{quantity} placa(s) × {money(unit)}</span><strong>{money(unit * quantity)}</strong></div>{customization > 0 && <div className="mt-2 flex justify-between text-sm text-blue-200"><span>Personalização com logo</span><strong>{money(customization)}</strong></div>}<div className="mt-4 flex justify-between border-t border-white/15 pt-4 text-lg font-black"><span>Total</span><span>{money(total)}</span></div><div className="mt-3 flex items-start gap-2 text-xs text-slate-300"><Building2 className="mt-0.5 h-4 w-4 shrink-0"/><span>{customerOwns ? 'A placa física será propriedade do cliente e não precisará ser devolvida.' : 'Placa padrão em comodato, pertencente à AvaliaTag e sujeita à devolução no cancelamento.'}</span></div></div>
      <label className="flex items-start gap-2 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600"><input required type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5"/><span><strong className="text-slate-800">Li e concordo:</strong> {customerOwns ? 'a placa física será minha' : 'a placa é fornecida em comodato e deverá ser devolvida'}; {mode === 'subscription' ? 'os recursos digitais dependem da assinatura ativa.' : 'o destino é fixo e não inclui painel, telemetria ou alteração remota.'}</span></label>
      {error && <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
      <button disabled={busy || !businessId} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? 'Gerando Pix…' : `Gerar Pix de ${money(total)}`}</button>
    </form>}
  </div></div>
}
