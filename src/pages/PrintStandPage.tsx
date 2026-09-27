import React, { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, ArrowLeft, Star, Smartphone, Radio, Check, Sparkles } from 'lucide-react'
import { NFCTag, Business } from '../types'
import { api } from '../services/api'
import { GoogleIcon } from '../components/GoogleIcon'
import { getPublicTagUrl } from '../utils/url'

type PrintTemplate = 'classic-logo' | 'navy-logo' | 'clean' | 'impact' | 'aurora-logo' | 'editorial-logo' | 'orbit-system' | 'mono-system'
type BrandMode = 'business' | 'system' | 'none'
type TemplateDefinition = {
  id: PrintTemplate
  name: string
  description: string
  brandMode: BrandMode
  preview: string
  accent: string
}

const templates: TemplateDefinition[] = [
  { id: 'classic-logo', name: 'Clássico Personalizado', description: 'Logo do estabelecimento em destaque e AvaliaTag no rodapé.', brandMode: 'business', preview: 'bg-white', accent: 'bg-blue-600' },
  { id: 'navy-logo', name: 'Azul Premium', description: 'Marca do estabelecimento sobre uma composição azul sofisticada.', brandMode: 'business', preview: 'bg-[#0b1f3b]', accent: 'bg-blue-500' },
  { id: 'aurora-logo', name: 'Aurora Personalizado', description: 'Gradiente moderno e luminoso com a logo do estabelecimento.', brandMode: 'business', preview: 'bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-400', accent: 'bg-fuchsia-300' },
  { id: 'editorial-logo', name: 'Editorial Boutique', description: 'Estética elegante, minimalista e ideal para marcas premium.', brandMode: 'business', preview: 'bg-[#f4efe5]', accent: 'bg-[#19211d]' },
  { id: 'orbit-system', name: 'AvaliaTag Orbit', description: 'Identidade AvaliaTag em um visual tecnológico e vibrante.', brandMode: 'system', preview: 'bg-gradient-to-br from-[#07152c] to-[#163c7a]', accent: 'bg-cyan-400' },
  { id: 'mono-system', name: 'AvaliaTag Mono', description: 'Modelo institucional limpo, marcante e econômico na impressão.', brandMode: 'system', preview: 'bg-white', accent: 'bg-slate-950' },
  { id: 'clean', name: 'Essencial', description: 'Visual neutro, leve e sem logomarca.', brandMode: 'none', preview: 'bg-slate-50', accent: 'bg-blue-500' },
  { id: 'impact', name: 'Alto Impacto', description: 'Chamada forte em azul, sem logomarca.', brandMode: 'none', preview: 'bg-blue-600', accent: 'bg-amber-400' },
]

const brandLabels: Record<BrandMode, string> = {
  business: 'LOGO DO ESTABELECIMENTO',
  system: 'LOGO AVALIATAG',
  none: 'SEM LOGO',
}

