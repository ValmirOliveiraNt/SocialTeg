import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  Search,
  Filter,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  PauseCircle,
  PlayCircle,
  Settings,
  Plus,
  Clock,
  Calendar,
  MapPin,
  Smartphone,
  Activity,
  BarChart2,
  LayoutList,
  LayoutGrid,
  TrendingUp,
  Building2,
  Sparkles,
  ArrowUpDown,
  ArrowLeft,
  ChevronRight,
  Printer,
} from 'lucide-react'
import { NFCTag, TagStatus, Business, TagDestination, TagScan } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { QRCodeModal } from '../../components/QRCodeModal'
import { ActivateTagModal } from '../../components/ActivateTagModal'
import { NFCWriterModal } from '../../components/NFCWriterModal'
import { TagScanHistoryModal } from '../../components/TagScanHistoryModal'
import { getPublicTagUrl } from '../../utils/url'

function formatRelativeScanTime(scan: TagScan): { primary: string; secondary?: string; method: string } {
  const isQR =
    scan.reading_method?.toLowerCase().includes('qr') ||
    scan.referrer?.toLowerCase().includes('qr')
  const method = isQR ? 'QR Code' : 'NFC'

  if (scan.local_time) {
    const todayStr = new Date().toLocaleDateString('pt-BR')
    const isToday = scan.local_date === todayStr
    return {
      primary: isToday ? `Hoje às ${scan.local_time}` : `${scan.local_date} às ${scan.local_time}`,
      secondary: scan.region ? `Localização estimada: ${scan.region}` : undefined,
      method,
    }
  }

  const date = new Date(scan.scanned_at)
  const isNaN = Number.isNaN(date.getTime())
  if (isNaN) return { primary: 'Data desconhecida', method }

  const today = new Date()
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()

  const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return {
    primary: isToday ? `Hoje às ${timeStr}` : `${dateStr} às ${timeStr}`,
    secondary: scan.region ? `Localização estimada: ${scan.region}` : undefined,
    method,
  }
}

