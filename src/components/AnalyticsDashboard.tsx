import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRight,
  Building2,
  Download,
  RefreshCw,
  Radio,
  Users,
  Wallet,
  ShieldCheck,
  AlertCircle,
  Clock3,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import type { Analytics, Breakdown } from '../types/analytics'

const number = (n: number) => new Intl.NumberFormat('pt-BR').format(n)
const money = (n: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    n,
  )
const date = (raw: string, time = false) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    ...(time ? ({ hour: '2-digit', minute: '2-digit' } as const) : {}),
  }).format(
    new Date(
      /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw) ? raw : raw.replace(' ', 'T') + 'Z',
    ),
  )
const destinations: Record<string, string> = {
  google_review: 'Google Avaliações',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  website: 'Site / cardápio',
  contact: 'Contato',
  address: 'Como chegar',
  ifood: 'iFood',
  youtube: 'YouTube',
  custom_url: 'Link personalizado',
}
const payment: Record<string, string> = {
  approved: 'Aprovado',
  pending: 'Pendente',
  failed: 'Falhou',
  refunded: 'Reembolsado',
}
const statuses: Record<string, string> = {
  active: 'Ativa',
  inactive: 'Inativa',
  blocked: 'Bloqueada',
  pending_activation: 'Aguardando ativação',
  available: 'Disponível',
  reserved: 'Reservada',
  sold: 'Vendida',
  lost: 'Perdida',
}

const accessStyle = (method: string) =>
  method === 'NFC'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : method === 'NFC provável / link antigo'
      ? 'bg-teal-50 text-teal-700 border-teal-200'
    : method === 'QR Code'
      ? 'bg-violet-50 text-violet-700 border-violet-200'
      : method === 'Link direto'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
      : method === 'Legado / não verificado'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200'

const cityState = (value: string) =>
  value ? value.replace(/\s+-\s+/, '/') : 'Não cadastrado'

function Change({ value, previous }: { value: number; previous: number }) {
  if (!previous)
    return (
      <span className="text-slate-500 text-xs">
        {value
          ? 'Sem base anterior para comparação'
          : 'Sem variação no período'}
      </span>
    )
  const delta = ((value - previous) / previous) * 100
  const Icon = delta >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-amber-700' : 'text-slate-500'}`}
    >
      <Icon size={14} />
      {delta > 0 ? '+' : ''}
      {delta.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%{' '}
      <span className="font-normal text-slate-500">vs. período anterior</span>
    </span>
  )
}

function Card({
  title,
  value,
  detail,
  icon: Icon,
  children,
}: {
  title: string
  value: string
  detail: string
  icon: typeof Activity
  children?: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-slate-500">{title}</h2>
        <span className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
          <Icon size={17} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 tabular-nums break-words">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-500">{detail}</p>
      {children && (
        <div className="mt-3 border-t border-slate-100 pt-3">{children}</div>
      )}
    </section>
  )
}

function Distribution({
  title,
  subtitle,
  items,
  total,
}: {
  title: string
  subtitle: string
  items: Breakdown[]
  total: number
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      <div className="mt-5 space-y-4">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex justify-between gap-3 text-xs">
                <span className="truncate text-slate-600" title={item.label}>
                  {destinations[item.label] || item.label}
                </span>
                <span className="shrink-0 font-semibold text-slate-900">
                  {number(item.total)}{' '}
                  <span className="font-normal text-slate-400">
                    ·{' '}
                    {total
                      ? ((item.total / total) * 100).toLocaleString('pt-BR', {
                          maximumFractionDigits: 1,
                        })
                      : 0}
                    %
                  </span>
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${total ? (item.total / total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">
            Sem registros neste período.
          </p>
        )}
      </div>
    </section>
  )
}

