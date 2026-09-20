import React from 'react'
import { ExternalLink, Link2, MapPin, Phone, ShoppingBag, UtensilsCrossed, Video } from 'lucide-react'
import { InstagramIcon } from './InstagramIcon'
import { GoogleIcon } from './GoogleIcon'
import { WhatsAppIcon } from './WhatsAppIcon'

export interface ExternalActionsProps {
  menuUrl?: string | null
  menuEnabled?: boolean
  googleReviewsUrl?: string | null
  googleReviewsEnabled?: boolean
  instagramUrl?: string | null
  instagramEnabled?: boolean
  whatsappUrl?: string | null
  whatsappEnabled?: boolean
  contactUrl?: string | null
  contactEnabled?: boolean
  addressUrl?: string | null
  addressEnabled?: boolean
  ifoodUrl?: string | null
  ifoodEnabled?: boolean
  youtubeUrl?: string | null
  youtubeEnabled?: boolean
  customUrl?: string | null
  customLabel?: string | null
  customEnabled?: boolean
  primaryColor?: string
  className?: string
  fallbackUrl?: string | null
  fallbackType?: string | null
  onAction?: (action: 'google_review' | 'instagram' | 'whatsapp' | 'website' | 'contact' | 'address' | 'ifood' | 'youtube' | 'custom_url') => void
}

