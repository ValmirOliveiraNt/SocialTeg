import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Radio,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { api } from '../../services/api'
import { User, NFCTag, Order, TagScan } from '../../types'

export const AdminOverviewPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<NFCTag[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [scans, setScans] = useState<TagScan[]>([])

  useEffect(() => {
    api.users.getAll().then(setUsers).catch(() => {})
    api.tags.getAll().then(setTags).catch(() => {})
    api.orders.getAll().then(setOrders).catch(() => {})
    api.scans.getAll().then(setScans).catch(() => {})
  }, [])

  const customers = users.filter((u) => u.role === 'customer')
  const activeTags = tags.filter((t) => t.status === 'active')
  const totalRevenue = orders
    .filter((o) => o.payment_status === 'approved')
    .reduce((sum, o) => sum + o.total, 0)

  const recentOrders = orders.slice(0, 5)

  const scanTimeline = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 14; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`
      map.set(key, 0)
    }

    scans.forEach((s) => {
      const d = new Date(s.scanned_at)
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + 1)
      }
    })

    return Array.from(map.entries()).map(([date, total]) => ({ date, total }))
  }, [scans])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Visão Geral do SaaS AvaliaTeg
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Métricas consolidadas de clientes, hardware NFC em operação, faturamento e interações.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Receita Bruta</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            R$ {totalRevenue.toFixed(2).replace('.', ',')}
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{orders.length} pedidos confirmados</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total de Clientes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{customers.length}</div>
          <div className="mt-2 text-[11px] text-slate-500">
            {users.filter((u) => u.status === 'active').length} contas ativas
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tags em Operação</span>
            <Radio className="w-4 h-4 text-purple-600 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{activeTags.length}</div>
          <div className="mt-2 text-[11px] text-slate-500">de {tags.length} tags fabricadas</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Scans Globais</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{scans.length}</div>
          <div className="mt-2 text-[11px] text-indigo-600 font-bold">100% redirecionamento dinâmico</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Aproximações NFC Globais (Últimos 14 dias)
            </h3>
            <p className="text-xs text-slate-500">
              Volume total de clientes que aproximaram smartphones de Tags de todos os estabelecimentos.
            </p>
          </div>
          <div className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
            {scans.length} scans totais
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={scanTimeline}>
              <defs>
                <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#9333ea" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  border: 'none',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#9333ea"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#adminGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Últimos Pedidos na Plataforma</h3>
            <p className="text-xs text-slate-500">Pedidos de Tags NFC e stands físicos.</p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {recentOrders.map((ord) => (
            <div
              key={ord.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-bold flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900">
                    {ord.user_name} ({ord.user_email})
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Pedido #{ord.id} • {ord.items.length} produto(s)
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-center">
                <span className="font-bold text-slate-900">
                  R$ {ord.total.toFixed(2).replace('.', ',')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {ord.payment_status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
