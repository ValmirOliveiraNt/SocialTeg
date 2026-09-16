import React, { useState, useEffect, useMemo } from 'react'
import {
  Radio,
  Search,
  Filter,
  Plus,
  QrCode,
  Copy,
  Check,
  ShieldAlert,
  ArrowRightLeft,
  X,
  Download,
  Trash2,
} from 'lucide-react'
import { NFCTag, TagStatus, Product, User, Business, TagScan } from '../../types'
import { api } from '../../services/api'
import { QRCodeModal } from '../../components/QRCodeModal'
import { NFCWriterModal } from '../../components/NFCWriterModal'
import { SavingIndicator } from '../../components/SavingIndicator'
import { getPublicTagUrl } from '../../utils/url'

export const AdminTagsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedTagForQR, setSelectedTagForQR] = useState<NFCTag | null>(null)
  const [tagToWrite, setTagToWrite] = useState<NFCTag | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [tags, setTags] = useState<NFCTag[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [scans, setScans] = useState<TagScan[]>([])

  const [batchModalOpen, setBatchModalOpen] = useState(false)
  const [batchMode, setBatchMode] = useState<'generate' | 'paste'>('generate')
  const [batchQuantity, setBatchQuantity] = useState(10)
  const [batchPrefix, setBatchPrefix] = useState('TAG-BR')
  const [batchProductId, setBatchProductId] = useState('prod-acrylic-stand')
  const [batchRawSerials, setBatchRawSerials] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [transferModalOpen, setTransferModalOpen] = useState(false)
  const [tagToTransfer, setTagToTransfer] = useState<NFCTag | null>(null)
  const [targetOwnerId, setTargetOwnerId] = useState('')

  useEffect(() => {
    api.tags.getAll().then(setTags).catch(() => {})
    api.products.getAll().then(setProducts).catch(() => {})
    api.users.getAll().then((list) => setUsers(list.filter((u) => u.role === 'customer'))).catch(() => {})
    api.businesses.getAll().then(setBusinesses).catch(() => {})
    api.scans.getAll().then(setScans).catch(() => {})
  }, [refreshTrigger])

  const filteredTags = useMemo(() => {
    return tags.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.serial_number.toLowerCase().includes(searchTerm.toLowerCase())

      const matchStatus = statusFilter === 'all' || t.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [tags, searchTerm, statusFilter])

  const handleCopyLink = (publicId: string) => {
    const url = getPublicTagUrl(publicId)
    navigator.clipboard.writeText(url)
    setCopiedId(publicId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleStatus = async (tag: NFCTag, newStatus: TagStatus) => {
    try {
      await api.tags.save({ id: tag.id, status: newStatus })
      await api.logs.add({
        action: 'ADMIN_UPDATE_TAG_STATUS',
        entity_type: 'nfc_tag',
        entity_id: tag.id,
        details: `Status da Tag ${tag.serial_number} alterado para ${newStatus}.`,
      })
    } catch {}
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleDeleteTag = async (tag: NFCTag) => {
    if (!confirm(`Deseja realmente excluir a Tag ${tag.serial_number}?`)) return

    try {
      await api.tags.delete(tag.id)
      await api.logs.add({
        action: 'ADMIN_DELETE_TAG',
        entity_type: 'nfc_tag',
        entity_id: tag.id,
        details: `Tag ${tag.serial_number} removida do estoque.`,
      })
    } catch {}

    setRefreshTrigger((prev) => prev + 1)
  }

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const serialsToAdd: string[] = []

    if (batchMode === 'generate') {
      const cleanPrefix = batchPrefix.replace(/^#+/, '').trim() || 'TAG'
      for (let i = 0; i < batchQuantity; i++) {
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        serialsToAdd.push(`${cleanPrefix}-${randomNum}`)
      }
    } else {
      const lines = batchRawSerials
        .split('\n')
        .map((l) => l.replace(/^#+/, '').trim())
        .filter(Boolean)

      serialsToAdd.push(...lines)
    }

    if (serialsToAdd.length === 0) {
      alert('Nenhum serial informado.')
      setIsSubmitting(false)
      return
    }

    const newTags: any[] = serialsToAdd.map((serial, idx) => {
      const cleanSerial = serial.replace(/^#+/, '').trim()
      const publicId = 'tag-' + cleanSerial.toLowerCase().replace(/[^a-z0-9]/g, '')

      return {
        id: 'tag-lote-' + Date.now() + '-' + idx,
        public_id: publicId,
        serial_number: cleanSerial,
        product_id: batchProductId,
        status: 'available',
        name: `Tag NFC ${cleanSerial}`,
        location: 'Estoque Fabril',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    })

    try {
      await api.tags.saveBatch(newTags)
      await api.logs.add({
        action: 'GENERATE_TAG_BATCH',
        entity_type: 'nfc_tag',
        entity_id: 'batch',
        details: `Lote com ${newTags.length} Tags adicionado ao sistema.`,
      })
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar lote')
    }

    setIsSubmitting(false)
    setBatchModalOpen(false)
    setBatchRawSerials('')
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleExportCSV = () => {
    if (tags.length === 0) {
      alert('Não há tags para exportar.')
      return
    }

    const headers = ['ID', 'Serial', 'Nome', 'Status', 'URL_Redirecionamento_NFC', 'Localizacao']
    const rows = tags.map((t) => [
      t.id,
      t.serial_number,
      `"${t.name}"`,
      t.status,
      getPublicTagUrl(t.public_id),
      `"${t.location || ''}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tags-nfc-socialtag-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const handleOpenTransfer = (tag: NFCTag) => {
    setTagToTransfer(tag)
    setTargetOwnerId(tag.owner_id || users[0]?.id || '')
    setTransferModalOpen(true)
  }

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tagToTransfer || !targetOwnerId) return

    const targetUser = users.find((u) => u.id === targetOwnerId)
    const targetBiz = businesses.find((b) => b.owner_id === targetOwnerId)

    const updated: NFCTag = {
      ...tagToTransfer,
      owner_id: targetOwnerId,
      business_id: targetBiz?.id,
      status: 'active',
      updated_at: new Date().toISOString(),
    }

    try {
      await api.tags.save(updated)
      await api.logs.add({
        action: 'TRANSFER_TAG',
        entity_type: 'nfc_tag',
        entity_id: tagToTransfer.id,
        details: `Tag ${tagToTransfer.serial_number} transferida para o cliente ${targetUser?.name}.`,
      })
    } catch {}

    setTransferModalOpen(false)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestão Global de Tags NFC
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de inventário de chips físicos, seriais, identificadores dinâmicos e vínculos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setBatchModalOpen(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Lote de Tags</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, serial ou ID público..."
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
            <option value="all">Todos os Status ({tags.length})</option>
            <option value="active">Ativas</option>
            <option value="available">Disponíveis / Estoque</option>
            <option value="pending_activation">Aguardando Ativação</option>
            <option value="inactive">Pausadas</option>
            <option value="blocked">Bloqueadas</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tag & Serial</th>
                <th className="py-3.5 px-4">Proprietário (Cliente)</th>
                <th className="py-3.5 px-4">Localização / Negócio</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Scans</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhuma tag encontrada no estoque.
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => {
                  const owner = users.find((u) => u.id === tag.owner_id)
                  const biz = businesses.find((b) => b.id === tag.business_id)
                  const tagScans = scans.filter((s) => s.tag_id === tag.id)

                  return (
                    <tr key={tag.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold shrink-0">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{tag.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              Serial: {tag.serial_number} • /t/{tag.public_id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {owner ? (
                          <div>
                            <div className="font-semibold text-slate-900">{owner.name}</div>
                            <div className="text-[10px] text-slate-400">{owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Disponível em Estoque</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {biz?.name || 'Não vinculado'}
                        </div>
                        <div className="text-[10px] text-slate-400">{tag.location || '-'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            tag.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tag.status === 'available'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : tag.status === 'pending_activation'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {tag.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                        {tagScans.length}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setTagToWrite(tag)}
                            title="Gravar Chip NFC Físico"
                            className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg cursor-pointer transition shadow-2xs"
                          >
                            <Radio className="w-4 h-4 animate-pulse" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyLink(tag.public_id)}
                            title="Copiar URL"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg cursor-pointer"
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
                            title="Ver QR Code"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenTransfer(tag)}
                            title="Transferir / Associar a Cliente"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                tag,
                                tag.status === 'blocked' ? 'active' : 'blocked'
                              )
                            }
                            title={tag.status === 'blocked' ? 'Desbloquear' : 'Bloquear Tag'}
                            className={`p-1.5 rounded-lg cursor-pointer ${
                              tag.status === 'blocked'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTag(tag)}
                            title="Excluir Tag do Estoque"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setBatchModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Adicionar Lote de Tags NFC ao Estoque
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre novos chips para venda ou vinculação a clientes.
                </p>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setBatchMode('generate')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  batchMode === 'generate'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gerar Automaticamente
              </button>
              <button
                type="button"
                onClick={() => setBatchMode('paste')}
                className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  batchMode === 'paste'
                    ? 'bg-white text-purple-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Colar Seriais Físicos
              </button>
            </div>

            <form onSubmit={handleSaveBatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase">
                  Produto Físico Associado
                </label>
                <select
                  value={batchProductId}
                  onChange={(e) => setBatchProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (R$ {p.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {batchMode === 'generate' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 uppercase">
                        Quantidade de Tags
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={batchQuantity}
                        onChange={(e) => setBatchQuantity(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 uppercase">
                        Prefixo do Serial
                      </label>
                      <input
                        type="text"
                        value={batchPrefix}
                        onChange={(e) => setBatchPrefix(e.target.value.replace(/^#+/, '').toUpperCase())}
                        placeholder="Ex: TAG-BR"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden uppercase font-mono"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed bg-purple-50 p-3 rounded-xl border border-purple-100 text-purple-900">
                    O sistema irá gerar {batchQuantity} Tags com seriais no padrão <code>{batchPrefix || 'TAG'}-XXXX</code> e identificadores de URL dinâmicos únicos.
                  </p>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase">
                    Cole os Seriais da Fábrica / Caixa (um por linha)
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={batchRawSerials}
                    onChange={(e) => setBatchRawSerials(e.target.value)}
                    placeholder={'TAG-2026-001\nTAG-2026-002\nTAG-2026-003'}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Cada linha será cadastrada como uma Tag física única pronta para venda.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <SavingIndicator label="Cadastrando Lote..." />
                  ) : (
                    'Cadastrar Lote'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferModalOpen && tagToTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative">
            <button
              onClick={() => setTransferModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Associar / Transferir Tag NFC
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Serial: <span className="font-mono font-bold text-slate-800">{tagToTransfer.serial_number}</span>
            </p>

            <form onSubmit={handleSaveTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase">
                  Selecione o Cliente Destinatário
                </label>
                <select
                  value={targetOwnerId}
                  onChange={(e) => setTargetOwnerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Transferir Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTagForQR && (
        <QRCodeModal tag={selectedTagForQR} onClose={() => setSelectedTagForQR(null)} />
      )}

      {tagToWrite && (
        <NFCWriterModal tag={tagToWrite} onClose={() => setTagToWrite(null)} />
      )}
    </div>
  )
}