function exportReport(data: Analytics) {
  const cell = (value: string | number) =>
    `"${String(value)
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`
  const rows: (string | number)[][] = [
    ['Relatório SocialTeg', 'Acessos registrados'],
    ['Início', data.start],
    ['Fim', data.end],
    ['Fuso', data.timezone],
    ['Atualizado em', data.generated_at],
    ['Total', data.summary.total],
    ['Período anterior', data.summary.previous],
    [],
    ['Data', 'Acessos'],
    ...data.timeline.map((p) => [p.date, p.total]),
    [],
    ['Tag', 'Estabelecimento', 'Acessos'],
    ...data.ranking.map((t) => [t.name, t.business || '', t.total]),
  ]
  const blob = new Blob(
    ['\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n')],
    { type: 'text/csv;charset=utf-8' },
  )
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `socialteg-${data.days}dias-${data.generated_at.slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function AnalyticsDashboard({ admin = false }: { admin?: boolean }) {
  const { currentUser } = useAuth()
  const [days, setDays] = useState(30)
  const [business, setBusiness] = useState('')
  const [result, setResult] = useState<{ key: string; data: Analytics } | null>(
    null,
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const userId = currentUser?.id
  const queryKey = `${userId}:${days}:${business}:${refresh}`
  const data = result?.key === queryKey ? result.data : null
  const gradient = useId().replaceAll(':', '')
  const base = admin ? '/admin' : '/dashboard'

  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    let busy = false
    async function load() {
      if (busy) return
      busy = true
      setLoading(true)
      try {
        const result = await api.analytics.get(
          days,
          business,
          controller.signal,
        )
        if (!controller.signal.aborted) {
          setResult({ key: queryKey, data: result })
          setError('')
        }
      } catch (e) {
        if (!controller.signal.aborted)
          setError(
            e instanceof Error ? e.message : 'Falha ao carregar as métricas.',
          )
      } finally {
        busy = false
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load()
    }, 60000)
    return () => {
      controller.abort()
      window.clearInterval(timer)
    }
  }, [userId, days, business, queryKey])

  const total = data?.summary.total || 0
  const quality = total ? (data!.summary.identified / total) * 100 : null
  const peak = data?.hours.reduce(
    (best, h) => (h.total > best.total ? h : best),
    { hour: 0, total: 0 },
  )
  return (
    <div className="space-y-6 pb-6">
      <header className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-indigo-300">
              AvaliaTag /{' '}
              {admin ? 'Visão administrativa' : 'Inteligência do negócio'}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {admin
                ? 'Sua operação, em perspectiva.'
                : 'Cada interação conta.'}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
              {admin
                ? 'Acompanhe a base de clientes, os pedidos e o desempenho das tags.'
                : 'Entenda o movimento das suas tags e descubra onde estão as oportunidades.'}
            </p>
          </div>
          <Link
            to={`${base}/tags`}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-semibold hover:bg-white/20"
          >
            Gerenciar tags <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex rounded-xl border border-slate-200 bg-white p-1"
            role="group"
            aria-label="Período de análise"
          >
            {[7, 30, 90].map((n) => (
              <button
                key={n}
                aria-pressed={days === n}
                onClick={() => setDays(n)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${days === n ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                {n} dias
              </button>
            ))}
          </div>
          <select
            aria-label="Filtrar estabelecimento"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
            className="max-w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs text-slate-600"
          >
            <option value="">Todos os estabelecimentos</option>
            {data?.businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
            {business && !data && (
              <option value={business}>Estabelecimento selecionado</option>
            )}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefresh((n) => n + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            disabled={!data || !!error}
            onClick={() => data && exportReport(data)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-semibold text-slate-600 disabled:opacity-50"
          >
            <Download size={14} />
            CSV
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 size={13} />
          {data
            ? `Atualizado em ${date(data.generated_at, true)} · atualização a cada 60 s`
            : 'Carregando indicadores…'}
        </span>
        <span>Horário de Brasília · período atual inclui hoje</span>
      </div>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertCircle size={18} className="shrink-0" />
          <div>
            {error}
            {data && (
              <p className="mt-1 text-xs">
                Os números abaixo são da última atualização bem-sucedida e podem
                estar desatualizados.
              </p>
            )}
            <button
              className="mt-2 block font-semibold underline"
              onClick={() => setRefresh((n) => n + 1)}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}
      {!data && loading && (
        <div
          role="status"
          aria-label="Carregando dashboard"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {[0, 1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-40 animate-pulse rounded-2xl bg-slate-200/60"
            />
          ))}
        </div>
      )}
      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Acessos no período"
              value={number(total)}
              detail={`${number(data.summary.today)} hoje · ${number(data.summary.previous)} no período anterior`}
              icon={Activity}
            >
              <Change value={total} previous={data.summary.previous} />
            </Card>
            <Card
              title="Tags acessadas"
              value={number(data.summary.active_tags)}
              detail={`${number(data.summary.active_tags)} receberam acesso · ${number(data.inventory.active)} ativas`}
              icon={Radio}
            >
              <span className="text-xs text-slate-500">
                {number(data.inventory.silent)} tags ativas sem acessos no período
              </span>
            </Card>
            {admin && data.admin ? (
              <>
                <Card
                  title="Receita de pedidos aprovados"
                  value={money(data.admin.revenue)}
                  detail={`${number(data.admin.approved)} pedidos · ticket médio ${money(data.admin.average_ticket)}`}
                  icon={Wallet}
                >
                  <Change
                    value={data.admin.revenue}
                    previous={data.admin.previous_revenue}
                  />
                </Card>
                <Card
                  title="Base de clientes"
                  value={number(data.admin.customers)}
                  detail={`${number(data.admin.active_customers)} clientes com conta ativa`}
                  icon={Users}
                >
                  <span className="text-xs text-slate-500">
                    Base atual · todos os estabelecimentos
                  </span>
                </Card>
              </>
            ) : (
              <>
                <Card
                  title="Estabelecimentos"
                  value={number(data.inventory.businesses)}
                  detail="Locais incluídos nesta análise"
                  icon={Building2}
                >
                  <Link
                    className="text-xs font-semibold text-indigo-600"
                    to="/dashboard/businesses"
                  >
                    Gerenciar estabelecimentos →
                  </Link>
                </Card>
                <Card
                  title="Origem identificada"
                  value={
                    quality === null
                      ? '—'
                      : `${quality.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                  }
                  detail="Acessos com identificação explícita NFC ou QR"
                  icon={ShieldCheck}
                >
                  <span className="text-xs text-slate-500">
                    {number(data.summary.legacy)} registros legados não
                    verificados
                  </span>
                </Card>
              </>
            )}
          </div>
          {admin && (
            <p className="text-[11px] leading-5 text-slate-500">
              Receita por data de criação dos pedidos, considerando pagamento
              aprovado e excluindo cancelados; não representa recebimento
              bancário. Indicadores financeiros e base de clientes são globais;
              o filtro de estabelecimento se aplica à telemetria.
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Evolução de acessos
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {date(data.start)} a {date(data.end)} · {days} dias,
                    incluindo hoje
                  </p>
                </div>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {number(total)} registros
                </span>
              </div>
              {total ? (
                <div
                  className="h-64 min-w-0"
                  role="img"
                  aria-label={`Gráfico de acessos diários: ${total} registros em ${days} dias. Detalhes disponíveis no CSV.`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.timeline}
                      margin={{ left: -20, right: 8 }}
                    >
                      <defs>
                        <linearGradient
                          id={gradient}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity={0.22}
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) =>
                          `${v.slice(8, 10)}/${v.slice(5, 7)}`
                        }
                        minTickGap={32}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      <Tooltip
                        labelFormatter={(v) =>
                          String(v).split('-').reverse().join('/')
                        }
                        contentStyle={{
                          borderRadius: 12,
                          borderColor: '#e2e8f0',
                          fontSize: 12,
                        }}
                      />
                      <Area
                        name="Acessos"
                        type="monotone"
                        dataKey="total"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fill={`url(#${gradient})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-center">
                  <Activity className="mb-3 text-slate-300" size={32} />
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhum acesso registrado neste período
                  </p>
                  <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
                    Confira se suas tags estão ativas ou selecione outro período
                    e estabelecimento.
                  </p>
                  <Link
                    to={`${base}/tags`}
                    className="mt-4 text-xs font-semibold text-indigo-600"
                  >
                    Ver minhas tags →
                  </Link>
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900">
                Atenção à operação
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Sinais para orientar os próximos passos.
              </p>
              <div className="mt-5 space-y-3">
                <Insight
                  value={number(data.inventory.pending)}
                  title="Tags aguardando ativação"
                  description="Revise vínculo e configuração para começar a receber acessos."
                  href={`${base}/tags`}
                />
                <Insight
                  value={number(data.inventory.silent)}
                  title="Tags ativas sem acessos"
                  description={`Nenhum acesso nos ${days} dias selecionados. Confira exposição e funcionamento.`}
                  href={`${base}/tags`}
                />
                {admin && data.admin ? (
                  <Insight
                    value={number(data.admin.awaiting_shipping)}
                    title="Pedidos pagos para enviar"
                    description={`${number(data.admin.pending_orders)} pedidos aguardam pagamento na plataforma.`}
                    href="/admin/orders"
                  />
                ) : (
                  <Insight
                    value={
                      peak?.total
                        ? `${String(peak.hour).padStart(2, '0')}h`
                        : '—'
                    }
                    title="Horário de maior movimento"
                    description={
                      peak?.total
                        ? `${number(peak.total)} acessos registrados nesta faixa de uma hora.`
                        : 'Será identificado após as primeiras leituras.'
                    }
                  />
                )}
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <Distribution
              title="Origem dos acessos"
              subtitle="Identificação pelo link utilizado na tag ou QR."
              items={data.methods}
              total={total}
            />
            <Distribution
              title="Sistemas operacionais"
              subtitle="Detectados a partir do navegador do dispositivo."
              items={data.systems}
              total={total}
            />
            <Distribution
              title="Ações realmente abertas"
              subtitle="Cliques registrados nos botões após a leitura da tag."
              items={data.destinations}
              total={data.destinations.reduce((sum, item) => sum + item.total, 0)}
            />
            <Distribution
              title="Local das tags acessadas"
              subtitle="Cidade/UF cadastrada no estabelecimento da tag. Top 6."
              items={data.regions}
              total={total}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 xl:col-span-2">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Desempenho por tag
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    As 10 tags com mais acessos no período selecionado.
                  </p>
                </div>
                <Link
                  to={`${base}/tags`}
                  className="text-xs font-semibold text-indigo-600"
                >
                  Ver todas →
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-xs">
                  <thead className="border-b border-slate-100 text-slate-400">
                    <tr>
                      <th className="pb-3 font-medium">
                        Tag / estabelecimento
                      </th>
                      <th className="pb-3 font-medium">Status atual</th>
                      <th className="pb-3 text-right font-medium">Acessos</th>
                      <th className="pb-3 text-right font-medium">
                        Participação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.ranking.map((t) => (
                      <tr key={t.id}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-slate-800">
                            {t.name}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {t.business || 'Sem estabelecimento'}
                            {t.location ? ` · ${t.location}` : ''}
                          </p>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-md px-2 py-1 text-[10px] ${t.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                          >
                            {statuses[t.status] || t.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold tabular-nums text-slate-800">
                          {number(t.total)}
                        </td>
                        <td className="py-3 text-right text-slate-500">
                          {total
                            ? ((t.total / total) * 100).toLocaleString(
                                'pt-BR',
                                { maximumFractionDigits: 1 },
                              )
                            : 0}
                          %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!data.ranking.length && (
                  <p className="py-8 text-center text-sm text-slate-400">
                    Nenhuma tag neste estabelecimento.
                  </p>
                )}
              </div>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900">
                Movimento por horário
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Acessos acumulados · horário de Brasília.
              </p>
              <div
                className="mt-6 h-56"
                role="img"
                aria-label={
                  peak?.total
                    ? `Pico às ${peak.hour} horas com ${peak.total} acessos`
                    : 'Sem movimento por horário'
                }
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hours} margin={{ left: -24 }}>
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(v) => `${v}h`}
                      interval={5}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      labelFormatter={(v) => `${v}h – ${v}h59`}
                      contentStyle={{ borderRadius: 12, fontSize: 12 }}
                    />
                    <Bar
                      name="Acessos"
                      dataKey="total"
                      fill="#818cf8"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          {admin && data.admin && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">
                  Pedidos recentes
                </h2>
                <Link
                  className="text-xs font-semibold text-indigo-600"
                  to="/admin/orders"
                >
                  Gerenciar pedidos →
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {data.admin.recent_orders.map((o) => (
                  <div
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {o.user_name}
                      </p>
                      <p className="mt-1 text-slate-400">
                        {o.id} · {date(o.created_at, true)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-slate-900">
                        {money(o.total)}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-1 ${o.payment_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                      >
                        {payment[o.payment_status] || o.payment_status}
                        {o.status === 'cancelled' ? ' · Cancelado' : ''}
                      </span>
                    </div>
                  </div>
                ))}
                {!data.admin.recent_orders.length && (
                  <p className="py-6 text-sm text-slate-400">
                    Nenhum pedido cadastrado.
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900">
                Últimos acessos registrados
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Até 20 registros do filtro atual. Os totais acima consideram
                todos os registros do período.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-y border-slate-200 bg-slate-50/80 text-slate-500">
                  <tr>
                    {[
                      'Data e hora',
                      'Tag',
                      'Forma de acesso',
                      'Dispositivo',
                      'Cidade/UF',
                      'Ponto físico',
                      'Primeiro destino aberto',
                    ].map((h) => (
                      <th key={h} className="whitespace-nowrap px-5 py-3 font-semibold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent.map((s) => (
                    <tr key={s.id} className="group hover:bg-indigo-50/40">
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <span className="font-semibold text-slate-700">
                          {date(s.scanned_at, true)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-900">{s.name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${accessStyle(s.method)}`}
                          title={
                            s.method === 'Legado / não verificado'
                              ? 'Registro anterior à identificação confiável de NFC e QR Code'
                              : undefined
                          }
                        >
                          {s.method}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        <span className="font-medium text-slate-700">
                          {s.operating_system || 'Não identificado'}
                        </span>
                        <span className="text-slate-400"> · {s.browser || 'Navegador não identificado'}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-700">
                        {cityState(s.business_location)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                          {s.location || 'Não cadastrado'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {s.opened_destination ? (
                          <span className="inline-flex whitespace-nowrap rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                            {destinations[s.opened_destination] || s.opened_destination}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-slate-400">Não abriu um destino</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.recent.length && (
                <p className="py-10 text-center text-sm text-slate-400">
                  Os próximos acessos aparecerão aqui após a atualização.
                </p>
              )}
            </div>
          </section>

          <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
            <ShieldCheck size={20} className="shrink-0 text-indigo-500" />
            <div className="text-xs leading-6 text-slate-600">
              <p className="font-semibold text-slate-800">
                Como ler estes números
              </p>
              <p>
                Cada registro representa uma abertura da página da tag, não uma
                pessoa única, avaliação publicada ou venda. Reaberturas podem
                gerar novos acessos. Comparações usam o mesmo número de dias e o
                mesmo horário de corte. Registros antigos mantêm a classificação
                “Legado / não verificado”, pois a origem pode ter sido
                presumida.
              </p>
              {admin && (
                <p>
                  Origem identificada em{' '}
                  {quality === null
                    ? '—'
                    : `${quality.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}{' '}
                  dos acessos; {number(data.summary.legacy)} registros legados
                  neste período.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Insight({
  value,
  title,
  description,
  href,
}: {
  value: string
  title: string
  description: string
  href?: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        <span className="text-xl font-bold tabular-nums text-slate-900">
          {value}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{description}</p>
      {href && (
        <Link
          to={href}
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600"
        >
          Conferir <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}
