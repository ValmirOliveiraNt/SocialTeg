import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star,
  ShieldAlert,
  HelpCircle,
  Radio,
  ArrowRight,
  Sparkles,
  MapPin,
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
    'found_active' | 'pending' | 'inactive' | 'blocked' | 'subscription_suspended' | 'not_found'
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

      if (foundTag.access_status === 'subscription_suspended') {
        setStatus('subscription_suspended')
        setLoading(false)
        return
      }

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
      let biz: Business | null = foundTag.business || null

      try {
        dest = await api.destinations.getByTagId(foundTag.id)
      } catch {}

      if (foundTag.business_id && !biz) {
        try {
          biz = await api.businesses.getPublicById(foundTag.business_id)
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
            : srcParam === 'direct'
              ? 'Link direto'
              : 'NFC provável / link antigo'

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

  if (status === 'subscription_suspended') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-7 text-center text-white shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black">Canal temporariamente indisponível</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            Este canal digital está passando por uma atualização. Para atendimento, procure diretamente o estabelecimento.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300">
            Conhecer a AvaliaTag <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
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
      card: 'bg-white/95 border-white/80 rounded-[2rem]',
      body: 'text-center',
      title: 'text-slate-900',
      location: 'text-slate-500',
      welcome: 'bg-slate-50/80 border-slate-200/80 shadow-[0_12px_30px_-24px_rgba(15,23,42,.45)]',
      welcomeTitle: 'text-slate-800',
      welcomeText: 'text-slate-600',
      logo: 'bg-white border-white/90 rounded-[2rem]',
      footer: 'text-slate-500',
    },
    modern: {
      page: 'bg-slate-950 bg-[radial-gradient(circle_at_top,#172554_0%,#020617_52%)]',
      card: 'bg-slate-900/95 border-slate-700/80 rounded-[2.25rem]',
      body: 'text-center',
      title: 'text-white',
      location: 'text-slate-400',
      welcome: 'bg-slate-800/80 border-slate-700 shadow-[0_16px_36px_-26px_rgba(0,0,0,.9)]',
      welcomeTitle: 'text-white',
      welcomeText: 'text-slate-300',
      logo: 'bg-white border-white/90 rounded-[2rem]',
      footer: 'text-slate-400',
    },
    elegant: {
      page: 'bg-[#f6f0e6] bg-[radial-gradient(circle_at_top,#fffaf0_0%,#ede2d0_68%)]',
      card: 'bg-[#fffdf8]/95 border-amber-200/70 rounded-[2.5rem]',
      body: 'text-center font-serif',
      title: 'text-stone-900 tracking-wide',
      location: 'text-stone-500',
      welcome: 'bg-amber-50/70 border-amber-200/80 shadow-[0_14px_32px_-26px_rgba(120,53,15,.7)]',
      welcomeTitle: 'text-stone-900',
      welcomeText: 'text-stone-600',
      logo: 'bg-white border-amber-100/80 rounded-[2rem]',
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

  const contactUrl = cfg.contact_url || (destination?.type === 'contact' ? destination.target_url : '') || ''
  const contactEnabled = cfg.contact_enabled !== undefined ? Boolean(cfg.contact_enabled) : destination?.type === 'contact'
  const addressUrl = cfg.address_url || (destination?.type === 'address' ? destination.target_url : '') || ''
  const addressEnabled = cfg.address_enabled !== undefined ? Boolean(cfg.address_enabled) : destination?.type === 'address'
  const ifoodUrl = cfg.ifood_url || (destination?.type === 'ifood' ? destination.target_url : '') || ''
  const ifoodEnabled = cfg.ifood_enabled !== undefined ? Boolean(cfg.ifood_enabled) : destination?.type === 'ifood'
  const youtubeUrl = cfg.youtube_url || (destination?.type === 'youtube' ? destination.target_url : '') || ''
  const youtubeEnabled = cfg.youtube_enabled !== undefined ? Boolean(cfg.youtube_enabled) : destination?.type === 'youtube'
  const wifiEnabled = Boolean(cfg.wifi_enabled && cfg.wifi_ssid)
  const customUrl = cfg.custom_url || (destination?.type === 'custom_url' ? destination.target_url : '') || ''
  const customEnabled = cfg.custom_enabled !== undefined ? Boolean(cfg.custom_enabled) : destination?.type === 'custom_url'

  const hasMultipleActions = [googleEnabled && googleUrl, instagramEnabled && instagramUrl, whatsappEnabled && whatsappUrl, menuEnabled && menuUrl, contactEnabled && contactUrl, addressEnabled && addressUrl, ifoodEnabled && ifoodUrl, youtubeEnabled && youtubeUrl, wifiEnabled, customEnabled && customUrl].filter(Boolean).length > 1

  return (
    <div className={`min-h-screen flex flex-col justify-between py-5 px-3 sm:py-8 sm:px-6 ${templateStyles.page}`}>
      <div className="max-w-md w-full mx-auto">
        <div className={`group shadow-[0_30px_80px_-34px_rgba(15,23,42,.55)] overflow-hidden border transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_38px_95px_-34px_rgba(15,23,42,.65)] ${templateStyles.card}`}>
          <div
            className="w-full relative flex h-44 sm:h-48 items-center justify-center overflow-hidden"
            style={{
              background:
                pageTemplate === 'modern'
                  ? `linear-gradient(135deg, ${primaryColor}, #020617)`
                  : pageTemplate === 'elegant'
                    ? `linear-gradient(135deg, ${primaryColor}, #78350f)`
                    : primaryColor,
            }}
          >
            {business?.cover_url ? (
              <>
                <img
                  src={business.cover_url}
                  alt={`Capa de ${business.name}`}
                  className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-black/15" />
              </>
            ) : (
              <>
                <div className="absolute -left-10 -top-16 h-44 w-44 rounded-full bg-white/20 blur-3xl motion-safe:animate-[pulse_6s_ease-in-out_infinite]" />
                <div className="absolute -bottom-20 right-0 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl motion-safe:animate-[pulse_7s_ease-in-out_infinite]" />
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_20%,white_0,transparent_38%)]" />
              </>
            )}
            <div className="absolute top-4 right-4 bg-slate-950/25 border border-white/20 shadow-lg backdrop-blur-xl px-3 py-1.5 rounded-full text-white text-[10px] font-bold tracking-wide flex items-center gap-1.5">
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

          <div className={`px-5 sm:px-7 pb-7 sm:pb-8 pt-0 relative ${templateStyles.body}`}>
            <div className="relative -mt-[4.5rem] mb-4 flex justify-center">
              <div className={`inline-block border p-1.5 shadow-[0_18px_45px_-14px_rgba(15,23,42,.5)] ring-4 ring-white/35 backdrop-blur-sm transition-transform duration-500 group-hover:-translate-y-1 ${templateStyles.logo}`}>
                <BusinessAvatar
                  src={tag?.configuration_mode === 'custom' ? (destination?.configuration?.custom_logo || business?.logo_url) : business?.logo_url}
                  name={business?.name || tag?.name}
                  size="xl"
                />
              </div>
            </div>

            <h1 className={`text-2xl font-black leading-tight mb-2 ${templateStyles.title}`}>
              {business?.name || tag?.name}
            </h1>
            {business?.city && (
              <p className={`mx-auto mb-5 inline-flex max-w-full items-center justify-center gap-1.5 rounded-full bg-black/[0.04] px-3 py-1.5 text-[11px] font-semibold ${templateStyles.location}`}>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{business.address}, {business.city} - {business.state}</span>
              </p>
            )}

            {/* Card de Boas-vindas */}
            <div className={`border rounded-3xl p-5 mb-5 transition-transform duration-300 hover:-translate-y-0.5 ${templateStyles.welcome}`}>
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
                contactUrl={contactUrl}
                contactEnabled={contactEnabled}
                addressUrl={addressUrl}
                addressEnabled={addressEnabled}
                ifoodUrl={ifoodUrl}
                ifoodEnabled={ifoodEnabled}
                youtubeUrl={youtubeUrl}
                youtubeEnabled={youtubeEnabled}
                wifiEnabled={wifiEnabled}
                wifiSsid={cfg.wifi_ssid}
                wifiPassword={cfg.wifi_password}
                wifiSecurity={cfg.wifi_security}
                wifiHidden={Boolean(cfg.wifi_hidden)}
                customUrl={customUrl}
                customLabel={cfg.custom_label}
                customEnabled={customEnabled}
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
            <img src="/brand/logo-horizontal-color-600.png" alt="AvaliaTag" className="h-5 w-auto object-contain" />
            <span>Tag NFC Gerenciada por <strong>AvaliaTag</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