export const CustomerTagsPage: React.FC = () => {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [businessFilter, setBusinessFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'scans' | 'recent' | 'name' | 'created'>('scans')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [expandedBusinessId, setExpandedBusinessId] = useState<string | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())

  const [selectedTagForQR, setSelectedTagForQR] = useState<NFCTag | null>(null)
  const [tagToWrite, setTagToWrite] = useState<NFCTag | null>(null)
  const [tagForHistory, setTagForHistory] = useState<NFCTag | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [tags, setTags] = useState<NFCTag[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [destinations, setDestinations] = useState<TagDestination[]>([])
  const [scans, setScans] = useState<TagScan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    Promise.all([
      api.tags.getAll(currentUser.id),
      api.businesses.getAll(currentUser.id),
      api.destinations.getAll(),
      api.scans.getAll(currentUser.id),
    ])
      .then(([tagsData, bizData, destsData, scansData]) => {
        setTags(tagsData || [])
        setBusinesses(bizData || [])
        setDestinations(destsData || [])
        setScans(scansData || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentUser, refreshTrigger])

  // KPIs & Stats
  const activeTagsCount = useMemo(() => tags.filter((t) => t.status === 'active').length, [tags])
  const totalScansCount = useMemo(() => scans.length, [scans])

  const scansTodayCount = useMemo(() => {
    const today = new Date().toLocaleDateString('pt-BR')
    return scans.filter((s) => {
      if (s.local_date) return s.local_date === today
      return new Date(s.scanned_at).toLocaleDateString('pt-BR') === today
    }).length
  }, [scans])

  const nfcScansCount = useMemo(() => {
    return scans.filter(
      (s) => !s.reading_method?.toLowerCase().includes('qr') && !s.referrer?.toLowerCase().includes('qr')
    ).length
  }, [scans])

  const qrScansCount = totalScansCount - nfcScansCount

  // Map scans to tags for ultra-fast lookup
  const scansByTagId = useMemo(() => {
    const map = new Map<string, TagScan[]>()
    scans.forEach((s) => {
      const list = map.get(s.tag_id) || []
      list.push(s)
      map.set(s.tag_id, list)
    })
    return map
  }, [scans])

  // Filter & Sort
  const filteredAndSortedTags = useMemo(() => {
    return tags
      .filter((t) => {
        const biz = businesses.find((b) => b.id === t.business_id)
        const matchesSearch =
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.location && t.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (biz && biz.name.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesStatus = statusFilter === 'all' || t.status === statusFilter
        const matchesBusiness = businessFilter === 'all' || t.business_id === businessFilter

        return matchesSearch && matchesStatus && matchesBusiness
      })
      .sort((a, b) => {
        const aScans = scansByTagId.get(a.id) || []
        const bScans = scansByTagId.get(b.id) || []

        if (sortBy === 'scans') {
          return bScans.length - aScans.length
        }

        if (sortBy === 'recent') {
          const aLatest = aScans.length > 0 ? new Date(aScans[0].scanned_at).getTime() : 0
          const bLatest = bScans.length > 0 ? new Date(bScans[0].scanned_at).getTime() : 0
          return bLatest - aLatest
        }

        if (sortBy === 'name') {
          return a.name.localeCompare(b.name)
        }

        if (sortBy === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        }

        return 0
      })
  }, [tags, searchTerm, statusFilter, businessFilter, sortBy, businesses, scansByTagId])

  const businessGroups = useMemo(() => {
    const groups = new Map<string, { id: string; business?: Business; tags: NFCTag[] }>()
    filteredAndSortedTags.forEach((tag) => {
      const id = tag.business_id || 'unassigned'
      if (!groups.has(id)) groups.set(id, { id, business: businesses.find((b) => b.id === tag.business_id), tags: [] })
      groups.get(id)!.tags.push(tag)
    })
    return Array.from(groups.values()).sort((a, b) => (a.business?.name || 'Sem estabelecimento').localeCompare(b.business?.name || 'Sem estabelecimento'))
  }, [filteredAndSortedTags, businesses])

  const displayedTags = expandedBusinessId
    ? filteredAndSortedTags.filter((tag) => (tag.business_id || 'unassigned') === expandedBusinessId)
    : []
  const expandedBusiness = businessGroups.find((group) => group.id === expandedBusinessId)
  const selectedDisplayedTags = displayedTags.filter((tag) => selectedTagIds.has(tag.id))
  const allDisplayedSelected = displayedTags.length > 0 && selectedDisplayedTags.length === displayedTags.length

  useEffect(() => {
    setSelectedTagIds(new Set())
  }, [expandedBusinessId])

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((current) => {
      const next = new Set(current)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  const toggleAllDisplayedTags = () => {
    setSelectedTagIds(allDisplayedSelected ? new Set() : new Set(displayedTags.map((tag) => tag.id)))
  }

  const handleCopyLink = (publicId: string) => {
    const url = getPublicTagUrl(publicId)
    navigator.clipboard.writeText(url)
    setCopiedId(publicId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleStatus = async (tag: NFCTag) => {
    const nextStatus: TagStatus = tag.status === 'active' ? 'inactive' : 'active'
    try {
      await api.tags.save({ id: tag.id, status: nextStatus })
      setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, status: nextStatus } : t)))
    } catch {}
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>NFC Dinâmico & Telemetria em Tempo Real</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gerenciamento de Tags NFC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de dispositivos físicos, telemetria de data/horário local de leitura e redirecionamentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivateModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ativar Nova Tag NFC</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total de Tags
            </span>
            <Radio className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{tags.length}</div>
          <div className="flex items-center gap-2 mt-1 text-xs">
            <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
              {activeTagsCount} Ativas
            </span>
            {tags.length - activeTagsCount > 0 && (
              <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                {tags.length - activeTagsCount} Pausadas
              </span>
            )}
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Leituras Totais
            </span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{totalScansCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Interações acumuladas</div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Leituras Hoje
            </span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">{scansTodayCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Capturadas hoje</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Canal de Leitura
            </span>
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-1">
            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-xs font-black">
              {nfcScansCount} NFC ({totalScansCount > 0 ? Math.round((nfcScansCount / totalScansCount) * 100) : 0}%)
            </span>
            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-xs font-black">
              {qrScansCount} QR ({totalScansCount > 0 ? Math.round((qrScansCount / totalScansCount) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1.5">Identificação por sensor vs câmera</div>
        </div>
      </div>

      {/* Filter, Search & View Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por tag, serial, mesa/local, ID ou loja..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-medium text-slate-700 cursor-pointer"
            >
              <option value="all">Todos Status ({tags.length})</option>
              <option value="active">Ativas ({activeTagsCount})</option>
              <option value="inactive">Pausadas ({tags.length - activeTagsCount})</option>
              <option value="pending_activation">Aguardando Ativação</option>
              <option value="blocked">Bloqueadas</option>
            </select>
          </div>

          {/* Business filter */}
          {businesses.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={businessFilter}
                onChange={(e) => setBusinessFilter(e.target.value)}
                className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-medium text-slate-700 cursor-pointer max-w-[150px] truncate"
              >
                <option value="all">Todas as Lojas</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-medium text-slate-700 cursor-pointer"
            >
              <option value="scans">Mais Leituras</option>
              <option value="recent">Última Leitura Recente</option>
              <option value="name">Nome (A-Z)</option>
              <option value="created">Mais Recentes</option>
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              title="Visualização em Lista / Tabela"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              title="Visualização em Grade de Cards"
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      {!expandedBusinessId ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Tags por estabelecimento</h2>
              <p className="text-xs text-slate-500 mt-0.5">Selecione um estabelecimento para visualizar e gerenciar suas tags.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{businessGroups.length} {businessGroups.length === 1 ? 'grupo' : 'grupos'}</span>
          </div>

          {businessGroups.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              <Building2 className="w-9 h-9 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">Nenhum estabelecimento encontrado</p>
              <p className="text-xs mt-1">Ajuste os filtros ou ative uma nova tag.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {businessGroups.map((group) => {
                const groupScans = group.tags.flatMap((tag) => scansByTagId.get(tag.id) || [])
                const latestScan = groupScans.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime())[0]
                const lastActivity = latestScan ? formatRelativeScanTime(latestScan) : null
                const activeCount = group.tags.filter((tag) => tag.status === 'active').length
                const locations = new Set(group.tags.map((tag) => tag.location).filter(Boolean)).size
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setExpandedBusinessId(group.id)}
                    className="group text-left bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-[#0B1F3B] text-white flex items-center justify-center shrink-0"><Building2 className="w-5 h-5" /></div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-900 truncate group-hover:text-blue-600">{group.business?.name || 'Tags sem estabelecimento'}</h3>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{group.business ? [group.business.city, group.business.state].filter(Boolean).join('/') || 'Localização não informada' : 'Aguardando vínculo'}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-5">
                      <div className="rounded-xl bg-slate-50 p-2.5"><div className="text-lg font-black text-slate-900">{group.tags.length}</div><div className="text-[9px] uppercase font-bold text-slate-400">Tags</div></div>
                      <div className="rounded-xl bg-emerald-50 p-2.5"><div className="text-lg font-black text-emerald-700">{activeCount}</div><div className="text-[9px] uppercase font-bold text-emerald-600">Ativas</div></div>
                      <div className="rounded-xl bg-blue-50 p-2.5"><div className="text-lg font-black text-blue-700">{groupScans.length}</div><div className="text-[9px] uppercase font-bold text-blue-600">Leituras</div></div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-[11px]">
                      <span className="text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{locations || 0} {locations === 1 ? 'ponto físico' : 'pontos físicos'}</span>
                      <span className="text-slate-500 truncate">{lastActivity?.primary || 'Sem leituras'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button type="button" onClick={() => setExpandedBusinessId(null)} className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer" title="Voltar aos estabelecimentos"><ArrowLeft className="w-4 h-4" /></button>
              <div className="min-w-0"><h2 className="font-bold text-slate-900 truncate">{expandedBusiness?.business?.name || 'Tags sem estabelecimento'}</h2><p className="text-xs text-slate-500">{displayedTags.length} {displayedTags.length === 1 ? 'tag vinculada' : 'tags vinculadas'}</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button type="button" onClick={toggleAllDisplayedTags} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer">
                <span className={`w-4 h-4 rounded border flex items-center justify-center ${allDisplayedSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>{allDisplayedSelected && <Check className="w-3 h-3" />}</span>
                {allDisplayedSelected ? 'Desmarcar todas' : `Selecionar todas (${displayedTags.length})`}
              </button>
              {selectedDisplayedTags.length > 0 ? (
                <Link to={`/print-stand/batch?ids=${selectedDisplayedTags.map((tag) => tag.id).join(',')}`} target="_blank" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition"><Printer className="w-3.5 h-3.5" />Imprimir selecionadas ({selectedDisplayedTags.length})</Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold cursor-not-allowed" title="Selecione pelo menos uma tag"><Printer className="w-3.5 h-3.5" />Selecione para imprimir</span>
              )}
              <button type="button" onClick={() => setExpandedBusinessId(null)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Ver estabelecimentos</button>
            </div>
          </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="w-[44px] py-3 pl-4 pr-1 text-center"><input type="checkbox" checked={allDisplayedSelected} onChange={toggleAllDisplayedTags} aria-label="Selecionar todas as tags" className="w-4 h-4 accent-blue-600 cursor-pointer" /></th>
                  <th className="w-[25%] 2xl:w-[18%] py-3 px-3">Tag & Serial</th>
                  <th className="w-[20%] 2xl:w-[15%] py-3 px-3">Estabelecimento / Local</th>
                  <th className="hidden 2xl:table-cell w-[18%] py-3 px-3">Destino Configurado</th>
                  <th className="hidden 2xl:table-cell w-[9%] py-3 px-3 text-center">Status</th>
                  <th className="w-[10%] 2xl:w-[9%] py-3 px-2 text-center">Leituras</th>
                  <th className="w-[25%] 2xl:w-[16%] py-3 px-3 text-center">Última Leitura</th>
                  <th className="w-[20%] 2xl:w-[15%] py-3 px-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {displayedTags.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400 text-xs">
                      <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Nenhuma Tag NFC encontrada</p>
                      <p className="text-slate-400 mt-0.5">Tente ajustar a busca ou os filtros aplicados.</p>
                    </td>
                  </tr>
                ) : (
                  displayedTags.map((tag) => {
                    const biz = businesses.find((b) => b.id === tag.business_id)
                    const dest = destinations.find((d) => d.tag_id === tag.id)
                    const tagScans = scansByTagId.get(tag.id) || []
                    const lastScan = tagScans.length > 0 ? tagScans[0] : null
                    const relativeTime = lastScan ? formatRelativeScanTime(lastScan) : null

                    return (
                      <tr key={tag.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 pl-4 pr-1 text-center"><input type="checkbox" checked={selectedTagIds.has(tag.id)} onChange={() => toggleTagSelection(tag.id)} aria-label={`Selecionar ${tag.name}`} className="w-4 h-4 accent-blue-600 cursor-pointer" /></td>
                        {/* Tag name & serial */}
                        <td className="py-3 px-3 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                              <Radio className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                {tag.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate" title={`Serial: ${tag.serial_number} • ID: ${tag.public_id}`}>
                                <span className="text-slate-700 font-bold">{tag.serial_number}</span> · {tag.public_id}
                              </div>
                              <div className="2xl:hidden flex items-center gap-1.5 mt-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${tag.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className="text-[9px] font-bold text-slate-500">{tag.status === 'active' ? 'Ativa' : 'Pausada'}</span>
                                <span className="text-[9px] text-blue-600 font-semibold truncate">· {(dest?.type || 'google_review').replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Business & Location */}
                        <td className="py-3 px-3 min-w-0">
                          {biz ? (
                            <div className="font-semibold text-slate-800 truncate" title={biz.name}>{biz.name}</div>
                          ) : (
                            <span className="text-slate-400 italic">Não vinculado</span>
                          )}
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="truncate" title={tag.location || 'Sem local físico'}>{tag.location || 'Sem local físico'}</span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="hidden 2xl:table-cell py-3 px-3">
                          {dest ? (
                            <div className="max-w-[200px]">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                  dest.type === 'google_review'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : dest.type === 'instagram'
                                    ? 'bg-pink-50 text-pink-800 border border-pink-200'
                                    : dest.type === 'whatsapp'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                                }`}
                              >
                                {dest.type.replace('_', ' ')}
                              </span>
                              <div className="text-[10px] text-blue-600 truncate mt-1">
                                {dest.target_url}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Padrão Google</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="hidden 2xl:table-cell py-3 px-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              tag.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : tag.status === 'inactive'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : tag.status === 'pending_activation'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                tag.status === 'active'
                                  ? 'bg-emerald-500 animate-pulse'
                                  : tag.status === 'inactive'
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                            ></span>
                            {tag.status === 'active' && 'Ativa'}
                            {tag.status === 'inactive' && 'Pausada'}
                            {tag.status === 'pending_activation' && 'Aguardando'}
                            {tag.status === 'blocked' && 'Bloqueada'}
                          </span>
                        </td>

                        {/* Total Scans */}
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => setTagForHistory(tag)}
                            title="Clique para ver histórico completo de leituras"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 transition font-black text-slate-900 cursor-pointer"
                          >
                            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{tagScans.length}</span>
                          </button>
                        </td>

                        {/* Last Scan & Local Time */}
                        <td className="py-3 px-3 text-center min-w-0">
                          {relativeTime ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                    relativeTime.method === 'QR Code'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {relativeTime.method}
                                </span>
                                <span className="font-bold text-slate-900 text-[11px]">
                                  {relativeTime.primary}
                                </span>
                              </div>
                              {relativeTime.secondary && (
                                <span className="hidden xl:block text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                                  {relativeTime.secondary}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Aguardando toque</span>
                          )}
                        </td>

                        {/* Action buttons */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {/* Ver histórico de leituras */}
                            <button
                              type="button"
                              onClick={() => setTagForHistory(tag)}
                              title="Ver Histórico e Telemetria da Tag"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </button>

                            {/* Gravar NFC */}
                            <button
                              type="button"
                              onClick={() => setTagToWrite(tag)}
                              title="Gravar Chip NFC Físico"
                              className="hidden 2xl:inline-flex p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              <Radio className="w-4 h-4" />
                            </button>

                            {/* Copiar Link */}
                            <button
                              type="button"
                              onClick={() => handleCopyLink(tag.public_id)}
                              title="Copiar URL pública da Tag"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              {copiedId === tag.public_id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* QR Code */}
                            <button
                              type="button"
                              onClick={() => setSelectedTagForQR(tag)}
                              title="Ver QR Code & Imprimir"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            {/* Testar redirecionamento */}
                            <Link
                              to={`/t/${tag.public_id}`}
                              target="_blank"
                              title="Testar Redirecionamento"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>

                            {/* Pausar/Ativar */}
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(tag)}
                              title={tag.status === 'active' ? 'Pausar Tag' : 'Ativar Tag'}
                              className="hidden 2xl:inline-flex p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            >
                              {tag.status === 'active' ? (
                                <PauseCircle className="w-4 h-4 text-slate-400 hover:text-amber-600" />
                              ) : (
                                <PlayCircle className="w-4 h-4 text-emerald-600" />
                              )}
                            </button>

                            {/* Configurar */}
                            <Link
                              to={`/dashboard/tags/${tag.id}`}
                              title="Configurar Detalhes e Destino"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                            >
                              <Settings className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTags.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">Nenhuma Tag NFC encontrada</p>
              <p className="text-slate-400 text-xs mt-0.5">Ajuste os filtros de busca para visualizar suas tags.</p>
            </div>
          ) : (
            displayedTags.map((tag) => {
              const biz = businesses.find((b) => b.id === tag.business_id)
              const dest = destinations.find((d) => d.tag_id === tag.id)
              const tagScans = scansByTagId.get(tag.id) || []
              const lastScan = tagScans.length > 0 ? tagScans[0] : null
              const relativeTime = lastScan ? formatRelativeScanTime(lastScan) : null

              return (
                <div
                  key={tag.id}
                  className={`bg-white rounded-3xl border shadow-2xs hover:shadow-md transition p-5 flex flex-col justify-between relative group ${selectedTagIds.has(tag.id) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-200'}`}
                >
                  <label className="absolute top-4 right-4 z-10 w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center cursor-pointer" title="Selecionar para impressão">
                    <input type="checkbox" checked={selectedTagIds.has(tag.id)} onChange={() => toggleTagSelection(tag.id)} aria-label={`Selecionar ${tag.name}`} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  </label>
                  {/* Top Bar inside Card */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3 pr-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                          <Radio className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition text-sm leading-tight">
                            {tag.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {tag.public_id}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tag.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tag.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                          }`}
                        ></span>
                        {tag.status === 'active' ? 'Ativa' : 'Pausada'}
                      </span>
                    </div>

                    {/* Metadata chips */}
                    <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400 font-medium">Estabelecimento:</span>
                        <span className="font-bold text-slate-800 truncate max-w-[170px]">
                          {biz?.name || 'Não vinculado'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400 font-medium">Local Físico:</span>
                        <span className="font-medium text-slate-700">{tag.location || 'Sem local'}</span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] text-slate-400 font-medium">Destino:</span>
                        <span className="font-bold text-blue-600 capitalize">
                          {(dest?.type || 'google_review').replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Telemetry info */}
                    <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Última Leitura
                        </div>
                        <div className="text-xs font-bold text-slate-900 mt-0.5">
                          {relativeTime ? relativeTime.primary : 'Sem leituras ainda'}
                        </div>
                        {relativeTime?.secondary && (
                          <div className="text-[10px] text-slate-500 mt-0.5">{relativeTime.secondary}</div>
                        )}
                      </div>

                      <button
                        onClick={() => setTagForHistory(tag)}
                        title="Ver histórico de leituras"
                        className="text-right bg-white p-2 rounded-xl border border-slate-200 shadow-2xs hover:bg-blue-50 transition cursor-pointer"
                      >
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Leituras</div>
                        <div className="text-base font-black text-blue-600">{tagScans.length}</div>
                      </button>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setTagForHistory(tag)}
                        title="Histórico de Leituras"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setTagToWrite(tag)}
                        title="Gravar Chip NFC"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        <Radio className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedTagForQR(tag)}
                        title="QR Code & Imprimir"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyLink(tag.public_id)}
                        title="Copiar Link"
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        {copiedId === tag.public_id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(tag)}
                        title={tag.status === 'active' ? 'Pausar Tag' : 'Ativar Tag'}
                        className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                      >
                        {tag.status === 'active' ? (
                          <PauseCircle className="w-4 h-4 text-slate-400 hover:text-amber-600" />
                        ) : (
                          <PlayCircle className="w-4 h-4 text-emerald-600" />
                        )}
                      </button>
                    </div>

                    <Link
                      to={`/dashboard/tags/${tag.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                    >
                      <span>Configurar</span>
                      <Settings className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
        </div>
      )}

      {/* Modals */}
      {selectedTagForQR && (
        <QRCodeModal tag={selectedTagForQR} onClose={() => setSelectedTagForQR(null)} />
      )}

      {tagToWrite && (
        <NFCWriterModal tag={tagToWrite} onClose={() => setTagToWrite(null)} />
      )}

      {tagForHistory && (
        <TagScanHistoryModal
          tag={tagForHistory}
          scans={scansByTagId.get(tagForHistory.id) || []}
          destination={destinations.find((d) => d.tag_id === tagForHistory.id)}
          business={businesses.find((b) => b.id === tagForHistory.business_id)}
          onClose={() => setTagForHistory(null)}
        />
      )}

      {activateModalOpen && (
        <ActivateTagModal
          businesses={businesses}
          onSuccess={() => {
            setActivateModalOpen(false)
            setRefreshTrigger((prev) => prev + 1)
          }}
          onClose={() => setActivateModalOpen(false)}
        />
      )}
    </div>
  )
}
