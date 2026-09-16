import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag, Truck, CheckCircle2, Radio } from 'lucide-react'
import { Order } from '../../types'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const CustomerOrdersPage: React.FC = () => {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) return
    api.orders.getAll(currentUser.id).then(setOrders).catch(() => {})
  }, [currentUser])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Meus Pedidos de Tags NFC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Acompanhe o envio, rastreamento e códigos seriais das suas Tags físicas adquiridas.
          </p>
        </div>

        <Link
          to="/loja"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Comprar Mais Tags</span>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Nenhum pedido realizado ainda</h3>
          <p className="text-xs text-slate-500 mb-6">
            Adquira seus primeiros displays acrílicos ou adesivos NFC em nossa loja oficial.
          </p>
          <Link
            to="/loja"
            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Acessar Loja
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm">
                      Pedido #{order.id}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Realizado em {new Date(order.created_at).toLocaleDateString('pt-BR')} • Pagamento: {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pagamento Aprovado</span>
                  </span>

                  <span className="text-sm font-black text-slate-900">
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Itens Inclusos
                  </span>
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-600">
                      <span>
                        {item.quantity}x {item.product_name}
                      </span>
                      <span className="font-semibold text-slate-800">
                        R$ {item.total.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Status de Envio & Rastreamento
                  </span>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span className="font-mono font-bold text-slate-800">
                        {order.tracking_code}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(order.tracking_code || '')}
                      className="text-blue-600 hover:underline font-semibold cursor-pointer text-[11px]"
                    >
                      {copiedCode === order.tracking_code ? 'Copiado' : 'Copiar Código'}
                    </button>
                  </div>
                </div>
              </div>

              {order.assigned_serials && order.assigned_serials.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block mb-2">
                    Tags Físicas deste Pedido (Seriais para Ativação)
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {order.assigned_serials.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-mono text-[11px] font-bold border border-blue-200"
                      >
                        <Radio className="w-3 h-3 text-blue-600" />
                        <span>{s}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
