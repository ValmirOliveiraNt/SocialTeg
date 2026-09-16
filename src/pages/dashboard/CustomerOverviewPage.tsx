import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  TrendingUp,
  Building2,
  Tag,
  ArrowRight,
  Sparkles,
  Clock,
  Smartphone,
  MapPin,
  Activity,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { NFCTag, Business, TagScan, Plan } from '../../types'

function parseScanDate(raw: string): Date {
  if (!raw) return new Date()
  if (raw.includes('Z') || raw.includes('+')) {
    return new Date(raw)
  }
  return new Date(raw.replace(' ', 'T') + 'Z')
}

export const CustomerOverviewPage: React.FC = () => {
  const { currentUser } = useAuth()
  const [tags, setTags] = useState<NFCTag[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [scans, setScans] = useState<TagScan[]>([])
  const [plans, setPlans] = useState<Plan[]>([])

  useEffect(() => {
    if (!currentUser) return
    api.tags.getAll(currentUser.id).then(setTags).catch(() => {})
    api.businesses.getAll(currentUser.id).then(setBusinesses).catch(() => {})
    api.scans.getAll(currentUser.id).then(setScans).catch(() => {})
    api.plans.getAll().then(setPlans).catch(() => {})
  }, [currentUser])

  const plan = useMemo(() => {
    return plans.find((p) => p.id === currentUser?.plan_id) || null
  }, [plans, currentUser])

  const now = new Date()
  const todayDateStr = now.toLocaleDateString('pt-BR')
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

  const activeTags = tags.filter((t) => t.status === 'active')
  const inactiveTags = tags.filter((t) => t.status !== 'active')

  const scansToday = scans.filter((s) => parseScanDate(s.scanned_at).toLocaleDateString('pt-BR') === todayDateStr).length
  const scans7Days = scans.filter((s) => parseScanDate(s.scanned_at) >= sevenDaysAgo).length
  const scans30Days = scans.filter((s) => parseScanDate(s.scanned_at) >= thirtyDaysAgo).length

  const chartData = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}`
      map.set(key, 0)
    }

    scans.forEach((s) => {
      const d = parseScanDate(s.scanned_at)
      if (d >= thirtyDaysAgo) {
        const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`
        if (map.has(key)) {
          map.set(key, (map.get(key) || 0) + 1)
        }
      }
    })

    return Array.from(map.entries()).map(([date, total]) => ({ date, total }))
  }, [scans])

  const deviceData = useMemo(() => {
    let ios = 0
    let android = 0
    let other = 0
    scans.forEach((s) => {
      if (s.operating_system === 'iOS') ios++
      else if (s.operating_system === 'Android') android++
      else other++
    })
    return [
      { name: 'iOS (iPhone)', value: ios || 1, color: '#3b82f6' },
      { name: 'Android', value: android || 1, color: '#10b981' },
      { name: 'Outros', value: other || 0, color: '#94a3b8' },
    ]
  }, [scans])

  const rankingTags = useMemo(() => {
    const counts = new Map<string, number>()
    scans.forEach((s) => {
      counts.set(s.tag_id, (counts.get(s.tag_id) || 0) + 1)
    })
    return [...tags]
      .map((t) => ({
        tag: t,
        scanCount: counts.get(t.id) || 0,
      }))
      .sort((a, b) => b.scanCount - a.scanCount)
  }, [tags, scans])

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Painel Geral do Estabelecimento
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Métricas de aproximação NFC em tempo real e performance das Tags físicas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/tags"
            className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-blue-600" />
            <span>Gerenciar Tags ({tags.length})</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Tags Ativas</span>
            <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{activeTags.length}</span>
            <span className="text-xs text-slate-400">de {tags.length} tags</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>{inactiveTags.length} pendente / inativa</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Scans este Mês</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{scans30Days}</span>
            <span className="text-xs text-emerald-600 font-bold">+18%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {scansToday} hoje • {scans7Days} nos últimos 7 dias
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Locais / Lojas</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{businesses.length}</span>
            <span className="text-xs text-slate-400">cadastrado(s)</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {businesses[0]?.name || 'Nenhum local'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Plano Atual</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 truncate">
              {plan?.name.replace('Plano ', '') || 'Pro'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 font-semibold">
            <Link to="/dashboard/plans" className="hover:underline">
              Ver limites e benefícios →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Interações nos Últimos 30 Dias
              </h3>
              <p className="text-xs text-slate-500">
                Toques na Tag NFC por dia em todos os seus estabelecimentos.
              </p>
            </div>
            <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              {scans.length} scans totais
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scanGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Aparelhos dos Clientes
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Distribuição de sistemas operacionais detectados.
            </p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              {deviceData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    ></span>
                    <span>{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Ranking de Tags com Maior Utilização
            </h3>
            <p className="text-xs text-slate-500">
              Identifique quais mesas, caixas ou balcões geram mais engajamento.
            </p>
          </div>
          <Link
            to="/dashboard/tags"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {rankingTags.map((item, index) => {
            const biz = businesses.find((b) => b.id === item.tag.business_id)
            const percentage =
              scans.length > 0 ? Math.round((item.scanCount / scans.length) * 100) : 0

            return (
              <div
                key={item.tag.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm font-black text-slate-400">#{index + 1}</span>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                    <Radio className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{item.tag.name}</h4>
                    <p className="text-[11px] text-slate-500">
                      {biz?.name || 'Sem estabelecimento'} • Local: {item.tag.location || 'Geral'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-center">
                  <div className="w-32 hidden sm:block">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">{item.scanCount} scans</div>
                    <div className="text-[10px] text-slate-400 font-semibold">{percentage}% do total</div>
                  </div>

                  <Link
                    to={`/dashboard/tags/${item.tag.id}`}
                    className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                    title="Configurar Tag"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Feed de Aproximações NFC em Tempo Real */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Histórico de Leituras em Tempo Real</span>
            </h3>
            <p className="text-xs text-slate-500">
              Registros detalhados com data, hora, aparelho, navegador e localização de cada toque no NFC.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-center">
            {scans.length} toques registrados
          </span>
        </div>

        {scans.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <Radio className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-pulse" />
            <p className="font-semibold text-slate-600">Nenhuma leitura registrada ainda</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Assim que um cliente encostar o celular na sua Tag NFC, os dados de hora, aparelho e local aparecerão aqui em tempo real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Data e Hora</th>
                  <th className="py-3 px-4">Tag / Local</th>
                  <th className="py-3 px-4">Dispositivo & Sistema</th>
                  <th className="py-3 px-4">Navegador</th>
                  <th className="py-3 px-4">Localização Detectada</th>
                  <th className="py-3 px-4 text-right">Destino Aberto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {scans.slice(0, 30).map((scan) => {
                  const tagItem = tags.find((t) => t.id === scan.tag_id)
                  const isIOS = scan.operating_system === 'iOS'
                  const isAndroid = scan.operating_system === 'Android'
                  const dateObj = parseScanDate(scan.scanned_at)

                  return (
                    <tr key={scan.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>
                            {dateObj.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 ml-5">
                          {dateObj.toLocaleDateString('pt-BR')}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {scan.tag_name || tagItem?.name || 'Tag NFC'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {scan.tag_location || tagItem?.location || 'Balcão Geral'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            className={`font-semibold px-2 py-0.5 rounded-md text-[10px] ${
                              isIOS
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : isAndroid
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {scan.operating_system}
                          </span>
                          <span className="text-[11px] text-slate-500">({scan.device_type})</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        {scan.browser}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{scan.region || 'São Paulo, SP'}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 capitalize">
                          {scan.destination_type.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
