import React, { useMemo, useState } from 'react'
import { X, Save, Star, MessageCircle, UtensilsCrossed, Phone, MapPin, ShoppingBag, Video, Link2, Sparkles, Upload, ImageIcon, Loader2, Wifi } from 'lucide-react'
import { Business, DestinationConfig, DestinationType } from '../types'
import { api } from '../services/api'
import { ExternalActions } from './ExternalActions'
import { SavingIndicator } from './SavingIndicator'
import { InstagramIcon } from './InstagramIcon'
import { BusinessAvatar } from './BusinessAvatar'
import { imageFileToDataUrl } from '../utils/imageUpload'

type ChannelKey = 'google' | 'instagram' | 'whatsapp' | 'menu' | 'contact' | 'address' | 'ifood' | 'youtube' | 'custom'

const channels: Array<{ key: ChannelKey; label: string; description: string; valueKey: string; enabledKey: string; placeholder: string; icon: React.ElementType; color: string }> = [
  { key: 'google', label: 'Avaliações do Google', description: 'Link direto para avaliar o estabelecimento', valueKey: 'google_url', enabledKey: 'google_enabled', placeholder: 'https://search.google.com/local/writereview?...', icon: Star, color: 'bg-amber-50 text-amber-600' },
  { key: 'instagram', label: 'Instagram', description: 'Perfil oficial do estabelecimento', valueKey: 'instagram_handle', enabledKey: 'instagram_enabled', placeholder: '@perfil ou https://instagram.com/perfil', icon: InstagramIcon, color: 'bg-pink-50 text-pink-600' },
  { key: 'whatsapp', label: 'WhatsApp', description: 'Conversa direta com mensagem pronta', valueKey: 'whatsapp_number', enabledKey: 'whatsapp_enabled', placeholder: '5584999999999', icon: MessageCircle, color: 'bg-emerald-50 text-emerald-600' },
  { key: 'menu', label: 'Cardápio / Site', description: 'Cardápio, catálogo ou site oficial', valueKey: 'menu_url', enabledKey: 'menu_enabled', placeholder: 'https://seusite.com/cardapio', icon: UtensilsCrossed, color: 'bg-slate-100 text-slate-800' },
  { key: 'contact', label: 'Contato', description: 'Telefone, e-mail ou atendimento', valueKey: 'contact_url', enabledKey: 'contact_enabled', placeholder: 'contato@empresa.com ou (84) 99999-9999', icon: Phone, color: 'bg-cyan-50 text-cyan-700' },
  { key: 'address', label: 'Endereço / Como chegar', description: 'Endereço ou link do Google Maps', valueKey: 'address_url', enabledKey: 'address_enabled', placeholder: 'Rua, número, cidade/UF', icon: MapPin, color: 'bg-blue-50 text-blue-700' },
  { key: 'ifood', label: 'iFood', description: 'Página da loja no iFood', valueKey: 'ifood_url', enabledKey: 'ifood_enabled', placeholder: 'https://www.ifood.com.br/delivery/...', icon: ShoppingBag, color: 'bg-red-50 text-red-600' },
  { key: 'youtube', label: 'YouTube', description: 'Canal, vídeo ou playlist', valueKey: 'youtube_url', enabledKey: 'youtube_enabled', placeholder: 'https://youtube.com/@seucanal', icon: Video, color: 'bg-red-50 text-red-600' },
  { key: 'custom', label: 'Link personalizado', description: 'Qualquer outra ação importante', valueKey: 'custom_url', enabledKey: 'custom_enabled', placeholder: 'https://seusite.com/pagina', icon: Link2, color: 'bg-violet-50 text-violet-700' },
]

const withHttps = (value: string) => {
  const clean = value.trim()
  return clean && !/^[a-z][a-z\d+.-]*:/i.test(clean) ? `https://${clean}` : clean
}

