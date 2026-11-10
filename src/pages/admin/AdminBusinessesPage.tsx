import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  MapPin,
  Phone,
  Radio,
  X,
  AlertCircle,
  Upload,
  UserCheck,
  UserX,
  UserPlus,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Business, User, NFCTag } from '../../types'
import { api } from '../../services/api'
import { BusinessAvatar } from '../../components/BusinessAvatar'
import { BusinessExperienceModal } from '../../components/BusinessExperienceModal'
import { GoogleIcon } from '../../components/GoogleIcon'
import { InstagramIcon } from '../../components/InstagramIcon'
import { SavingIndicator } from '../../components/SavingIndicator'
import { imageFileToDataUrl } from '../../utils/imageUpload'

const formatCep = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

export const AdminBusinessesPage: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [tags, setTags] = useState<NFCTag[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [searchTerm, setSearchTerm] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBiz, setEditingBiz] = useState<Business | null>(null)
  const [configBusiness, setConfigBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Referência para focar no campo de proprietário quando clicar em "Vincular"
  const ownerSelectRef = useRef<HTMLSelectElement | null>(null)

  // Campos do formulário de negócio
  const [ownerId, setOwnerId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [cep, setCep] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepMessage, setCepMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [menuUrl, setMenuUrl] = useState('')

  const executeCepLookup = async (cepToLookup: string) => {
    const digits = cepToLookup.replace(/\D/g, '')
    if (digits.length !== 8) {
      setCepMessage({ type: 'error', text: 'Informe um CEP válido com 8 dígitos.' })
      return
    }

    setCepLoading(true)
    setCepMessage({ type: 'info', text: 'Buscando endereço pelo CEP...' })

    try {
      const found = await api.address.lookupCep(digits)
      const streetPart = [found.street, found.neighborhood].filter(Boolean).join(' - ')

      if (streetPart) {
        setAddress(streetPart)
      }
      if (found.city) {
        setCity(found.city)
      }
      if (found.state) {
        setState(found.state.toUpperCase())
      }

      setCepMessage({
        type: 'success',
        text: found.street
          ? 'Endereço encontrado! Complete agora com o número e complemento.'
          : 'Cidade e UF encontradas! Preencha a rua, bairro e número.',
      })
    } catch (err: any) {
      setCepMessage({
        type: 'error',
        text: err?.message || 'CEP não encontrado. Preencha os campos manualmente.',
      })
    } finally {
      setCepLoading(false)
    }
  }

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value)
    setCep(formatted)
    setCepMessage(null)

    const digits = formatted.replace(/\D/g, '')
    if (digits.length === 8) {
      executeCepLookup(formatted)
    }
  }

  useEffect(() => {
    api.businesses.getAll().then(setBusinesses).catch(() => {})
    api.users.getAll().then((list) => setUsers(list.filter((u) => u.role === 'customer'))).catch(() => {})
    api.tags.getAll().then(setTags).catch(() => {})
  }, [refreshTrigger])

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const owner = users.find((u) => u.id === b.owner_id)
      const term = searchTerm.toLowerCase()
      const matchSearch =
        b.name.toLowerCase().includes(term) ||
        (b.city && b.city.toLowerCase().includes(term)) ||
        (b.state && b.state.toLowerCase().includes(term)) ||
        (b.address && b.address.toLowerCase().includes(term)) ||
        (owner && (owner.name.toLowerCase().includes(term) || owner.email.toLowerCase().includes(term)))

      const matchOwner =
        ownerFilter === 'all'
          ? true
          : ownerFilter === 'unassigned'
          ? !b.owner_id || !owner
          : b.owner_id === ownerFilter

      return matchSearch && matchOwner
    })
  }, [businesses, users, searchTerm, ownerFilter])

  const unassignedCount = businesses.filter((b) => !b.owner_id || !users.some((u) => u.id === b.owner_id)).length
  const assignedCount = businesses.length - unassignedCount

  const handleOpenCreate = () => {
    setEditingBiz(null)
    setOwnerId('') // Sem proprietário por padrão (opcional)
    setName('')
    setDescription('')
    setPhone('')
    setEmail('')
    setWebsite('')
    setCep('')
    setCepLoading(false)
    setCepMessage(null)
    setAddress('')
    setCity('')
    setState('')
    setLogoUrl('')
    setCoverUrl('')
    setGoogleReviewsUrl('')
    setInstagramUrl('')
    setMenuUrl('')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (biz: Business, focusOwner = false) => {
    setEditingBiz(biz)
    setOwnerId(biz.owner_id || '')
    setName(biz.name || '')
    setDescription(biz.description || '')
    setPhone(biz.phone || '')
    setEmail(biz.email || '')
    setWebsite(biz.website || '')
    setCep('')
    setCepLoading(false)
    setCepMessage(null)
    setAddress(biz.address || '')
    setCity(biz.city || '')
    setState(biz.state || '')
    setLogoUrl(biz.logo_url || '')
    setCoverUrl(biz.cover_url || '')
    setGoogleReviewsUrl(biz.google_reviews_url || biz.googleReviewsUrl || '')
    setInstagramUrl(biz.instagram_url || biz.instagramUrl || '')
    setMenuUrl(biz.menu_url || biz.menuUrl || '')
    setFormError(null)
    setModalOpen(true)

    if (focusOwner) {
      setTimeout(() => ownerSelectRef.current?.focus(), 150)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await imageFileToDataUrl(file, { maxWidth: 512, maxHeight: 512, quality: 0.85 })
      setLogoUrl(dataUrl)
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar logotipo')
    }
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await imageFileToDataUrl(file, { maxWidth: 1200, maxHeight: 600, quality: 0.82 })
      setCoverUrl(dataUrl)
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar imagem de capa')
    }
  }

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('O nome do negócio é obrigatório.')
      return
    }
    if (!address.trim() || !city.trim() || !state.trim()) {
      setFormError('Endereço, cidade e UF são obrigatórios.')
      return
    }

    setLoading(true)

    const payload: Partial<Business> = {
      ...(editingBiz ? { id: editingBiz.id } : {}),
      owner_id: ownerId.trim() || undefined,
      name: name.trim(),
      description: description.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      country: 'Brasil',
      logo_url: logoUrl,
      cover_url: coverUrl || undefined,
      google_reviews_url: googleReviewsUrl.trim(),
      googleReviewsUrl: googleReviewsUrl.trim(),
      instagram_url: instagramUrl.trim(),
      instagramUrl: instagramUrl.trim(),
      menu_url: menuUrl.trim(),
      menuUrl: menuUrl.trim(),
    }

    try {
      await api.businesses.save(payload)
      const selectedOwner = users.find((u) => u.id === ownerId)
      await api.logs.add({
        action: editingBiz ? 'ADMIN_UPDATE_BUSINESS' : 'ADMIN_CREATE_BUSINESS',
        entity_type: 'business',
        entity_id: editingBiz?.id || 'new',
        details: editingBiz
          ? `Estabelecimento "${payload.name}" atualizado pelo administrador.${selectedOwner ? ` Proprietário: ${selectedOwner.name}.` : ' Sem proprietário.'}`
          : `Novo estabelecimento "${payload.name}" cadastrado pelo administrador.${selectedOwner ? ` Proprietário: ${selectedOwner.name}.` : ' Sem proprietário (pré-cadastro).'}`
      })
      setModalOpen(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar o negócio.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBusiness = async (biz: Business) => {
    const linkedTags = tags.filter((t) => t.business_id === biz.id)
    const msg = linkedTags.length > 0
      ? `Deseja realmente excluir o estabelecimento "${biz.name}"?\n\nExistem ${linkedTags.length} Tag(s) NFC vinculada(s) a ele que serão desvinculadas.`
      : `Deseja realmente excluir o estabelecimento "${biz.name}"?`

    if (!confirm(msg)) return

    try {
      await api.businesses.delete(biz.id)
      await api.logs.add({
        action: 'ADMIN_DELETE_BUSINESS',
        entity_type: 'business',
        entity_id: biz.id,
        details: `Estabelecimento "${biz.name}" excluído pelo administrador.`,
      })
      setRefreshTrigger((prev) => prev + 1)
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir estabelecimento.')
    }
  }

  const totalBusinesses = businesses.length
  const totalLinkedTags = tags.filter((t) => t.business_id).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span>Gestão Global de Negócios</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre empresas com ou sem proprietário, configure links do Google e vincule contas de clientes quando quiser.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Negócio / Estabelecimento</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Negócios</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalBusinesses}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Cadastrados no sistema</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Vinculados a Clientes</span>
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{assignedCount}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Com proprietário ativo</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
            <UserX className="w-3.5 h-3.5" />
            <span>Sem Dono (Aguardando)</span>
          </span>
          <div className="text-2xl font-black text-amber-800 mt-1">{unassignedCount}</div>
          <p className="text-[10px] text-amber-600/80 mt-0.5">Prontos para vincular a contas</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
            <Radio className="w-3.5 h-3.5" />
            <span>Tags NFC em Operação</span>
          </span>
          <div className="text-2xl font-black text-blue-600 mt-1">{totalLinkedTags}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Associadas a estabelecimentos</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, cidade ou cliente..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">Todos os Negócios ({businesses.length})</option>
            {unassignedCount > 0 && (
              <option value="unassigned">⚠️ Sem proprietário ({unassignedCount})</option>
            )}
            {users.map((u) => {
              const count = businesses.filter((b) => b.owner_id === u.id).length
              return (
                <option key={u.id} value={u.id}>
                  {u.name} ({count})
                </option>
              )
            })}
          </select>
        </div>
      </div>

      {/* Tabela de Negócios */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Negócio / Estabelecimento</th>
                <th className="py-3.5 px-4">Proprietário (Cliente)</th>
                <th className="py-3.5 px-4">Localização & Contato</th>
                <th className="py-3.5 px-4 text-center">Tags NFC</th>
                <th className="py-3.5 px-4">Canais Configurados</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum negócio encontrado. Clique em "+ Novo Negócio" para cadastrar.
                  </td>
                </tr>
              ) : (
                filteredBusinesses.map((biz) => {
                  const owner = users.find((u) => u.id === biz.owner_id)
                  const bizTags = tags.filter((t) => t.business_id === biz.id)
                  const hasGoogle = Boolean(biz.google_reviews_url || biz.googleReviewsUrl)
                  const hasInstagram = Boolean(biz.instagram_url || biz.instagramUrl)
                  const hasMenu = Boolean(biz.menu_url || biz.menuUrl)

                  return (
                    <tr key={biz.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <BusinessAvatar src={biz.logo_url} name={biz.name} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{biz.name}</div>
                            {biz.description && (
                              <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs">
                                {biz.description}
                              </div>
                            )}
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
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Sem proprietário
                            </span>
                            <div>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(biz, true)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <UserPlus className="w-3 h-3" />
                                <span>Vincular cliente</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{biz.city || 'Sem cidade'}{biz.state ? ` - ${biz.state}` : ''}</span>
                        </div>
                        {biz.phone && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{biz.phone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          bizTags.length > 0 ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <Radio className="w-3 h-3" />
                          <span>{bizTags.length} tag{bizTags.length === 1 ? '' : 's'}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {hasGoogle && (
                            <span className="p-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200" title="Google Avaliações Configurado">
                              <GoogleIcon className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {hasInstagram && (
                            <span className="p-1 rounded-md bg-pink-50 text-pink-700 border border-pink-200" title="Instagram Configurado">
                              <InstagramIcon className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {hasMenu && (
                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold" title="Cardápio/Menu Configurado">
                              Cardápio
                            </span>
                          )}
                          {!hasGoogle && !hasInstagram && !hasMenu && (
                            <span className="text-[11px] text-slate-400 italic">Padrão</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setConfigBusiness(biz)}
                            title="Configurar Experiência das Tags (Google, Wi-Fi, etc)"
                            className="p-1.5 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg cursor-pointer transition shadow-2xs"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(biz)}
                            title="Editar Dados do Estabelecimento"
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBusiness(biz)}
                            title="Excluir Estabelecimento"
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

      {/* Modal de Criação / Edição de Negócio */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingBiz ? 'Editar Negócio / Estabelecimento' : 'Novo Negócio / Estabelecimento'}
                </h3>
                <p className="text-xs text-slate-500">
                  Cadastre empresas com ou sem proprietário para vincular a contas de clientes quando quiser.
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
                <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                  Cliente Proprietário (Opcional)
                </label>
                <p className="text-[11px] text-slate-500">
                  Você pode deixar em branco para pré-cadastrar a empresa. Posteriormente, assim que o cliente criar a conta dele, você poderá vincular esta empresa a ele para que ele mesmo faça as alterações.
                </p>
                <select
                  ref={ownerSelectRef}
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  className="mt-1.5 w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden font-medium text-slate-800"
                >
                  <option value="">Sem proprietário definido (Aguardando vínculo futuro)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                    Nome do Negócio *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex.: Espetinho Apodi"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ex.: (84) 99999-9999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                  Descrição / Slogan
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex.: O Melhor da Comida Nordestina em Parnamirim"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                    E-mail do Local
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                    Site Oficial
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://suaempresa.com.br"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                    Endereço & Localização
                  </span>
                  {cepLoading && (
                    <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando CEP...
                    </span>
                  )}
                </div>

                {/* Busca Automática por CEP */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 text-xs">
                    Buscar por CEP <span className="font-normal text-slate-500">(preenche endereço automaticamente)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            executeCepLookup(cep)
                          }
                        }}
                        placeholder="Ex.: 59149-000"
                        maxLength={9}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => executeCepLookup(cep)}
                      disabled={cepLoading || cep.replace(/\D/g, '').length < 8}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shrink-0 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                    >
                      {cepLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                      <span>Buscar CEP</span>
                    </button>
                  </div>
                  {cepMessage && (
                    <p
                      className={`text-[11px] mt-1.5 flex items-center gap-1.5 ${
                        cepMessage.type === 'success'
                          ? 'text-emerald-700 font-medium'
                          : cepMessage.type === 'error'
                          ? 'text-rose-600 font-medium'
                          : 'text-slate-600'
                      }`}
                    >
                      {cepMessage.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {cepMessage.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />}
                      <span>{cepMessage.text}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Endereço Completo *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Ex.: Rua Rio Cajupiranga, 120 - Emaus"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Cidade *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="Ex.: Parnamirim"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">UF *</label>
                    <input
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      required
                      placeholder="RN"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <span className="font-bold text-blue-900 text-[11px] uppercase tracking-wider block">
                  Links & Ações Principais
                </span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <GoogleIcon className="w-3.5 h-3.5" />
                    <span>Link Direto do Google Avaliações</span>
                  </label>
                  <input
                    type="url"
                    value={googleReviewsUrl}
                    onChange={(e) => setGoogleReviewsUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                      <InstagramIcon className="w-3.5 h-3.5" />
                      <span>Instagram</span>
                    </label>
                    <input
                      type="text"
                      value={instagramUrl}
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="@perfil ou link completo"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Cardápio / Menu Digital</label>
                    <input
                      type="url"
                      value={menuUrl}
                      onChange={(e) => setMenuUrl(e.target.value)}
                      placeholder="https://menu.com/seulocal"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Upload de Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                    Logotipo (URL ou Upload)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://... ou faça upload"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden text-xs"
                    />
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer shrink-0 font-bold text-xs flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Arquivo</span>
                      <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                    Capa / Foto do Local (URL ou Upload)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://... ou faça upload"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden text-xs"
                    />
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer shrink-0 font-bold text-xs flex items-center gap-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Arquivo</span>
                      <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? <SavingIndicator label="Salvando..." /> : (editingBiz ? 'Atualizar Negócio' : 'Cadastrar Negócio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Experiência das Tags do Negócio */}
      {configBusiness && (
        <BusinessExperienceModal
          business={configBusiness}
          onClose={() => setConfigBusiness(null)}
          onSaved={() => {
            setConfigBusiness(null)
            setRefreshTrigger((prev) => prev + 1)
          }}
        />
      )}
    </div>
  )
}
