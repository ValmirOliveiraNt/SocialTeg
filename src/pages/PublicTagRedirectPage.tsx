import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star,
  ShieldAlert,
  HelpCircle,
  Radio,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { NFCTag, TagDestination, Business, DestinationConfig } from '../types'
import { api } from '../services/api'
import { ExternalActions } from '../components/ExternalActions'
import { BusinessAvatar } from '../components/BusinessAvatar'

export const PublicTagRedirectPage: React.FC = () => {
  const { publicId } = useParams<{ publicId: string }>()
  const scanEvent = useRef({ publicId, id: crypto.randomUUID() })
  const [tag, setTag] = useState<NFCTag | null>(null)
  const [destination, setDestination] = useState<TagDestination | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<
    'found_active' | 'pending' | 'inactive' | 'blocked' | 'not_found'
  >('not_found')
  const [countdown, setCountdown] = useState(2)
  const [selectedRating, setSelectedRating] = useState<number>(5)

  useEffect(() => {
    async function loadTagData() {
      if (!publicId) {
        setStatus('not_found')
        setLoading(false)
        return
      }

      let foundTag: NFCTag | null = null
      try {
        foundTag = await api.tags.getByPublicId(publicId)
      } catch {}

      if (!foundTag) {
        setStatus('not_found')
        setLoading(false)
        return
      }

      setTag(foundTag)

      if (foundTag.status === 'blocked' || foundTag.status === 'lost') {
        setStatus('blocked')
        setLoading(false)
        return
      }

      if (foundTag.status === 'pending_activation' || foundTag.status === 'available') {
        setStatus('pending')
        setLoading(false)
        return
      }

      if (foundTag.status === 'inactive') {
        setStatus('inactive')
        setLoading(false)
        return
      }

      let dest: TagDestination | null = null
      let biz: Business | null = null

      try {
        dest = await api.destinations.getByTagId(foundTag.id)
      } catch {}

      if (foundTag.business_id) {
        try {
          biz = await api.businesses.getById(foundTag.business_id)
        } catch {}
      }

      setDestination(dest || null)
      setBusiness(biz || null)
      setStatus('found_active')

      if (dest?.is_active && foundTag.status === 'active') {
        if (scanEvent.current.publicId !== publicId) scanEvent.current = { publicId, id: crypto.randomUUID() }
        const searchParams = new URLSearchParams(window.location.search)
        const srcParam = searchParams.get('src')
        const method =
          srcParam === 'qr'
            ? 'QR Code'
            : srcParam === 'nfc'
            ? 'NFC Aproximação'
            : 'unknown'

        const now = new Date()
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Sao_Paulo'
        let localDateStr = ''
        let localTimeStr = ''
        try {
          localDateStr = now.toLocaleDateString('pt-BR', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' })
          localTimeStr = now.toLocaleTimeString('pt-BR', { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit' })
        } catch {
          localDateStr = now.toISOString().split('T')[0]
          localTimeStr = now.toISOString().split('T')[1]?.substring(0, 8) || ''
        }

        api.scans.record(foundTag.id, dest.type, {
          event_id: scanEvent.current.id,
          reading_method: method,
          local_date: localDateStr,
          local_time: localTimeStr,
          timezone: timeZone,
          language: typeof navigator !== 'undefined' ? navigator.language : 'pt-BR',
          screen: typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : undefined,
          referrer: typeof document !== 'undefined' ? (document.referrer || method) : method,
        })
      }

      setLoading(false)
    }

    loadTagData()
  }, [publicId])

  useEffect(() => {
    if (status === 'found_active' && destination?.configuration?.direct_redirect) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            if (tag) {
              api.scans.record(tag.id, destination.type, {
                event_id: crypto.randomUUID(),
                event_type: 'destination_open',
                parent_event_id: scanEvent.current.id,
                reading_method: 'unknown',
                referrer: 'direct_redirect',
              })
            }
            window.location.href = destination.target_url
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [status, destination, tag])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
          <Radio className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <p className="text-sm font-medium text-slate-300">Conectando à Tag NFC...</p>
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 border border-slate-200">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Tag NFC Não Encontrada</h1>
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          O identificador <code>{publicId}</code> não está associado a nenhuma Tag cadastrada em nossa plataforma.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition"
        >
          Ir para Página Inicial
        </Link>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
          <Radio className="w-8 h-8 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Tag NFC Aguardando Ativação</h1>
        <p className="text-sm text-slate-600 max-w-md mb-2 leading-relaxed">
          Esta Tag física já foi entregue e precisa ser vinculada a um estabelecimento no painel de controle.
        </p>
        <p className="text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 mb-6">
          Serial: {tag?.serial_number}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition shadow-xs"
          >
            Entrar no Painel e Ativar
          </Link>
          <Link
            to="/"
            className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition"
          >
            Conhecer a Plataforma
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'inactive' || status === 'blocked') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {status === 'blocked' ? 'Tag NFC Bloqueada' : 'Tag Temporariamente Pausada'}
        </h1>
        <p className="text-sm text-slate-600 max-w-sm mb-6">
          Esta Tag está temporariamente desativada pelo estabelecimento proprietário ou pelo administrador.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-xl transition"
        >
          Voltar ao Início
        </Link>
      </div>
    )
  }

  if (destination?.configuration?.direct_redirect) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center mb-6">
          <Radio className="w-8 h-8 text-blue-400 animate-ping" />
        </div>
        <h2 className="text-xl font-bold mb-2">Redirecionando automaticamente...</h2>
        <p className="text-sm text-slate-400 max-w-xs mb-4">
          Você será enviado para {business?.name || 'a página de destino'} em {countdown} segundo{countdown > 1 ? 's' : ''}.
        </p>
        <a
          href={destination.target_url}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-lg transition"
        >
          <span>Acessar Imediatamente</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    )
  }

  const primaryColor = destination?.configuration?.primary_color || '#2563eb'
  const cfg = (destination?.configuration || {}) as DestinationConfig
  const biz = (business || {}) as Business
  const pageTemplate = cfg.page_template || 'classic'
  const templateStyles = {
    classic: {
      page: 'bg-slate-100',
      card: 'bg-white border-slate-200/80 rounded-3xl',
      body: 'text-center',
      title: 'text-slate-900',
      location: 'text-slate-500',
      welcome: 'bg-slate-50 border-slate-200/80',
      welcomeTitle: 'text-slate-800',
      welcomeText: 'text-slate-600',
      logo: 'bg-white border-white rounded-3xl',
      footer: 'text-slate-500',
    },
    modern: {
      page: 'bg-slate-950 bg-[radial-gradient(circle_at_top,#172554_0%,#020617_52%)]',
      card: 'bg-slate-900 border-slate-700 rounded-[2rem]',
      body: 'text-center',
      title: 'text-white',
      location: 'text-slate-400',
      welcome: 'bg-slate-800/80 border-slate-700',
      welcomeTitle: 'text-white',
      welcomeText: 'text-slate-300',
      logo: 'bg-slate-900 border-slate-700 rounded-3xl',
      footer: 'text-slate-400',
    },
    elegant: {
      page: 'bg-[#f6f0e6] bg-[radial-gradient(circle_at_top,#fffaf0_0%,#ede2d0_68%)]',
      card: 'bg-[#fffdf8] border-amber-200/80 rounded-[2.5rem]',
      body: 'text-center font-serif',
      title: 'text-stone-900 tracking-wide',
      location: 'text-stone-500',
      welcome: 'bg-amber-50/70 border-amber-200/80',
      welcomeTitle: 'text-stone-900',
      welcomeText: 'text-stone-600',
      logo: 'bg-[#fffdf8] border-amber-100 rounded-full',
      footer: 'text-stone-500',
    },
  }[pageTemplate]

  // Google Reviews
  const googleUrl =
    cfg.google_url ||
    (destination?.type === 'google_review' ? destination.target_url : '') ||
    biz.googleReviewsUrl ||
    biz.google_reviews_url ||
    ''
  const googleEnabled =
    cfg.google_enabled !== undefined
      ? Boolean(cfg.google_enabled)
      : Boolean(googleUrl) || destination?.type === 'google_review'

  // Instagram
  const instagramUrl =
    cfg.instagram_url ||
    cfg.instagram_handle ||
    (destination?.type === 'instagram' ? destination.target_url : '') ||
    biz.instagramUrl ||
    biz.instagram_url ||
    ''
  const instagramEnabled =
    cfg.instagram_enabled !== undefined
      ? Boolean(cfg.instagram_enabled)
      : Boolean(instagramUrl) || destination?.type === 'instagram'

  // WhatsApp
  const whatsappUrl =
    cfg.whatsapp_url ||
    (cfg.whatsapp_number
      ? `https://wa.me/${cfg.whatsapp_number}?text=${encodeURIComponent(cfg.whatsapp_message || '')}`
      : '') ||
    (destination?.type === 'whatsapp' ? destination.target_url : '') ||
    (biz.phone ? `https://wa.me/${biz.phone.replace(/\D/g, '')}` : '')
  const whatsappEnabled =
    cfg.whatsapp_enabled !== undefined
      ? Boolean(cfg.whatsapp_enabled)
      : Boolean(whatsappUrl) || destination?.type === 'whatsapp'

  // Cardápio Online
  const menuUrl =
    cfg.menu_url ||
    (destination?.type === 'website' ? destination.target_url : '') ||
    biz.menuUrl ||
    biz.menu_url ||
    ''
  const menuEnabled =
    cfg.menu_enabled !== undefined
      ? Boolean(cfg.menu_enabled)
      : Boolean(menuUrl) || destination?.type === 'website'

  const hasMultipleActions = [googleEnabled && googleUrl, instagramEnabled && instagramUrl, whatsappEnabled && whatsappUrl, menuEnabled && menuUrl].filter(Boolean).length > 1

  return (
    <div className={`min-h-screen flex flex-col justify-between py-6 px-4 sm:px-6 ${templateStyles.page}`}>
      <div className="max-w-md w-full mx-auto">
        <div className={`shadow-2xl overflow-hidden border ${templateStyles.card}`}>
          <div
            className={`w-full relative flex items-center justify-center overflow-hidden ${pageTemplate === 'modern' ? 'h-40' : 'h-32'}`}
            style={{
              background:
                pageTemplate === 'modern'
                  ? `linear-gradient(135deg, ${primaryColor}, #020617)`
                  : pageTemplate === 'elegant'
                    ? `linear-gradient(135deg, ${primaryColor}, #78350f)`
                    : primaryColor,
            }}
          >
            {business?.cover_url && (
              <img
                src={business.cover_url}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
            )}
            <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>
                {hasMultipleActions
                  ? 'Ações Oficiais'
                  : destination?.type === 'google_review'
                  ? 'Avaliação Verificada'
                  : destination?.type === 'instagram'
                  ? 'Instagram Oficial'
                  : destination?.type === 'whatsapp'
                  ? 'Atendimento Oficial'
                  : 'Espaço Digital'}
              </span>
            </div>
          </div>

          <div className={`px-6 pb-8 pt-0 relative ${templateStyles.body}`}>
            <div className="relative -mt-14 mb-4 flex justify-center">
              <div className={`p-1.5 shadow-xl border-2 inline-block ${templateStyles.logo}`}>
                <BusinessAvatar
                  src={destination?.configuration?.custom_logo || business?.logo_url}
                  name={business?.name || tag?.name}
                  size="lg"
                />
              </div>
            </div>

            <h1 className={`text-xl font-black mb-1 ${templateStyles.title}`}>
              {business?.name || tag?.name}
            </h1>
            {business?.city && (
              <p className={`text-xs font-medium mb-4 ${templateStyles.location}`}>
                {business.address}, {business.city} - {business.state}
              </p>
            )}

            {/* Card de Boas-vindas */}
            <div className={`border rounded-2xl p-4 mb-6 ${templateStyles.welcome}`}>
              <h2 className={`text-sm font-bold mb-1 ${templateStyles.welcomeTitle}`}>
                {destination?.configuration?.welcome_title ||
                  (googleEnabled && googleUrl
                    ? 'Como foi sua experiência conosco?'
                    : instagramEnabled && instagramUrl
                    ? 'Siga nosso Instagram!'
                    : whatsappEnabled && whatsappUrl
                    ? 'Fale conosco no WhatsApp'
                    : menuEnabled && menuUrl
                    ? 'Cardápio & Informações'
                    : 'Bem-vindo ao nosso espaço digital')}
              </h2>
              <p className={`text-xs leading-relaxed mb-4 ${templateStyles.welcomeText}`}>
                {destination?.configuration?.welcome_message ||
                  (googleEnabled && googleUrl
                    ? 'Sua opinião é fundamental para nossa equipe e leva menos de 1 minuto no Google!'
                    : instagramEnabled && instagramUrl
                    ? 'Acompanhe novidades, bastidores e promoções exclusivas no seu feed.'
                    : whatsappEnabled && whatsappUrl
                    ? 'Tire dúvidas, faça pedidos ou fale com a nossa equipe em poucos toques.'
                    : menuEnabled && menuUrl
                    ? 'Confira nossos pratos, preços e especialidades atualizadas.'
                    : 'Acesse nossos canais e ações com um simples toque.')}
              </p>

              {googleEnabled && Boolean(googleUrl) && destination?.configuration?.star_rating_incentive !== false && (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSelectedRating(star)}
                        className="p-1 text-amber-400 hover:scale-125 transition transform cursor-pointer"
                        title={`${star} estrelas`}
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= selectedRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-semibold text-amber-600">
                    {selectedRating === 5
                      ? 'Excelente! Adoramos saber!'
                      : 'Obrigado pelo seu feedback sincero!'}
                  </span>
                </div>
              )}
            </div>

            {/* Ações Externas Condicionais (Cardápio, Google Avaliações, Instagram, WhatsApp) */}
            <div className="space-y-3">
              <ExternalActions
                menuUrl={menuUrl}
                menuEnabled={menuEnabled}
                googleReviewsUrl={googleUrl}
                googleReviewsEnabled={googleEnabled}
                instagramUrl={instagramUrl}
                instagramEnabled={instagramEnabled}
                whatsappUrl={whatsappUrl}
                whatsappEnabled={whatsappEnabled}
                primaryColor={primaryColor}
                fallbackUrl={destination?.target_url}
                fallbackType={destination?.type}
                onAction={(destinationType) => {
                  if (!tag) return
                  api.scans.record(tag.id, destinationType, {
                    event_id: crypto.randomUUID(),
                    event_type: 'destination_open',
                    parent_event_id: scanEvent.current.id,
                    reading_method: 'unknown',
                    referrer: 'public_page_action',
                  })
                }}
              />

              {business?.phone && !whatsappEnabled && (
                <div className="pt-2 text-[11px] text-slate-500">
                  Dúvidas ou sugestões diretas? Tel: {business.phone}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className={`inline-flex items-center gap-2 text-[11px] ${templateStyles.footer}`}>
            <img src="/logo.png" alt="AvaliaTag" className="h-5 w-auto object-contain" />
            <span>Tag NFC Gerenciada por <strong>AvaliaTag</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}

