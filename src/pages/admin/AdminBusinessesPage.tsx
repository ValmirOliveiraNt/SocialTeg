import React, { useState, useEffect, useMemo } from 'react'
import {
  Building2,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  SlidersHorizontal,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Globe,
  Radio,
  X,
  AlertCircle,
  CheckCircle2,
  Upload,
  ImageIcon,
  Sparkles,
} from 'lucide-react'
import { Business, User, NFCTag } from '../../types'
import { api } from '../../services/api'
import { BusinessAvatar } from '../../components/BusinessAvatar'
import { BusinessExperienceModal } from '../../components/BusinessExperienceModal'
import { GoogleIcon } from '../../components/GoogleIcon'
import { InstagramIcon } from '../../components/InstagramIcon'
import { SavingIndicator } from '../../components/SavingIndicator'
import { imageFileToDataUrl } from '../../utils/imageUpload'

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

  // Campos do formulário de negócio
  const [ownerId, setOwnerId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [menuUrl, setMenuUrl] = useState('')

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

      const matchOwner = ownerFilter === 'all' || b.owner_id === ownerFilter
      return matchSearch && matchOwner
    })
  }, [businesses, users, searchTerm, ownerFilter])

  const handleOpenCreate = () => {
    setEditingBiz(null)
    setOwnerId(users[0]?.id || '')
    setName('')
    setDescription('')
    setPhone('')
    setEmail('')
    setWebsite('')
    setAddress('')
    setCity('São Paulo')
    setState('SP')
    setLogoUrl('')
    setCoverUrl('')
    setGoogleReviewsUrl('')
    setInstagramUrl('')
    setMenuUrl('')
    setFormError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (biz: Business) => {
    setEditingBiz(biz)
    setOwnerId(biz.owner_id || users[0]?.id || '')
    setName(biz.name || '')
    setDescription(biz.description || '')
    setPhone(biz.phone || '')
    setEmail(biz.email || '')
    setWebsite(biz.website || '')
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

    if (!ownerId) {
      setFormError('Selecione o cliente responsável pelo negócio.')
      return
    }
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
      owner_id: ownerId,
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
      await api.logs.add({
        action: editingBiz ? 'ADMIN_UPDATE_BUSINESS' : 'ADMIN_CREATE_BUSINESS',
        entity_type: 'business',
        entity_id: editingBiz?.id || 'new',
        details: editingBiz
          ? `Estabelecimento "${payload.name}" atualizado pelo administrador.`
          : `Novo estabelecimento "${payload.name}" cadastrado pelo administrador.`,
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
  const businessesWithTags = businesses.filter((b) => tags.some((t) => t.business_id === b.id)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-600" />
            <span>Gestão Global de Negócios</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre, edite e controle todos os negócios, pontos comerciais e experiências das tags dos clientes.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Negócios</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalBusinesses}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Cadastrados no sistema</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Com Tags Ativas</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{businessesWithTags}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Com pelo menos 1 tag física associada</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs sm:col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tags NFC em Operação</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{totalLinkedTags}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Distribuídas entre os negócios</p>
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
            <option value="all">Todos os Clientes ({businesses.length} negócios)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({businesses.filter((b) => b.owner_id === u.id).length})
              </option>
            ))}
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
                          <span className="text-slate-400 italic">Cliente não encontrado</span>
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
                  Defina o cliente proprietário, dados de localização e links oficiais.
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
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase tracking-wider text-[11px]">
                  Cliente Proprietário *
                </label>
                <select
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden font-medium"
                >
                  <option value="" disabled>Selecione um cliente...</option>
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
                <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Endereço & Localização
                </span>
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
