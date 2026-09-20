import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter } from 'lucide-react'
import { Order, OrderStatus } from '../../types'
import { api } from '../../services/api'

export const AdminOrdersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    api.orders.getAll().then(setOrders).catch(() => {})
  }, [refreshTrigger])

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.tracking_code && o.tracking_code.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchStatus = statusFilter === 'all' || o.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [orders, searchTerm, statusFilter])

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await api.orders.update({ id: orderId, status })
      await api.logs.add({
        action: 'ADMIN_UPDATE_ORDER_STATUS',
        entity_type: 'order',
        entity_id: orderId,
        details: `Status do pedido ${orderId} atualizado para ${status}.`,
      })
    } catch {}
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestão de Pedidos & Faturamento
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de pedidos de hardware, status de despacho e código de rastreamento.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ID, cliente ou código de rastreio..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">Todos os Status ({orders.length})</option>
            <option value="paid">Pagamento Aprovado</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
            <option value="pending">Pendente</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Pedido & Data</th>
                <th className="py-3.5 px-4">Cliente Comprador</th>
                <th className="py-3.5 px-4">Produtos / Quantidade</th>
                <th className="py-3.5 px-4">Valor Total</th>
                <th className="py-3.5 px-4 text-center">Status de Envio</th>
                <th className="py-3.5 px-4 text-right">Alterar Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">#{ord.id}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(ord.created_at).toLocaleDateString('pt-BR')} via {ord.payment_method.toUpperCase()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{ord.user_name}</div>
                      <div className="text-[10px] text-slate-400">{ord.user_email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">
                        {ord.items.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Envio para: {ord.shipping_address.city} - {ord.shipping_address.state}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      R$ {ord.total.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          ord.status === 'delivered'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'shipped'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : ord.status === 'paid'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {ord.status.toUpperCase()}
                      </span>
                      {ord.tracking_code && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {ord.tracking_code}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(ord.id, e.target.value as OrderStatus)
                        }
                        className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      >
                        <option value="paid">Pago</option>
                        <option value="shipped">Despachado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

