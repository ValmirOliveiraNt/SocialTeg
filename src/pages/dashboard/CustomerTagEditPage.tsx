import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Radio,
  Star,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Sparkles,
  Printer,
  AlertCircle,
  Sliders,
  UtensilsCrossed,
  Smartphone,
  BarChart2,
  Clock,
  MapPin,
  Activity,
} from 'lucide-react'
import { InstagramIcon } from '../../components/InstagramIcon'
import { WhatsAppIcon } from '../../components/WhatsAppIcon'
import {
  NFCTag,
  Business,
  DestinationType,
  TagStatus,
  DestinationConfig,
  TagScan,
  TagDestination,
} from '../../types'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { QRCodeModal } from '../../components/QRCodeModal'
import { NFCWriterModal } from '../../components/NFCWriterModal'
import { TagScanHistoryModal } from '../../components/TagScanHistoryModal'
import { ExternalActions } from '../../components/ExternalActions'
import { SavingIndicator } from '../../components/SavingIndicator'
import { getPublicTagUrl } from '../../utils/url'

export const CustomerTagEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  const [tag, setTag] = useState<NFCTag | null>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])

  const [tagName, setTagName] = useState('')
  const [tagLocation, setTagLocation] = useState('')
  const [selectedBusinessId, setSelectedBusinessId] = useState('')
  const [tagStatus, setTagStatus] = useState<TagStatus>('active')

  // Ações Externas com Chave On / Off
  const [googleEnabled, setGoogleEnabled] = useState(true)
  const [googleUrl, setGoogleUrl] = useState('')

  const [instagramEnabled, setInstagramEnabled] = useState(false)
  const [instagramUser, setInstagramUser] = useState('')

  const [whatsappEnabled, setWhatsappEnabled] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [whatsappText, setWhatsappText] = useState('Olá! Vim através da Tag NFC.')

  const [menuEnabled, setMenuEnabled] = useState(false)
  const [menuUrl, setMenuUrl] = useState('')

  // Configurações de Apresentação
  const [directRedirect, setDirectRedirect] = useState(false)
  const [pageTemplate, setPageTemplate] = useState<'classic' | 'modern' | 'elegant'>('classic')
  const [welcomeTitle, setWelcomeTitle] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')
  const [customLogo, setCustomLogo] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#ea580c')
  const [starIncentive, setStarIncentive] = useState(true)

  const [savedSuccess, setSavedSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [nfcWriterOpen, setNfcWriterOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [scans, setScans] = useState<TagScan[]>([])
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [destination, setDestination] = useState<TagDestination | null>(null)

  useEffect(() => {
    if (!id || !currentUser) return

    async function loadData() {
      try {
        const foundTag = await api.tags.getById(id!)
        if (!foundTag) {
          navigate('/dashboard/tags')
          return
        }

        const bizList = await api.businesses.getAll(currentUser!.id)
        setBusinesses(bizList)
        setTag(foundTag)
        setTagName(foundTag.name)
        setTagLocation(foundTag.location || '')
        const currentBizId = foundTag.business_id || (bizList[0]?.id || '')
        setSelectedBusinessId(currentBizId)
        setTagStatus(foundTag.status)

        api.scans.getAll(undefined, foundTag.id).then(setScans).catch(() => {})

        const dest = await api.destinations.getByTagId(foundTag.id)
        setDestination(dest)
        const cfg = (dest?.configuration || {}) as DestinationConfig
        const currentBiz = bizList.find((b) => b.id === currentBizId) || bizList[0]

        // Google Reviews
        const initialGoogleUrl =
          cfg.google_url ||
          (dest?.type === 'google_review' ? dest.target_url : '') ||
          currentBiz?.googleReviewsUrl ||
          currentBiz?.google_reviews_url ||
          ''
        setGoogleUrl(initialGoogleUrl)
        setGoogleEnabled(
          cfg.google_enabled !== undefined
            ? Boolean(cfg.google_enabled)
            : Boolean(initialGoogleUrl) || dest?.type === 'google_review'
        )

        // Instagram
        const initialInsta =
          cfg.instagram_handle ||
          cfg.instagram_url ||
          (dest?.type === 'instagram' ? dest.target_url : '') ||
          currentBiz?.instagramUrl ||
          currentBiz?.instagram_url ||
          ''
        setInstagramUser(initialInsta)
        setInstagramEnabled(
          cfg.instagram_enabled !== undefined
            ? Boolean(cfg.instagram_enabled)
            : Boolean(initialInsta) || dest?.type === 'instagram'
        )

        // WhatsApp
        const initialPhone =
          cfg.whatsapp_number ||
          (dest?.type === 'whatsapp' ? dest.target_url.replace(/.*wa\.me\//, '').split('?')[0] : '') ||
          currentBiz?.phone ||
          ''
        setWhatsappPhone(initialPhone)
        setWhatsappText(cfg.whatsapp_message || 'Olá! Vim através da Tag NFC.')
        setWhatsappEnabled(
          cfg.whatsapp_enabled !== undefined
            ? Boolean(cfg.whatsapp_enabled)
            : Boolean(initialPhone) || dest?.type === 'whatsapp'
        )

        // Cardápio Online
        const initialMenu =
          cfg.menu_url ||
          (dest?.type === 'website' ? dest.target_url : '') ||
          currentBiz?.menuUrl ||
          currentBiz?.menu_url ||
          ''
        setMenuUrl(initialMenu)
        setMenuEnabled(
          cfg.menu_enabled !== undefined
            ? Boolean(cfg.menu_enabled)
            : Boolean(initialMenu) || dest?.type === 'website'
        )

        setDirectRedirect(cfg.direct_redirect ?? false)
        setPageTemplate(cfg.page_template || 'classic')
        setWelcomeTitle(cfg.welcome_title || '')
        setWelcomeMessage(cfg.welcome_message || '')
        setCustomLogo(cfg.custom_logo || currentBiz?.logo_url || '')
        setPrimaryColor(cfg.primary_color || '#ea580c')
        setStarIncentive(cfg.star_rating_incentive ?? true)
      } catch (err: any) {
        setErrorMessage(err.message)
      }
    }

    loadData()
  }, [id, currentUser, navigate])

  const publicUrl = tag ? getPublicTagUrl(tag.public_id) : ''

  const handleCopyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleTestLink = (urlToTest: string) => {
    if (!urlToTest) return
    const candidate = urlToTest.startsWith('http') ? urlToTest : `https://${urlToTest}`
    window.open(candidate, '_blank')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tag) return
    setErrorMessage(null)
    setIsSaving(true)

    // Formatações
    const cleanGoogle = googleUrl.trim()
    let cleanInsta = instagramUser.trim()
    if (cleanInsta.startsWith('@')) {
      cleanInsta = `https://instagram.com/${cleanInsta.replace('@', '')}`
    } else if (cleanInsta && !cleanInsta.startsWith('http')) {
      cleanInsta = `https://${cleanInsta}`
    }

    const cleanPhone = whatsappPhone.replace(/\D/g, '')
    const cleanWhatsapp = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText.trim())}`
      : ''

    let cleanMenu = menuUrl.trim()
    if (cleanMenu && !cleanMenu.startsWith('http')) {
      cleanMenu = `https://${cleanMenu}`
    }

    // Determina o tipo e target_url principal (para redirecionamento direto)
    let primaryType: DestinationType = 'google_review'
    let primaryTargetUrl = ''

    if (googleEnabled && cleanGoogle) {
      primaryType = 'google_review'
      primaryTargetUrl = cleanGoogle
    } else if (instagramEnabled && cleanInsta) {
      primaryType = 'instagram'
      primaryTargetUrl = cleanInsta
    } else if (whatsappEnabled && cleanWhatsapp) {
      primaryType = 'whatsapp'
      primaryTargetUrl = cleanWhatsapp
    } else if (menuEnabled && cleanMenu) {
      primaryType = 'website'
      primaryTargetUrl = cleanMenu
    } else {
      primaryTargetUrl = cleanGoogle || cleanInsta || cleanWhatsapp || cleanMenu || 'https://google.com'
    }

    const updatedTag: NFCTag = {
      ...tag,
      name: tagName.trim(),
      location: tagLocation.trim(),
      business_id: selectedBusinessId,
      status: tagStatus,
      updated_at: new Date().toISOString(),
    }

    try {
      await api.tags.save(updatedTag)
      setTag(updatedTag)

      await api.destinations.save({
        tag_id: tag.id,
        type: primaryType,
        target_url: primaryTargetUrl,
        title: 'Ações da Tag NFC',
        configuration: {
          google_enabled: googleEnabled,
          google_url: cleanGoogle,
          instagram_enabled: instagramEnabled,
          instagram_url: cleanInsta,
          instagram_handle: instagramUser.trim(),
          whatsapp_enabled: whatsappEnabled,
          whatsapp_url: cleanWhatsapp,
          whatsapp_number: cleanPhone,
          whatsapp_message: whatsappText.trim(),
          menu_enabled: menuEnabled,
          menu_url: cleanMenu,
          direct_redirect: directRedirect,
          page_template: pageTemplate,
          welcome_title: welcomeTitle,
          welcome_message: welcomeMessage,
          custom_logo: customLogo.trim(),
          primary_color: primaryColor,
          star_rating_incentive: starIncentive,
        },
      })

      await api.logs.add({
        user_id: currentUser?.id,
        user_email: currentUser?.email,
        action: 'UPDATE_TAG_CONFIG',
        entity_type: 'nfc_tag',
        entity_id: tag.id,
        details: `Configurações e botões da Tag ${tag.name} (${tag.serial_number}) atualizados.`,
      })

      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar alterações no servidor')
    } finally {
      setIsSaving(false)
    }
  }

  const activeButtonsCount = [googleEnabled, instagramEnabled, whatsappEnabled, menuEnabled].filter(Boolean).length

  if (!tag) {
    return <div className="p-8 text-slate-500 text-sm">Carregando dados da Tag...</div>
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/tags"
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl border border-slate-200 shadow-2xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{tag.name}</span>
              <span className="text-xs font-mono font-normal text-slate-400">
                ({tag.serial_number})
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Configure quais ações e botões aparecerão quando o cliente encostar o celular nesta Tag NFC.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNfcWriterOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Gravar Chip NFC</span>
          </button>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-blue-600" />
            <span>QR Code</span>
          </button>
          <Link
            to={`/print-stand/${tag.id}`}
            target="_blank"
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs transition flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Imprimir Display</span>
          </Link>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Configurações salvas com sucesso! As novas ações já estão ativas na Tag física.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2 text-red-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-blue-900">URL Dinâmica Permanente desta Tag:</div>
            <div className="text-xs font-mono text-blue-700 font-semibold">{publicUrl}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPublicUrl}
            className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg border border-blue-200 shadow-2xs transition flex items-center gap-1 cursor-pointer"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1"
          >
            <span>Testar no Navegador</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Card de Telemetria e Leituras em Tempo Real */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Telemetria & Leituras Desta Tag:</span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-black text-xs border border-blue-200">
                {scans.length} leituras
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              {scans[0] ? (
                <>
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Última leitura:{' '}
                    {scans[0].local_time
                      ? `${scans[0].local_date || ''} às ${scans[0].local_time}`
                      : new Date(scans[0].scanned_at).toLocaleString('pt-BR')}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    • {scans[0].reading_method || (scans[0].referrer?.includes('qr') ? 'QR Code' : 'NFC')}
                  </span>
                  {scans[0].region && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      Rede aproximada: {scans[0].region}
                    </span>
                  )}
                </>
              ) : (
                <span>Aguardando a primeira aproximação NFC ou leitura de QR Code.</span>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          className="px-3.5 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <BarChart2 className="w-3.5 h-3.5" />
          <span>Ver Histórico Completo ({scans.length})</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Identificação */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>1. Identificação da Tag no Ponto</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Nome de Identificação
              </label>
              <input
                type="text"
                required
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="Ex: Tag Balcão de Pagamento"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Estabelecimento / Filial
              </label>
              <select
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Localização Física no Local
              </label>
              <input
                type="text"
                value={tagLocation}
                onChange={(e) => setTagLocation(e.target.value)}
                placeholder="Ex: Caixa 01 ou Mesa 12"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-700 uppercase">Status Operacional:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTagStatus('active')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tagStatus === 'active'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Ativa (Respondendo)
              </button>
              <button
                type="button"
                onClick={() => setTagStatus('inactive')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tagStatus === 'inactive'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Pausada
              </button>
              <button
                type="button"
                onClick={() => setTagStatus('blocked')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  tagStatus === 'blocked'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Bloqueada
              </button>
            </div>
          </div>
        </div>

        {/* 2. Botões com Chaves On / Off */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600" />
                <span>2. Ações e Botões Ativos na Tag (On / Off)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Ative ou desative cada botão individualmente. Se mais de um estiver ativado, todos serão exibidos na tela do cliente.
              </p>
            </div>

            <span className="self-start sm:self-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {activeButtonsCount} {activeButtonsCount === 1 ? 'botão ativo' : 'botões ativos'}
            </span>
          </div>

          <div className="space-y-4">
            {/* Card 1: Google Avaliações */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                googleEnabled ? 'bg-orange-50/40 border-orange-200' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                    <Star className="w-5 h-5 fill-orange-500 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Avaliações do Google</h3>
                    <p className="text-[11px] text-slate-500">Coleta de reviews 5 estrelas no perfil do Google</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${googleEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {googleEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={googleEnabled}
                    onClick={() => setGoogleEnabled(!googleEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      googleEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        googleEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {googleEnabled && (
                <div className="mt-3 pt-3 border-t border-orange-200/60 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Link Oficial do Google Avaliações
                    </label>
                    {googleUrl && (
                      <button
                        type="button"
                        onClick={() => handleTestLink(googleUrl)}
                        className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Testar Link</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Dica: pegue o link de avaliação direto no perfil da sua empresa no Google Maps.
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Instagram */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                instagramEnabled ? 'bg-pink-50/40 border-pink-200' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center font-bold shrink-0">
                    <InstagramIcon className="w-5 h-5" colored={true} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Instagram</h3>
                    <p className="text-[11px] text-slate-500">Direciona clientes para seguir o perfil da loja</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${instagramEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {instagramEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={instagramEnabled}
                    onClick={() => setInstagramEnabled(!instagramEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      instagramEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        instagramEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {instagramEnabled && (
                <div className="mt-3 pt-3 border-t border-pink-200/60 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Perfil ou Link do Instagram
                    </label>
                    {instagramUser && (
                      <button
                        type="button"
                        onClick={() =>
                          handleTestLink(
                            instagramUser.startsWith('http')
                              ? instagramUser
                              : `https://instagram.com/${instagramUser.replace('@', '')}`
                          )
                        }
                        className="text-[11px] text-pink-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Testar Perfil</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={instagramUser}
                    onChange={(e) => setInstagramUser(e.target.value)}
                    placeholder="@seuestabelecimento ou https://instagram.com/seuestabelecimento"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              )}
            </div>

            {/* Card 3: WhatsApp */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                whatsappEnabled ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                    <WhatsAppIcon className="w-5 h-5" color="#25D366" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">WhatsApp Oficial</h3>
                    <p className="text-[11px] text-slate-500">Inicia conversa direta no WhatsApp do estabelecimento</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${whatsappEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {whatsappEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={whatsappEnabled}
                    onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      whatsappEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        whatsappEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {whatsappEnabled && (
                <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Número com DDD
                    </label>
                    <input
                      type="text"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Ex: 5511999998888"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Mensagem Pré-configurada
                    </label>
                    <input
                      type="text"
                      value={whatsappText}
                      onChange={(e) => setWhatsappText(e.target.value)}
                      placeholder="Ex: Olá! Vim através da Tag NFC."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Card 4: Cardápio Online / Site */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-200 ${
                menuEnabled ? 'bg-slate-100/70 border-slate-300' : 'bg-slate-50/60 border-slate-200 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0">
                    <UtensilsCrossed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Cardápio Online / Site</h3>
                    <p className="text-[11px] text-slate-500">Link para cardápio digital, catálogo ou página própria</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-bold ${menuEnabled ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {menuEnabled ? 'ON' : 'OFF'}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={menuEnabled}
                    onClick={() => setMenuEnabled(!menuEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                      menuEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        menuEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {menuEnabled && (
                <div className="mt-3 pt-3 border-t border-slate-200 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">
                      Link do Cardápio ou Website
                    </label>
                    {menuUrl && (
                      <button
                        type="button"
                        onClick={() => handleTestLink(menuUrl)}
                        className="text-[11px] text-slate-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Testar Link</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={menuUrl}
                    onChange={(e) => setMenuUrl(e.target.value)}
                    placeholder="https://seurestaurante.com.br/cardapio"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-700"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Prévia em tempo real */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Prévia dos botões na tela do cliente</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {activeButtonsCount === 0 ? 'Nenhum botão será exibido' : `${activeButtonsCount} exibido(s)`}
              </span>
            </div>

            <ExternalActions
              menuUrl={menuUrl}
              menuEnabled={menuEnabled}
              googleReviewsUrl={googleUrl}
              googleReviewsEnabled={googleEnabled}
              instagramUrl={
                instagramUser.startsWith('@')
                  ? `https://instagram.com/${instagramUser.replace('@', '')}`
                  : instagramUser
              }
              instagramEnabled={instagramEnabled}
              whatsappUrl={
                whatsappPhone
                  ? `https://wa.me/${whatsappPhone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappText)}`
                  : ''
              }
              whatsappEnabled={whatsappEnabled}
              primaryColor={primaryColor}
            />
          </div>
        </div>

        {/* 3. Estilo e Acolhimento */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>3. Experiência de Abertura & Página de Acolhimento</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setDirectRedirect(false)}
              className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                !directRedirect
                  ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 mb-1">
                Página Intermediária com Logotipo (Recomendado)
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Mostra o logotipo da sua empresa, estrelas e todos os botões que você ativou no Passo 2 acima.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setDirectRedirect(true)}
              className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                directRedirect
                  ? 'border-blue-600 bg-blue-50/50 shadow-2xs'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="font-bold text-xs text-slate-900 mb-1">
                Redirecionamento Direto Instantâneo
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Abre diretamente o primeiro link ativado sem passar pela página de apresentação.
              </p>
            </button>
          </div>

          {!directRedirect && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Modelo da página exibida ao cliente
                  </label>
                  <span className="text-[10px] text-slate-400">Escolha um estilo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { id: 'classic', name: 'Clássico', description: 'Claro, familiar e objetivo.', preview: 'bg-white border-slate-200', accent: 'bg-blue-600' },
                    { id: 'modern', name: 'Moderno', description: 'Escuro, marcante e tecnológico.', preview: 'bg-slate-950 border-slate-800', accent: 'bg-gradient-to-r from-cyan-400 to-blue-500' },
                    { id: 'elegant', name: 'Elegante', description: 'Sofisticado, leve e acolhedor.', preview: 'bg-amber-50 border-amber-200', accent: 'bg-amber-700' },
                  ] as const).map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setPageTemplate(template.id)}
                      className={`rounded-2xl border-2 p-3 text-left transition cursor-pointer ${
                        pageTemplate === template.id
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`mb-3 h-20 overflow-hidden rounded-xl border p-2 ${template.preview}`}>
                        <div className={`h-5 rounded-md ${template.accent}`} />
                        <div className="mx-auto -mt-1 h-7 w-7 rounded-full border-2 border-white bg-slate-300" />
                        <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-slate-300" />
                        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-slate-200" />
                      </div>
                      <div className="text-xs font-bold text-slate-900">{template.name}</div>
                      <p className="mt-1 text-[10px] leading-4 text-slate-500">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                    Título de Boas-Vindas
                  </label>
                  <input
                    type="text"
                    value={welcomeTitle}
                    onChange={(e) => setWelcomeTitle(e.target.value)}
                    placeholder="Ex: Como foi sua experiência conosco?"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                    Cor Principal dos Destaques
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white"
                    />
                    <span className="text-xs font-mono text-slate-600 font-bold uppercase">
                      {primaryColor}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  URL da Logomarca ou Foto (Opcional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="url"
                    value={customLogo}
                    onChange={(e) => setCustomLogo(e.target.value)}
                    placeholder="https://sua-empresa.com/logo.png ou link do Google Drive/Imgur"
                    className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                  />
                  {customLogo && (
                    <div className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                      <img
                        src={customLogo}
                        alt="Logo Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Se deixar vazio, será usada a logomarca cadastrada no estabelecimento.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  Mensagem de Agradecimento / Chamada para Ação
                </label>
                <textarea
                  rows={2}
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Sua opinião nos ajuda a evoluir nosso atendimento..."
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden"
                />
              </div>

              {googleEnabled && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="starIncentive"
                    checked={starIncentive}
                    onChange={(e) => setStarIncentive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="starIncentive" className="text-xs font-semibold text-slate-800 cursor-pointer">
                    Exibir as 5 estrelas interativas na página de abertura
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to="/dashboard/tags"
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSaving ? (
              <SavingIndicator label="Salvando..." />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </form>

      {qrModalOpen && (
        <QRCodeModal tag={tag} onClose={() => setQrModalOpen(false)} />
      )}

      {nfcWriterOpen && (
        <NFCWriterModal tag={tag} onClose={() => setNfcWriterOpen(false)} />
      )}

      {historyModalOpen && tag && (
        <TagScanHistoryModal
          tag={tag}
          scans={scans}
          destination={destination}
          business={businesses.find((b) => b.id === tag.business_id)}
          onClose={() => setHistoryModalOpen(false)}
        />
      )}
    </div>
  )
}