const DisplayArtwork: React.FC<{ tag: NFCTag; business?: Business; template: PrintTemplate; last: boolean }> = ({ tag, business, template, last }) => {
  const qrUrl = `${getPublicTagUrl(tag.public_id)}?src=qr`
  const definition = templates.find((item) => item.id === template) || templates[0]
  const navy = template === 'navy-logo'
  const impact = template === 'impact'
  const aurora = template === 'aurora-logo'
  const editorial = template === 'editorial-logo'
  const orbit = template === 'orbit-system'
  const mono = template === 'mono-system'
  const dark = navy || impact || aurora || orbit
  const businessBranded = definition.brandMode === 'business'
  const systemBranded = definition.brandMode === 'system'
  const [failedLogo, setFailedLogo] = useState<string | null>(null)
  const businessLogo = business?.logo_url?.trim() || ''
  const hasBusinessLogo = Boolean(businessLogo && failedLogo !== businessLogo)
  const shell = aurora
    ? 'overflow-hidden border-violet-300 bg-gradient-to-br from-[#5316a8] via-[#1559d6] to-[#00a7b7] text-white'
    : orbit
      ? 'overflow-hidden border-cyan-400 bg-[#07152c] text-white'
      : editorial
        ? 'overflow-hidden border-[#cfc4b1] bg-[#f4efe5] text-[#19211d]'
        : mono
          ? 'border-slate-950 bg-white text-slate-950'
          : navy
            ? 'bg-[#0B1F3B] text-white border-[#006CFF]'
            : impact
              ? 'bg-blue-600 text-white border-blue-800'
              : 'bg-white text-slate-900 border-slate-300'
  const muted = dark ? 'text-blue-100' : editorial ? 'text-[#666d66]' : 'text-slate-600'
  const eyebrow = dark ? 'bg-white/12 text-white border-white/15' : editorial ? 'bg-[#19211d] text-[#f4efe5] border-[#19211d]' : mono ? 'bg-slate-950 text-white border-slate-950' : 'bg-blue-50 text-blue-700 border-blue-100'
  const qrFrame = dark ? 'bg-white shadow-[0_22px_50px_-20px_rgba(0,0,0,.65)]' : editorial ? 'bg-white border border-[#d8cfbe] shadow-[0_22px_45px_-26px_rgba(25,33,29,.55)]' : mono ? 'bg-white border-[3px] border-slate-950' : 'bg-slate-50 border-2 border-slate-200'
  const instructions = dark ? 'bg-black/15 border-white/20 text-white' : editorial ? 'bg-[#e8e0d2] border-[#cfc4b1] text-[#19211d]' : mono ? 'bg-slate-950 border-slate-950 text-white' : 'bg-blue-50 border-blue-200/80 text-blue-950'
  const logoIsWhite = navy || orbit
  return (
    <article className={`w-full max-w-md mx-auto rounded-[2rem] shadow-xl p-7 border-2 text-center relative print:shadow-none print:rounded-none print:max-w-none print:w-[180mm] print:min-h-[260mm] print:flex print:flex-col print:justify-center ${shell}`} style={{ breakAfter: last ? 'auto' : 'page', pageBreakAfter: last ? 'auto' : 'always', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      {aurora && <><div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/25 blur-2xl" /><div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-fuchsia-400/25 blur-2xl" /></>}
      {orbit && <><div className="pointer-events-none absolute left-1/2 top-12 h-72 w-72 -translate-x-1/2 rounded-full border border-cyan-300/20" /><div className="pointer-events-none absolute left-1/2 top-24 h-56 w-56 -translate-x-1/2 rounded-full border border-blue-300/15" /></>}
      {editorial && <div className="pointer-events-none absolute left-0 top-0 h-2 w-full bg-[#19211d]" />}
      <div className="relative z-10">
      {businessBranded && hasBusinessLogo && (
        <img
          src={businessLogo}
          alt={`Logo de ${business?.name || tag.name}`}
          onError={() => setFailedLogo(businessLogo)}
          className="mx-auto mb-5 h-auto max-h-24 w-auto max-w-[280px] object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.28)]"
        />
      )}
      {systemBranded && <img src={logoIsWhite ? '/brand/logo-horizontal-white-1200.png' : '/brand/logo-horizontal-color-600.png'} alt="AvaliaTag" className="h-11 sm:h-14 w-auto max-w-[240px] mx-auto object-contain mb-5 drop-shadow-[0_6px_10px_rgba(0,0,0,0.2)]" />}
      <div className={`inline-flex mx-auto items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${eyebrow}`}><GoogleIcon className="w-5 h-5" /><span>Avalie sua experiência no Google</span></div>
      <div className="flex justify-center gap-1.5 my-4">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="w-7 h-7 fill-amber-400 text-amber-400" />)}</div>
      <h1 className={`text-2xl font-black mb-1 leading-tight ${editorial ? 'font-serif tracking-tight' : ''}`}>{business?.name || tag.name}</h1>
      <p className={`text-sm font-medium mb-5 ${muted}`}>{impact ? 'Gostou do atendimento? Conte para todo mundo!' : editorial ? 'Sua experiência merece ser compartilhada.' : orbit ? 'Aproxime, avalie e ajude este negócio a crescer.' : 'Sua opinião é fundamental para nossa equipe.'}</p>
      <div className={`rounded-[1.6rem] p-5 mb-5 inline-block mx-auto ${qrFrame}`}>
        <QRCodeSVG value={qrUrl} size={205} level="H" includeMargin={false} imageSettings={{ src: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png', x: undefined, y: undefined, height: 40, width: 40, excavate: true }} />
      </div>
      <div className={`rounded-2xl border p-4 text-xs font-semibold flex flex-col gap-2 ${instructions}`}>
        <div className="flex items-center justify-center gap-2"><Radio className="w-4 h-4" /><span>Aproxime o celular da Tag NFC</span></div>
        <div className="flex items-center justify-center gap-2"><Smartphone className="w-4 h-4" /><span>Ou aponte a câmera para o QR Code</span></div>
      </div>
      <div className={`mt-5 pt-3 border-t flex items-center ${businessBranded || systemBranded ? 'justify-between' : 'justify-center'} gap-4 text-[10px] ${dark ? 'border-white/15 text-blue-100' : editorial ? 'border-[#cfc4b1] text-[#72786f]' : mono ? 'border-slate-950 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
        <span className="font-mono">ID: {tag.public_id}</span>
        {businessBranded && (
          <div className="flex items-center gap-2">
            <span className="font-medium opacity-80">Tecnologia</span>
            <img
              src={dark ? '/brand/logo-horizontal-white-1200.png' : '/brand/logo-horizontal-color-600.png'}
              alt="AvaliaTag"
              className="h-5 w-auto max-w-28 object-contain"
            />
          </div>
        )}
        {systemBranded && <span className="font-semibold">Aproximou. Avaliou. Cresceu.</span>}
      </div>
      </div>
    </article>
  )
}

export const PrintStandPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>()
  const [searchParams] = useSearchParams()
  const [tags, setTags] = useState<NFCTag[]>([])
  const [businesses, setBusinesses] = useState<Record<string, Business>>({})
  const [template, setTemplate] = useState<PrintTemplate>('classic-logo')
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const ids = tagId === 'batch' ? (searchParams.get('ids') || '').split(',').filter(Boolean) : tagId ? [tagId] : []
    Promise.all(ids.map((id) => api.tags.getById(id))).then(async (found) => {
      const validTags = found.filter(Boolean) as NFCTag[]
      setTags(validTags)
      const businessIds = Array.from(new Set(validTags.map((tag) => tag.business_id).filter(Boolean))) as string[]
      const list = await Promise.all(businessIds.map((id) => api.businesses.getById(id)))
      setBusinesses(Object.fromEntries(list.filter(Boolean).map((business) => [business!.id, business!])))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [tagId, searchParams])
  if (loading) return <div className="p-8 text-center text-slate-500">Preparando modelos de impressão...</div>
  if (tags.length === 0) return <div className="p-8 text-center text-slate-600">Nenhuma tag encontrada. <Link to="/dashboard/tags" className="text-blue-600 underline">Voltar</Link></div>
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-5xl mx-auto mb-6 print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Link to="/dashboard/tags" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"><ArrowLeft className="w-4 h-4" />Voltar para Tags</Link>
          <button onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"><Printer className="w-4 h-4" />Imprimir {tags.length} {tags.length === 1 ? 'display' : 'displays'}</button>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="mb-3"><h2 className="font-bold text-slate-900">Escolha o modelo</h2><p className="text-xs text-slate-500">A escolha será aplicada a todas as {tags.length} artes desta impressão.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {templates.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`group relative overflow-hidden text-left p-3 rounded-2xl border-2 transition-all cursor-pointer ${template === item.id ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-100' : 'border-slate-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm'}`}>
              {template === item.id && <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white"><Check className="w-3.5 h-3.5" /></span>}
              <div className={`relative mb-3 h-16 overflow-hidden rounded-xl border border-black/5 ${item.preview}`}><div className={`absolute bottom-2 left-2 right-2 h-2 rounded-full opacity-90 ${item.accent}`} /><div className="absolute left-1/2 top-2 h-8 w-8 -translate-x-1/2 rounded-lg border-4 border-white bg-white/80 shadow-sm" /></div>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">{item.id === 'aurora-logo' && <Sparkles className="h-3.5 w-3.5 text-violet-600" />}{item.name}</div>
              <div className="text-[10px] leading-4 text-slate-500 mt-1 pr-2 min-h-8">{item.description}</div>
              <div className={`inline-flex mt-2 px-2 py-1 rounded-full text-[8px] font-black tracking-wide ${item.brandMode === 'business' ? 'bg-violet-100 text-violet-700' : item.brandMode === 'system' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{brandLabels[item.brandMode]}</div>
            </button>)}
          </div>
        </div>
      </div>
      <div className="space-y-8 print:space-y-0">{tags.map((tag, index) => <DisplayArtwork key={tag.id} tag={tag} business={tag.business_id ? businesses[tag.business_id] : undefined} template={template} last={index === tags.length - 1} />)}</div>
    </div>
  )
}
