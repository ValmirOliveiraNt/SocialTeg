import React, { useState, useEffect } from 'react'
import { Plus, MapPin, Phone, Mail, Edit2, Trash2, X, AlertCircle, CheckCircle2, UtensilsCrossed, SlidersHorizontal } from 'lucide-react'
import { Business, NFCTag } from '../../types'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { InstagramIcon } from '../../components/InstagramIcon'
import { GoogleIcon } from '../../components/GoogleIcon'
import { BusinessAvatar } from '../../components/BusinessAvatar'
import { SavingIndicator } from '../../components/SavingIndicator'
import { BusinessExperienceModal } from '../../components/BusinessExperienceModal'

export const CustomerBusinessesPage: React.FC = () => {
  const { currentUser } = useAuth()
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [tags, setTags] = useState<NFCTag[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingBiz, setEditingBiz] = useState<Business | null>(null)
  const [loading, setLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null)
  const [configBusiness, setConfigBusiness] = useState<Business | null>(null)

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

  // Campos de Ações Externas Configuráveis
  const [menuUrl, setMenuUrl] = useState('')
  const [googleReviewsUrl, setGoogleReviewsUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')

  const loadData = () => {
    if (!currentUser) return
    api.businesses.getAll(currentUser.id).then(setBusinesses).catch(() => {})
    api.tags.getAll(currentUser.id).then(setTags).catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [currentUser])

  const handleOpenAdd = () => {
    setEditingBiz(null)
    setName('')
    setDescription('')
    setPhone('')
    setEmail(currentUser?.email || '')
    setWebsite('')
    setAddress('')
    setCity('São Paulo')
    setState('SP')
    setLogoUrl('')
    setCoverUrl('')
    setMenuUrl('')
    setGoogleReviewsUrl('')
    setInstagramUrl('')
    setUrlError(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (b: Business) => {
    setEditingBiz(b)
    setName(b.name)
    setDescription(b.description || '')
    setPhone(b.phone || '')
    setEmail(b.email || '')
    setWebsite(b.website || '')
    setAddress(b.address)
    setCity(b.city)
    setState(b.state)
    setLogoUrl(b.logo_url)
    setCoverUrl(b.cover_url || '')
    setMenuUrl(b.menuUrl || b.menu_url || '')
    setGoogleReviewsUrl(b.googleReviewsUrl || b.google_reviews_url || '')
    setInstagramUrl(b.instagramUrl || b.instagram_url || '')
    setUrlError(null)
    setModalOpen(true)
  }

  const handleDelete = async (b: Business) => {
    if (!confirm(`Deseja realmente excluir o estabelecimento ${b.name}?`)) return
    try {
      await api.businesses.delete(b.id)
      setSaveSuccessMsg(`Estabelecimento "${b.name}" excluído com sucesso.`)
      setTimeout(() => setSaveSuccessMsg(null), 3000)
      loadData()
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir')
    }
  }

  const normalizeUrl = (url: string, label: string): string => {
    const trimmed = url.trim()
    if (!trimmed) return ''
    if (label === 'Instagram' && trimmed.startsWith('@')) {
      return `https://instagram.com/${trimmed.replace('@', '')}`
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return `https://${trimmed}`
    }
    return trimmed
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setUrlError(null)

    setLoading(true)

    const cleanMenu = normalizeUrl(menuUrl, 'Cardápio Online')
    const cleanGoogle = normalizeUrl(googleReviewsUrl, 'Link para avaliações do Google')
    const cleanInsta = normalizeUrl(instagramUrl, 'Instagram')

    console.log('[ExternalActions:save]', {
      menuUrl: cleanMenu,
      googleReviewsUrl: cleanGoogle,
      instagramUrl: cleanInsta,
    })

    const biz: Partial<Business> = {
      id: editingBiz?.id,
      owner_id: currentUser.id,
      name: name.trim(),
      description: description.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      country: 'Brasil',
      logo_url: logoUrl.trim(),
      cover_url: coverUrl.trim(),
      menuUrl: cleanMenu,
      googleReviewsUrl: cleanGoogle,
      instagramUrl: cleanInsta,
      menu_url: cleanMenu,
      google_reviews_url: cleanGoogle,
      instagram_url: cleanInsta,
    }

    try {
      const savedBusiness = await api.businesses.save(biz)
      setSaveSuccessMsg(
        editingBiz
          ? `Estabelecimento "${name}" atualizado com sucesso!`
          : `Estabelecimento "${name}" cadastrado com sucesso!`
      )
      setTimeout(() => setSaveSuccessMsg(null), 3000)
      loadData()
      setModalOpen(false)
      if (!editingBiz) setConfigBusiness(savedBusiness)
    } catch (err: any) {
      setUrlError(err.message || 'Erro ao salvar estabelecimento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Estabelecimentos Cadastrados
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerencie os dados e a experiência completa compartilhada por todas as tags de cada estabelecimento.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Estabelecimento</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses.map((biz) => {
          const bizTags = tags.filter((t) => t.business_id === biz.id)
          const cfg = (biz.default_destination_configuration || {}) as import('../../types').DestinationConfig
          const hasMenu = Boolean(cfg.menu_enabled && cfg.menu_url)
          const hasGoogle = Boolean(cfg.google_enabled && cfg.google_url)
          const hasInsta = Boolean(cfg.instagram_enabled && (cfg.instagram_url || cfg.instagram_handle))

          return (
            <div
              key={biz.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="shrink-0">
                    <BusinessAvatar src={biz.logo_url} name={biz.name} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-base truncate">{biz.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {biz.description}
                    </p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700">
                      <span>{bizTags.length} Tag(s) vinculada(s)</span>
                    </div>
                  </div>
                </div>

                {/* Badges de Ações Externas Ativas */}
                <div className="mb-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                    Ações:
                  </span>
                  {hasMenu && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                      <UtensilsCrossed className="w-3 h-3" />
                      <span>Cardápio</span>
                    </span>
                  )}
                  {hasGoogle && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-lg">
                      <GoogleIcon className="w-3 h-3" />
                      <span>Google</span>
                    </span>
                  )}
                  {hasInsta && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-pink-50 text-pink-700 border border-pink-200 px-2 py-0.5 rounded-lg">
                      <InstagramIcon className="w-3 h-3" colored={true} />
                      <span>Instagram</span>
                    </span>
                  )}
                  {!hasMenu && !hasGoogle && !hasInsta && (
                    <span className="text-[11px] text-slate-400 italic">
                      Nenhuma ação externa configurada
                    </span>
                  )}
                </div>

                <div className="space-y-2 py-3 border-y border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{biz.address}, {biz.city} - {biz.state}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{biz.phone || 'Sem telefone'}</span>
                  </div>
                  {biz.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{biz.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfigBusiness(biz)}
                  className="mr-auto px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Configurar experiência</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(biz)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Editar</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(biz)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative my-8 animate-in fade-in zoom-in-95">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingBiz ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe somente os dados cadastrais. Identidade visual, links e experiência ficam em “Configurar experiência”.
            </p>

            {urlError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{urlError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  Nome do Estabelecimento *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Café & Bistrô Central"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  Descrição Curta
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Cafeteria artesanal e confeitaria"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contato@empresa.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  Endereço Completo *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, Número, Bairro"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                    Estado (UF) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <SavingIndicator label="Salvando Estabelecimento..." />
                  ) : (
                    'Salvar Estabelecimento'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {configBusiness && (
        <BusinessExperienceModal
          business={configBusiness}
          onClose={() => setConfigBusiness(null)}
          onSaved={(saved) => {
            setBusinesses((current) => current.map((item) => item.id === saved.id ? saved : item))
            setSaveSuccessMsg(`Configuração de "${saved.name}" aplicada às tags vinculadas.`)
            setTimeout(() => setSaveSuccessMsg(null), 4000)
          }}
        />
      )}
    </div>
  )
}