export const BusinessExperienceModal: React.FC<{ business: Business; onClose: () => void; onSaved: (business: Business) => void }> = ({ business, onClose, onSaved }) => {
  const initial = (business.default_destination_configuration || {}) as Partial<DestinationConfig>
  const [config, setConfig] = useState<DestinationConfig>({
    direct_redirect: initial.direct_redirect ?? false,
    page_template: initial.page_template || 'classic',
    welcome_title: initial.welcome_title || '',
    welcome_message: initial.welcome_message || '',
    primary_color: initial.primary_color || '#2563eb',
    star_rating_incentive: initial.star_rating_incentive ?? true,
    google_enabled: initial.google_enabled ?? Boolean(initial.google_url || business.google_reviews_url || business.googleReviewsUrl),
    google_url: initial.google_url || business.google_reviews_url || business.googleReviewsUrl || '',
    instagram_enabled: initial.instagram_enabled ?? Boolean(initial.instagram_handle || initial.instagram_url || business.instagram_url || business.instagramUrl),
    instagram_handle: initial.instagram_handle || initial.instagram_url || business.instagram_url || business.instagramUrl || '',
    whatsapp_enabled: initial.whatsapp_enabled ?? Boolean(initial.whatsapp_number || business.phone),
    whatsapp_number: initial.whatsapp_number || business.phone || '',
    whatsapp_message: initial.whatsapp_message || 'Olá! Vim através da Tag NFC.',
    menu_enabled: initial.menu_enabled ?? Boolean(initial.menu_url || business.menu_url || business.menuUrl),
    menu_url: initial.menu_url || business.menu_url || business.menuUrl || '',
    contact_enabled: initial.contact_enabled ?? false,
    contact_url: initial.contact_url || '',
    address_enabled: initial.address_enabled ?? false,
    address_url: initial.address_url || '',
    ifood_enabled: initial.ifood_enabled ?? false,
    ifood_url: initial.ifood_url || '',
    youtube_enabled: initial.youtube_enabled ?? false,
    youtube_url: initial.youtube_url || '',
    wifi_enabled: initial.wifi_enabled ?? false,
    wifi_ssid: initial.wifi_ssid || '',
    wifi_password: initial.wifi_password || '',
    wifi_security: initial.wifi_security || 'WPA',
    wifi_hidden: initial.wifi_hidden ?? false,
    custom_enabled: initial.custom_enabled ?? false,
    custom_url: initial.custom_url || '',
    custom_label: initial.custom_label || 'Saiba mais',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState(business.logo_url || '')
  const [coverUrl, setCoverUrl] = useState(business.cover_url || '')
  const [processingImage, setProcessingImage] = useState<'logo' | 'cover' | null>(null)

  const update = (key: string, value: any) => setConfig((current) => ({ ...current, [key]: value }))
  const enabledCount = channels.filter((channel) => Boolean(config[channel.enabledKey])).length + (config.wifi_enabled ? 1 : 0)

  const handleImageFile = async (file: File | undefined, kind: 'logo' | 'cover') => {
    if (!file) return
    setError(null)
    setProcessingImage(kind)
    try {
      const dataUrl = await imageFileToDataUrl(file, kind === 'logo'
        ? { maxWidth: 640, maxHeight: 640, quality: 0.88, maxDataLength: 220_000 }
        : { maxWidth: 1400, maxHeight: 800, quality: 0.8, maxDataLength: 650_000 })
      if (kind === 'logo') setLogoUrl(dataUrl)
      else setCoverUrl(dataUrl)
    } catch (err: any) {
      setError(err.message || 'Não foi possível processar a imagem.')
    } finally {
      setProcessingImage(null)
    }
  }

  const preview = useMemo(() => {
    const instagram = String(config.instagram_handle || '').trim()
    const phone = String(config.whatsapp_number || '').replace(/\D/g, '')
    return {
      google: String(config.google_url || ''),
      instagram: instagram.startsWith('@') ? `https://instagram.com/${instagram.slice(1)}` : withHttps(instagram),
      whatsapp: phone ? `https://wa.me/${phone}?text=${encodeURIComponent(String(config.whatsapp_message || ''))}` : '',
      menu: withHttps(String(config.menu_url || '')),
      contact: String(config.contact_url || ''),
      address: String(config.address_url || ''),
      ifood: withHttps(String(config.ifood_url || '')),
      youtube: withHttps(String(config.youtube_url || '')),
      custom: withHttps(String(config.custom_url || '')),
    }
  }, [config])

  const handleSave = async () => {
    setError(null)
    if (config.wifi_enabled && !String(config.wifi_ssid || '').trim()) {
      setError('Informe o nome da rede Wi-Fi para ativar esse botão.')
      return
    }
    if (config.wifi_enabled && config.wifi_security !== 'nopass' && !String(config.wifi_password || '')) {
      setError('Informe a senha da rede Wi-Fi ou selecione “Sem senha”.')
      return
    }
    const rawContact = String(config.contact_url || '').trim()
    const contact = rawContact.includes('@') && !rawContact.includes('://') ? `mailto:${rawContact}` : /^\+?[\d\s().-]+$/.test(rawContact) ? `tel:${rawContact.replace(/[^\d+]/g, '')}` : withHttps(rawContact)
    const rawAddress = String(config.address_url || '').trim()
    const address = rawAddress && !/^[a-z][a-z\d+.-]*:/i.test(rawAddress) ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rawAddress)}` : rawAddress
    const normalized: DestinationConfig = {
      ...config,
      direct_redirect: config.wifi_enabled ? false : config.direct_redirect,
      google_url: String(config.google_url || '').trim(),
      instagram_url: preview.instagram,
      whatsapp_number: String(config.whatsapp_number || '').replace(/\D/g, ''),
      whatsapp_url: preview.whatsapp,
      menu_url: preview.menu,
      contact_url: contact,
      address_url: address,
      ifood_url: preview.ifood,
      youtube_url: preview.youtube,
      custom_url: preview.custom,
      custom_label: String(config.custom_label || '').trim() || 'Saiba mais',
      custom_logo: '',
    }
    const candidates: Array<[boolean, string, DestinationType]> = [
      [Boolean(normalized.google_enabled), String(normalized.google_url || ''), 'google_review'],
      [Boolean(normalized.instagram_enabled), String(normalized.instagram_url || ''), 'instagram'],
      [Boolean(normalized.whatsapp_enabled), String(normalized.whatsapp_url || ''), 'whatsapp'],
      [Boolean(normalized.menu_enabled), String(normalized.menu_url || ''), 'website'],
      [Boolean(normalized.contact_enabled), String(normalized.contact_url || ''), 'contact'],
      [Boolean(normalized.address_enabled), String(normalized.address_url || ''), 'address'],
      [Boolean(normalized.ifood_enabled), String(normalized.ifood_url || ''), 'ifood'],
      [Boolean(normalized.youtube_enabled), String(normalized.youtube_url || ''), 'youtube'],
      [Boolean(normalized.custom_enabled), String(normalized.custom_url || ''), 'custom_url'],
    ]
    const primary = candidates.find(([enabled, value]) => enabled && Boolean(value))
    if (!primary) {
      setError('Ative e preencha pelo menos um canal para definir o destino principal.')
      return
    }
    setSaving(true)
    try {
      const saved = await api.businesses.save({
        id: business.id,
        logo_url: logoUrl.trim(),
        cover_url: coverUrl.trim(),
        default_destination_type: primary[2],
        default_target_url: primary[1],
        default_destination_configuration: normalized,
        menu_url: normalized.menu_url || '',
        google_reviews_url: normalized.google_url || '',
        instagram_url: normalized.instagram_url || '',
      })
      onSaved(saved)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Não foi possível salvar a configuração do estabelecimento.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/65 p-3 backdrop-blur-sm sm:p-6">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur-xl sm:p-6">
          <div><span className="text-[10px] font-black uppercase tracking-[.2em] text-blue-600">Padrão compartilhado</span><h2 className="mt-1 text-xl font-black text-slate-950">Experiência de {business.name}</h2><p className="mt-1 text-xs text-slate-500">Todas as tags vinculadas usam esta configuração, salvo as marcadas como exceção.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><ImageIcon className="h-4 w-4 text-blue-600" /><div><h3 className="text-sm font-black text-slate-900">Logo e capa do estabelecimento</h3><p className="text-xs text-slate-500">Envie um arquivo ou cole um link. A identidade será aplicada à página pública e aos modelos personalizados.</p></div></div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between"><strong className="text-xs uppercase tracking-wide text-slate-700">Logo</strong>{logoUrl && <button type="button" onClick={() => setLogoUrl('')} className="text-[10px] font-bold text-red-600">Remover</button>}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
                  <label className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 ${processingImage === 'logo' ? 'pointer-events-none opacity-60' : ''}`}>{processingImage === 'logo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{processingImage === 'logo' ? 'Processando...' : 'Enviar arquivo'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={processingImage !== null} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void handleImageFile(file, 'logo') }} /></label>
                  <div className="relative"><Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input type="url" value={logoUrl.startsWith('data:image/') ? '' : logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder={logoUrl.startsWith('data:image/') ? 'Imagem enviada do computador' : 'Ou cole o link'} className="min-h-10 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs" /></div>
                </div>
                <p className="text-[10px] text-slate-500">PNG, JPG ou WebP, até 8 MB. Prefira fundo transparente.</p>
                {logoUrl && <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"><BusinessAvatar src={logoUrl} name={business.name} size="md" /><div><strong className="block text-xs text-slate-800">Prévia da logo</strong><span className="text-[10px] text-slate-500">Proporção preservada, sem cortes.</span></div></div>}
              </div>
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between"><strong className="text-xs uppercase tracking-wide text-slate-700">Capa</strong>{coverUrl && <button type="button" onClick={() => setCoverUrl('')} className="text-[10px] font-bold text-red-600">Remover</button>}</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[auto_1fr]">
                  <label className={`inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 ${processingImage === 'cover' ? 'pointer-events-none opacity-60' : ''}`}>{processingImage === 'cover' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{processingImage === 'cover' ? 'Processando...' : 'Enviar arquivo'}<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={processingImage !== null} onChange={(event) => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; void handleImageFile(file, 'cover') }} /></label>
                  <div className="relative"><Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" /><input type="url" value={coverUrl.startsWith('data:image/') ? '' : coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder={coverUrl.startsWith('data:image/') ? 'Imagem enviada do computador' : 'Ou cole o link'} className="min-h-10 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs" /></div>
                </div>
                <p className="text-[10px] text-slate-500">Recomendado: imagem horizontal de 1200 × 500 px.</p>
                {coverUrl && <div className="relative aspect-[12/5] overflow-hidden rounded-xl border border-slate-200 bg-slate-100"><img src={coverUrl} alt={`Capa de ${business.name}`} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/10" /><div className="absolute bottom-2 left-2 flex items-center gap-2 text-white"><BusinessAvatar src={logoUrl} name={business.name} size="sm" className="ring-2 ring-white/80" /><span className="max-w-44 truncate text-[11px] font-black drop-shadow">{business.name}</span></div></div>}
              </div>
            </div>
          </section>
          <section>
            <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-black text-slate-900">Canais e botões</h3><p className="text-xs text-slate-500">Defina os canais disponíveis e use ON/OFF para controlar o que aparece.</p></div><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{enabledCount} ativos</span></div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {channels.map((channel) => {
                const Icon = channel.icon
                const enabled = Boolean(config[channel.enabledKey])
                return <div key={channel.key} className={`rounded-2xl border p-4 transition ${enabled ? 'border-blue-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/70'}`}>
                  <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${channel.color}`}><Icon className="h-4 w-4" /></div><div><strong className="block text-xs text-slate-900">{channel.label}</strong><span className="text-[11px] text-slate-500">{channel.description}</span></div></div><button type="button" role="switch" aria-checked={enabled} onClick={() => update(channel.enabledKey, !enabled)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-5' : 'left-0.5'}`} /></button></div>
                  {enabled && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{channel.key === 'custom' && <input value={String(config.custom_label || '')} onChange={(event) => update('custom_label', event.target.value)} maxLength={28} placeholder="Texto do botão" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs" />}<input value={String(config[channel.valueKey] || '')} onChange={(event) => update(channel.valueKey, event.target.value)} placeholder={channel.placeholder} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" />{channel.key === 'whatsapp' && <input value={String(config.whatsapp_message || '')} onChange={(event) => update('whatsapp_message', event.target.value)} placeholder="Mensagem inicial do WhatsApp" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" />}</div>}
                </div>
              })}
              <div className={`rounded-2xl border p-4 transition ${config.wifi_enabled ? 'border-sky-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50/70'}`}>
                <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Wifi className="h-4 w-4" /></div><div><strong className="block text-xs text-slate-900">Wi-Fi para clientes</strong><span className="text-[11px] text-slate-500">QR Code e cópia dos dados da rede</span></div></div><button type="button" role="switch" aria-checked={Boolean(config.wifi_enabled)} onClick={() => setConfig((current) => ({ ...current, wifi_enabled: !current.wifi_enabled, direct_redirect: current.wifi_enabled ? current.direct_redirect : false }))} className={`relative h-6 w-11 shrink-0 rounded-full transition ${config.wifi_enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${config.wifi_enabled ? 'left-5' : 'left-0.5'}`} /></button></div>
                {config.wifi_enabled && <div className="mt-3 space-y-2 border-t border-slate-100 pt-3"><input value={String(config.wifi_ssid || '')} onChange={(event) => update('wifi_ssid', event.target.value)} placeholder="Nome da rede (SSID)" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" /><input type="password" autoComplete="new-password" value={String(config.wifi_password || '')} onChange={(event) => update('wifi_password', event.target.value)} placeholder="Senha da rede" disabled={config.wifi_security === 'nopass'} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs disabled:bg-slate-100" /><div className="grid grid-cols-2 gap-2"><select value={config.wifi_security || 'WPA'} onChange={(event) => update('wifi_security', event.target.value)} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"><option value="WPA">WPA/WPA2/WPA3</option><option value="WEP">WEP</option><option value="nopass">Sem senha</option></select><label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-600"><input type="checkbox" checked={Boolean(config.wifi_hidden)} onChange={(event) => update('wifi_hidden', event.target.checked)} />Rede oculta</label></div><p className="text-[10px] leading-4 text-amber-700">Recomendado: configure uma rede exclusiva para visitantes.</p></div>}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /><div><h3 className="text-sm font-black text-slate-900">Abertura e identidade visual</h3><p className="text-xs text-slate-500">Controle como a experiência será apresentada ao cliente.</p></div></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="rounded-2xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-slate-800">Forma de abertura</span><select value={config.direct_redirect ? 'direct' : 'page'} disabled={Boolean(config.wifi_enabled)} onChange={(event) => update('direct_redirect', event.target.value === 'direct')} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs disabled:bg-slate-100 disabled:text-slate-400"><option value="page">Página com todos os botões</option><option value="direct">Abrir primeiro link diretamente</option></select>{config.wifi_enabled && <span className="mt-2 block text-[10px] text-sky-700">A página de botões é necessária para mostrar o acesso ao Wi-Fi.</span>}</label>
              <label className="rounded-2xl border border-slate-200 bg-white p-4"><span className="text-xs font-bold text-slate-800">Modelo da página</span><select value={config.page_template} disabled={Boolean(config.direct_redirect)} onChange={(event) => update('page_template', event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs disabled:opacity-50"><option value="classic">Clássico</option><option value="modern">Moderno</option><option value="elegant">Elegante</option></select></label>
              <label><span className="text-xs font-bold text-slate-700">Título de boas-vindas</span><input value={String(config.welcome_title || '')} onChange={(event) => update('welcome_title', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Como foi sua experiência?" /></label>
              <label><span className="text-xs font-bold text-slate-700">Cor principal</span><div className="mt-1 flex items-center gap-3"><input type="color" value={String(config.primary_color || '#2563eb')} onChange={(event) => update('primary_color', event.target.value)} className="h-10 w-14 rounded-lg border border-slate-300 bg-white p-1" /><span className="font-mono text-xs font-bold uppercase text-slate-600">{config.primary_color}</span></div></label>
            </div>
            <label className="mt-4 block"><span className="text-xs font-bold text-slate-700">Mensagem da página</span><textarea rows={3} value={String(config.welcome_message || '')} onChange={(event) => update('welcome_message', event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs" placeholder="Sua opinião é muito importante para nossa equipe." /></label>
            <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-800"><input type="checkbox" checked={Boolean(config.star_rating_incentive)} onChange={(event) => update('star_rating_incentive', event.target.checked)} className="h-4 w-4 accent-blue-600" />Exibir estrelas interativas quando o Google estiver ativo</label>
          </section>

          <section className="rounded-3xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><strong className="text-xs uppercase tracking-wider text-slate-700">Prévia dos botões</strong><span className="text-[11px] text-slate-500">A logo e a capa vêm dos dados do estabelecimento</span></div><ExternalActions menuUrl={preview.menu} menuEnabled={Boolean(config.menu_enabled)} googleReviewsUrl={preview.google} googleReviewsEnabled={Boolean(config.google_enabled)} instagramUrl={preview.instagram} instagramEnabled={Boolean(config.instagram_enabled)} whatsappUrl={preview.whatsapp} whatsappEnabled={Boolean(config.whatsapp_enabled)} contactUrl={preview.contact} contactEnabled={Boolean(config.contact_enabled)} addressUrl={preview.address} addressEnabled={Boolean(config.address_enabled)} ifoodUrl={preview.ifood} ifoodEnabled={Boolean(config.ifood_enabled)} youtubeUrl={preview.youtube} youtubeEnabled={Boolean(config.youtube_enabled)} wifiEnabled={Boolean(config.wifi_enabled)} wifiSsid={config.wifi_ssid} wifiPassword={config.wifi_password} wifiSecurity={config.wifi_security} wifiHidden={Boolean(config.wifi_hidden)} customUrl={preview.custom} customLabel={String(config.custom_label || 'Saiba mais')} customEnabled={Boolean(config.custom_enabled)} primaryColor={String(config.primary_color || '#2563eb')} /></section>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-2 border-t border-slate-200 bg-white/95 p-4 backdrop-blur-xl sm:px-6"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="button" disabled={saving} onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-60">{saving ? <SavingIndicator label="Salvando padrão..." /> : <><Save className="h-4 w-4" />Salvar para todas as tags</>}</button></div>
      </div>
    </div>
  )
}