function checkValidUrl(url: string | null | undefined): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (!trimmed) return false
  try {
    const parsed = new URL(trimmed)
    return ['http:', 'https:', 'tel:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export const ExternalActions: React.FC<ExternalActionsProps> = ({
  menuUrl,
  menuEnabled = true,
  googleReviewsUrl,
  googleReviewsEnabled = true,
  instagramUrl,
  instagramEnabled = true,
  whatsappUrl,
  whatsappEnabled = true,
  contactUrl,
  contactEnabled = false,
  addressUrl,
  addressEnabled = false,
  ifoodUrl,
  ifoodEnabled = false,
  youtubeUrl,
  youtubeEnabled = false,
  customUrl,
  customLabel,
  customEnabled = false,
  primaryColor = '#ea580c',
  className = '',
  fallbackUrl,
  fallbackType,
  onAction,
}) => {
  let cleanMenuUrl = checkValidUrl(menuUrl) ? menuUrl!.trim() : null
  let cleanGoogleUrl = checkValidUrl(googleReviewsUrl) ? googleReviewsUrl!.trim() : null
  let cleanInstagramUrl = checkValidUrl(instagramUrl) ? instagramUrl!.trim() : null
  let cleanWhatsappUrl = checkValidUrl(whatsappUrl) ? whatsappUrl!.trim() : null
  const cleanContactUrl = checkValidUrl(contactUrl) ? contactUrl!.trim() : null
  const cleanAddressUrl = checkValidUrl(addressUrl) ? addressUrl!.trim() : null
  const cleanIfoodUrl = checkValidUrl(ifoodUrl) ? ifoodUrl!.trim() : null
  const cleanYoutubeUrl = checkValidUrl(youtubeUrl) ? youtubeUrl!.trim() : null
  const cleanCustomUrl = checkValidUrl(customUrl) ? customUrl!.trim() : null

  // Compatibilidade com tags legadas onde o destino direto estava em target_url
  if (
    !cleanMenuUrl &&
    !cleanGoogleUrl &&
    !cleanInstagramUrl &&
    !cleanWhatsappUrl &&
    checkValidUrl(fallbackUrl)
  ) {
    if (fallbackType === 'instagram') {
      cleanInstagramUrl = fallbackUrl!.trim()
    } else if (fallbackType === 'website') {
      cleanMenuUrl = fallbackUrl!.trim()
    } else if (fallbackType === 'whatsapp') {
      cleanWhatsappUrl = fallbackUrl!.trim()
    } else {
      cleanGoogleUrl = fallbackUrl!.trim()
    }
  }

  const actions: Array<{
    id: string
    title: string
    url: string
    icon: React.ReactNode
    ariaLabel: string
    style?: React.CSSProperties
    className: string
    destinationType: 'google_review' | 'instagram' | 'whatsapp' | 'website' | 'contact' | 'address' | 'ifood' | 'youtube' | 'custom_url'
  }> = []

  // 1. Cardápio Online
  if (menuEnabled && cleanMenuUrl) {
    actions.push({
      id: 'menu',
      title: 'Cardápio Online',
      url: cleanMenuUrl,
      ariaLabel: 'Acessar Cardápio Online em nova aba',
      icon: (
        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center p-0.5 shrink-0 border border-white/20">
          <UtensilsCrossed className="w-3 h-3 text-white" aria-hidden="true" />
        </div>
      ),
      className:
        'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-sm hover:shadow-md border border-slate-800',
      destinationType: 'website',
    })
  }

  // 2. Google Avaliações
  if (googleReviewsEnabled && cleanGoogleUrl) {
    actions.push({
      id: 'google',
      title: 'Avalie no Google',
      url: cleanGoogleUrl,
      ariaLabel: 'Avaliar estabelecimento no Google em nova aba',
      style: { backgroundColor: primaryColor },
      icon: (
        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
          <GoogleIcon className="w-3.5 h-3.5" />
        </div>
      ),
      className:
        'text-white shadow-md hover:shadow-lg filter hover:brightness-105 active:brightness-95',
      destinationType: 'google_review',
    })
  }

  // 3. Instagram
  if (instagramEnabled && cleanInstagramUrl) {
    actions.push({
      id: 'instagram',
      title: 'Instagram',
      url: cleanInstagramUrl,
      ariaLabel: 'Visitar perfil do Instagram em nova aba',
      icon: (
        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
          <InstagramIcon className="w-3.5 h-3.5" colored={true} />
        </div>
      ),
      className:
        'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 active:opacity-90 text-white shadow-sm hover:shadow-md',
      destinationType: 'instagram',
    })
  }

  // 4. WhatsApp
  if (whatsappEnabled && cleanWhatsappUrl) {
    actions.push({
      id: 'whatsapp',
      title: 'WhatsApp',
      url: cleanWhatsappUrl,
      ariaLabel: 'Abrir conversa no WhatsApp em nova aba',
      icon: (
        <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center p-0.5 shrink-0 shadow-2xs">
          <WhatsAppIcon className="w-3.5 h-3.5" color="#25D366" />
        </div>
      ),
      className:
        'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow-md border border-emerald-600',
      destinationType: 'whatsapp',
    })
  }

  const additionalActions = [
    { enabled: addressEnabled, url: cleanAddressUrl, id: 'address', title: 'Como chegar', ariaLabel: 'Abrir endereço e rota em nova aba', icon: <MapPin className="w-4 h-4" />, className: 'bg-blue-600 hover:bg-blue-700 text-white', destinationType: 'address' as const },
    { enabled: contactEnabled, url: cleanContactUrl, id: 'contact', title: 'Contato', ariaLabel: 'Abrir canal de contato', icon: <Phone className="w-4 h-4" />, className: 'bg-cyan-700 hover:bg-cyan-800 text-white', destinationType: 'contact' as const },
    { enabled: ifoodEnabled, url: cleanIfoodUrl, id: 'ifood', title: 'Pedir no iFood', ariaLabel: 'Abrir loja no iFood em nova aba', icon: <ShoppingBag className="w-4 h-4" />, className: 'bg-red-600 hover:bg-red-700 text-white', destinationType: 'ifood' as const },
    { enabled: youtubeEnabled, url: cleanYoutubeUrl, id: 'youtube', title: 'YouTube', ariaLabel: 'Abrir canal do YouTube em nova aba', icon: <Video className="w-4 h-4" />, className: 'bg-[#ff0033] hover:bg-red-700 text-white', destinationType: 'youtube' as const },
    { enabled: customEnabled, url: cleanCustomUrl, id: 'custom', title: customLabel?.trim() || 'Link personalizado', ariaLabel: 'Abrir link personalizado em nova aba', icon: <Link2 className="w-4 h-4" />, className: 'bg-violet-600 hover:bg-violet-700 text-white', destinationType: 'custom_url' as const },
  ]

  additionalActions.forEach((action) => {
    if (action.enabled && action.url) actions.push({ ...action, url: action.url })
  })

  if (actions.length === 0) {
    return null
  }

  return (
    <nav
      aria-label="Ações externas do estabelecimento"
      className={`w-full flex flex-col gap-2.5 ${className}`}
    >
      <div
        className={`grid gap-2.5 w-full ${
          actions.length === 1
            ? 'grid-cols-1'
            : actions.length === 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : actions.length === 3
            ? 'grid-cols-1 sm:grid-cols-3'
            : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onAction?.(action.destinationType)}
            aria-label={action.ariaLabel}
            style={action.style}
            className={`min-h-[48px] py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${action.className}`}
          >
            {action.icon}
            <span className="truncate">{action.title}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75 shrink-0" aria-hidden="true" />
          </a>
        ))}
      </div>
    </nav>
  )
}
