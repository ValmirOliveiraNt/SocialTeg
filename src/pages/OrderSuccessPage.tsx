import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import confetti from 'canvas-confetti'
import {
  CheckCircle2,
  ArrowRight,
  Radio,
  Truck,
  Copy,
  Check,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Order } from '../types'
import { api } from '../services/api'

export const OrderSuccessPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null)

  useEffect(() => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.5 },
    })

    if (orderId) {
      api.orders.getById(orderId).then((found) => {
        if (found) setOrder(found)
      }).catch(() => {})
    }
  }, [orderId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSerial(text)
    setTimeout(() => setCopiedSerial(null), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
            Pagamento Confirmado
          </span>
          <h1 className="text-3xl font-black text-slate-900 mt-1 mb-2">
            Pedido #{order?.id || orderId}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Obrigado pela sua compra! Seu pedido foi aprovado e as Tags NFC já foram geradas no sistema e associadas à sua conta.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/dashboard/tags"
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Ver e Ativar Minhas Tags no Painel</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Ir para o Dashboard
            </Link>
          </div>
        </div>

        {order?.assigned_serials && order.assigned_serials.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs mb-8">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
              <Radio className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">
                Seriais de Ativação Gerados para este Pedido
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Estes códigos seriais também foram gravados nas Tags físicas que serão despachadas para o seu endereço:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {order.assigned_serials.map((serial) => (
                <div
                  key={serial}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <span className="font-mono text-xs font-bold text-slate-800">{serial}</span>
                  <button
                    onClick={() => copyToClipboard(serial)}
                    className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-white transition flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    {copiedSerial === serial ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedSerial === serial ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {order && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Detalhes de Envio</span>
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Rastreio: {order.tracking_code}
              </span>
            </h3>

            <div className="text-xs text-slate-600 space-y-1">
              <div><strong>Destinatário:</strong> {order.user_name} ({order.user_email})</div>
              <div>
                <strong>Endereço:</strong> {order.shipping_address.street}, {order.shipping_address.number}
                {order.shipping_address.complement ? ` - ${order.shipping_address.complement}` : ''}
              </div>
              <div>
                <strong>Cidade/UF:</strong> {order.shipping_address.neighborhood}, {order.shipping_address.city} - {order.shipping_address.state} • CEP: {order.shipping_address.zip}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

