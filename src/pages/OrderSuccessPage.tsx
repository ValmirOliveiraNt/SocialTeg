import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Radio,
  RefreshCw,
  Truck,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Order } from '../types'
import { api } from '../services/api'

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const celebrated = useRef(false)

  const loadOrder = useCallback(async () => {
    if (!orderId) return
    try {
      const found = await api.orders.getById(orderId)
      if (found) setOrder(found)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void loadOrder()
    const interval = window.setInterval(() => void loadOrder(), 5000)
    return () => window.clearInterval(interval)
  }, [loadOrder])

  useEffect(() => {
    if (order?.payment_status !== 'approved' || celebrated.current) return
    celebrated.current = true
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
  }, [order?.payment_status])

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    window.setTimeout(() => setCopied(null), 2000)
  }

  const paid = order?.payment_status === 'approved'
  const failed = order?.payment_status === 'failed' || order?.payment_status === 'refunded'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${paid ? 'bg-emerald-100 text-emerald-600' : failed ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
            {loading && !order ? <Loader2 className="w-9 h-9 animate-spin" /> : paid ? <CheckCircle2 className="w-10 h-10" /> : failed ? <AlertCircle className="w-10 h-10" /> : <Clock3 className="w-10 h-10" />}
          </div>

          <span className={`text-xs font-bold uppercase tracking-widest ${paid ? 'text-emerald-600' : failed ? 'text-red-600' : 'text-amber-600'}`}>
            {paid ? 'Pagamento confirmado' : failed ? 'Pagamento não concluído' : 'Aguardando pagamento via Pix'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 mb-2 break-words">
            Pedido #{order?.id || orderId}
          </h1>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mb-6">
            {paid
              ? 'A SyncPay confirmou o pagamento. Seu pedido agora seguirá para preparação.'
              : failed
                ? 'A cobrança não foi aprovada. Nenhuma produção ou liberação foi iniciada.'
                : 'Escaneie o QR Code ou copie o código Pix abaixo. Esta página será atualizada automaticamente após a confirmação da SyncPay.'}
          </p>

          {!paid && !failed && order?.pix_code && (
            <div className="mx-auto mb-6 max-w-md rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <QRCodeSVG value={order.pix_code} size={220} level="M" className="max-w-full" />
              </div>
              <div className="mt-4 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Pix Copia e Cola</span>
                <p className="mt-2 max-h-20 overflow-y-auto break-all rounded-xl bg-white p-3 font-mono text-[10px] text-slate-600">{order.pix_code}</p>
                <button type="button" onClick={() => copyToClipboard(order.pix_code!, 'pix')} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700">
                  {copied === 'pix' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied === 'pix' ? 'Código copiado' : 'Copiar código Pix'}
                </button>
              </div>
            </div>
          )}

          {!paid && !failed && order && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-[11px] font-semibold text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
              Verificando o pagamento automaticamente
              <button type="button" onClick={() => void loadOrder()} className="ml-1 inline-flex items-center gap-1 text-blue-600 hover:underline">
                <RefreshCw className="h-3 w-3" /> Atualizar
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {paid && (
              <Link to="/dashboard/tags" className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2">
                <Radio className="w-4 h-4" />
                <span>Ver minhas Tags no painel</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
            <Link to="/dashboard" className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition">
              Ir para o Dashboard
            </Link>
          </div>
        </div>

        {paid && order?.assigned_serials && order.assigned_serials.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs mb-8">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
              <Radio className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Seriais de ativação deste pedido</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.assigned_serials.map((serial) => (
                <div key={serial} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-mono text-xs font-bold text-slate-800">{serial}</span>
                  <button onClick={() => copyToClipboard(serial, serial)} className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition flex items-center gap-1 text-[11px]">
                    {copied === serial ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied === serial ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {order && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between gap-3">
              <span>Detalhes de envio</span>
              {order.tracking_code && (
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <Truck className="w-4 h-4" /> Rastreio: {order.tracking_code}
                </span>
              )}
            </h3>
            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>Destinatário:</strong> {order.user_name} ({order.user_email})</div>
              <div><strong>Endereço:</strong> {order.shipping_address.street}, {order.shipping_address.number}{order.shipping_address.complement ? ` - ${order.shipping_address.complement}` : ''}</div>
              <div><strong>Cidade/UF:</strong> {order.shipping_address.neighborhood}, {order.shipping_address.city} - {order.shipping_address.state} • CEP: {order.shipping_address.zip}</div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
