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
} from 'lucide-react'
import { NFCTag, TagStatus, Business, TagDestination, TagScan } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { QRCodeModal } from '../../components/QRCodeModal'
import { ActivateTagModal } from '../../components/ActivateTagModal'
import { NFCWriterModal } from '../../components/NFCWriterModal'
import { getPublicTagUrl } from '../../utils/url'

export const CustomerTagsPage: React.FC = () => {
  const { currentUser } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedTagForQR, setSelectedTagForQR] = useState<NFCTag | null>(null)
  const [tagToWrite, setTagToWrite] = useState<NFCTag | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [tags, setTags] = useState<NFCTag[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [destinations, setDestinations] = useState<TagDestination[]>([])
  const [scans, setScans] = useState<TagScan[]>([])

  useEffect(() => {
    if (!currentUser) return
    api.tags.getAll(currentUser.id).then(setTags).catch(() => {})
    api.businesses.getAll(currentUser.id).then(setBusinesses).catch(() => {})
    api.destinations.getAll().then(setDestinations).catch(() => {})
    api.scans.getAll(currentUser.id).then(setScans).catch(() => {})
  }, [currentUser, refreshTrigger])

  const filteredTags = useMemo(() => {
    return tags.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serial_number.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || t.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [tags, searchTerm, statusFilter])

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
    } catch {}
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gerenciamento de Tags NFC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Todas as Tags físicas vinculadas aos seus estabelecimentos comerciais.
          </p>
        </div>

        <button
          onClick={() => setActivateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ativar Nova Tag NFC</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, ID público ou serial..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden font-medium text-slate-700"
          >
            <option value="all">Todos os Status ({tags.length})</option>
            <option value="active">Ativas</option>
            <option value="inactive">Pausadas</option>
            <option value="pending_activation">Aguardando Ativação</option>
            <option value="blocked">Bloqueadas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tag & Serial</th>
                <th className="py-3.5 px-4">Estabelecimento</th>
                <th className="py-3.5 px-4">Destino Configurado</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Scans</th>
                <th className="py-3.5 px-4 text-center">Último Acesso</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                    Nenhuma Tag encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => {
                  const biz = businesses.find((b) => b.id === tag.business_id)
                  const dest = destinations.find((d) => d.tag_id === tag.id)
                  const tagScans = scans.filter((s) => s.tag_id === tag.id)
                  const lastScan = tagScans.sort(
                    (a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
                  )[0]

                  return (
                    <tr key={tag.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{tag.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Serial: {tag.serial_number} • ID: {tag.public_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {biz ? (
                          <div className="font-semibold text-slate-800">{biz.name}</div>
                        ) : (
                          <span className="text-slate-400 italic">Não vinculado</span>
                        )}
                        <div className="text-[10px] text-slate-400">{tag.location || 'Sem local'}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {dest ? (
                          <div className="max-w-[200px]">
                            <span className="font-semibold text-slate-800 capitalize">
                              {dest.type.replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-blue-600 truncate">
                              {dest.target_url}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Padrão Google</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            tag.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tag.status === 'inactive'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : tag.status === 'pending_activation'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {tag.status === 'active' && 'Ativa'}
                          {tag.status === 'inactive' && 'Pausada'}
                          {tag.status === 'pending_activation' && 'Aguardando Ativação'}
                          {tag.status === 'blocked' && 'Bloqueada'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {tagScans.length}
                      </td>

                      <td className="py-3.5 px-4 text-center text-[11px] text-slate-500">
                        {lastScan
                          ? new Date(lastScan.scanned_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Nunca'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setTagToWrite(tag)}
                            title="Gravar Chip NFC Físico"
                            className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition cursor-pointer"
                          >
                            <Radio className="w-4 h-4 animate-pulse" />
                          </button>

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

                          <button
                            type="button"
                            onClick={() => setSelectedTagForQR(tag)}
                            title="Ver QR Code e Imprimir"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/t/${tag.public_id}`}
                            target="_blank"
                            title="Testar Redirecionamento"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(tag)}
                            title={tag.status === 'active' ? 'Pausar Tag' : 'Ativar Tag'}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            {tag.status === 'active' ? (
                              <PauseCircle className="w-4 h-4" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>

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

      {selectedTagForQR && (
        <QRCodeModal tag={selectedTagForQR} onClose={() => setSelectedTagForQR(null)} />
      )}

      {tagToWrite && (
        <NFCWriterModal tag={tagToWrite} onClose={() => setTagToWrite(null)} />
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
