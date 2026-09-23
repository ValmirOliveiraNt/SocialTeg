import React, { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, ArrowLeft, Star, Smartphone, Radio, Check } from 'lucide-react'
import { NFCTag, Business } from '../types'
import { api } from '../services/api'
import { GoogleIcon } from '../components/GoogleIcon'
import { getPublicTagUrl } from '../utils/url'

type PrintTemplate = 'classic-logo' | 'navy-logo' | 'clean' | 'impact'
const templates: Array<{ id: PrintTemplate; name: string; description: string; branded: boolean }> = [
  { id: 'classic-logo', name: 'Clássico Personalizado', description: 'Logo do estabelecimento em destaque e AvaliaTag no rodapé', branded: true },
  { id: 'navy-logo', name: 'Azul Premium Personalizado', description: 'Logo do estabelecimento em destaque e AvaliaTag no rodapé', branded: true },
  { id: 'clean', name: 'Essencial', description: 'Visual neutro sem logomarca', branded: false },
  { id: 'impact', name: 'Alto Impacto', description: 'Chamada forte sem logomarca', branded: false },
]

const DisplayArtwork: React.FC<{ tag: NFCTag; business?: Business; template: PrintTemplate; last: boolean }> = ({ tag, business, template, last }) => {
  const qrUrl = `${getPublicTagUrl(tag.public_id)}?src=qr`
  const navy = template === 'navy-logo'
  const impact = template === 'impact'
  const branded = template === 'classic-logo' || navy
  const [failedLogo, setFailedLogo] = useState<string | null>(null)
  const businessLogo = business?.logo_url?.trim() || ''
  const hasBusinessLogo = Boolean(businessLogo && failedLogo !== businessLogo)
  const shell = navy ? 'bg-[#0B1F3B] text-white border-[#006CFF]' : impact ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-slate-900 border-slate-300'
  return (
    <article className={`w-full max-w-md mx-auto rounded-3xl shadow-xl p-7 border-2 text-center relative print:shadow-none print:rounded-none print:max-w-none print:w-[180mm] print:min-h-[260mm] print:flex print:flex-col print:justify-center ${shell}`} style={{ breakAfter: last ? 'auto' : 'page', pageBreakAfter: last ? 'auto' : 'always' }}>
      {branded && (hasBusinessLogo ? (
        <div className={`mx-auto mb-5 flex h-20 min-w-36 max-w-[260px] items-center justify-center rounded-2xl border px-5 py-3 shadow-lg ${navy ? 'border-white/20 bg-white' : 'border-slate-200 bg-white'}`}>
          <img
            src={businessLogo}
            alt={`Logo de ${business?.name || tag.name}`}
            onError={() => setFailedLogo(businessLogo)}
            className="max-h-14 max-w-full object-contain"
          />
        </div>
      ) : (
        <img src={navy ? '/brand/logo-horizontal-white-1200.png' : '/brand/logo-horizontal-color-600.png'} alt="AvaliaTag" className="h-10 sm:h-12 w-auto mx-auto object-contain mb-5" />
      ))}
      <div className={`inline-flex mx-auto items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${navy ? 'bg-white/10 text-blue-100' : impact ? 'bg-white/15 text-white' : 'bg-blue-50 text-blue-700'}`}><GoogleIcon className="w-5 h-5" /><span>Avalie sua experiência no Google</span></div>
      <div className="flex justify-center gap-1.5 my-4">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className="w-7 h-7 fill-amber-400 text-amber-400" />)}</div>
      <h1 className="text-2xl font-black mb-1 leading-tight">{business?.name || tag.name}</h1>
      <p className={`text-sm font-medium mb-5 ${navy || impact ? 'text-blue-100' : 'text-slate-600'}`}>{impact ? 'Gostou do atendimento? Conte para todo mundo!' : 'Sua opinião é fundamental para nossa equipe.'}</p>
      <div className={`rounded-2xl p-5 mb-5 inline-block mx-auto ${navy || impact ? 'bg-white' : 'bg-slate-50 border-2 border-slate-200'}`}>
        <QRCodeSVG value={qrUrl} size={205} level="H" includeMargin={false} imageSettings={{ src: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png', x: undefined, y: undefined, height: 40, width: 40, excavate: true }} />
      </div>
      <div className={`rounded-2xl p-4 text-xs font-semibold flex flex-col gap-2 ${navy ? 'bg-white/10 border border-white/15' : impact ? 'bg-blue-800/50 border border-white/15' : 'bg-blue-50 border border-blue-200/80 text-blue-950'}`}>
        <div className="flex items-center justify-center gap-2"><Radio className="w-4 h-4" /><span>Aproxime o celular da Tag NFC</span></div>
        <div className="flex items-center justify-center gap-2"><Smartphone className="w-4 h-4" /><span>Ou aponte a câmera para o QR Code</span></div>
      </div>
      <div className={`mt-5 pt-3 border-t flex items-center ${branded ? 'justify-between' : 'justify-center'} gap-4 text-[10px] ${navy || impact ? 'border-white/15 text-blue-100' : 'border-slate-200 text-slate-400'}`}>
        <span className="font-mono">ID: {tag.public_id}</span>
        {branded && (hasBusinessLogo ? (
          <div className="flex items-center gap-2">
            <span className="font-medium opacity-80">Tecnologia</span>
            <img
              src={navy ? '/brand/logo-horizontal-white-1200.png' : '/brand/logo-horizontal-color-600.png'}
              alt="AvaliaTag"
              className="h-5 w-auto max-w-28 object-contain"
            />
          </div>
        ) : (
          <span className="font-semibold">Aproximou. Avaliou. Cresceu.</span>
        ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {templates.map((item) => <button key={item.id} type="button" onClick={() => setTemplate(item.id)} className={`relative text-left p-3 rounded-xl border-2 transition cursor-pointer ${template === item.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>{template === item.id && <Check className="absolute top-2 right-2 w-4 h-4 text-blue-600" />}<div className="font-bold text-xs text-slate-900">{item.name}</div><div className="text-[10px] text-slate-500 mt-1 pr-4">{item.description}</div><div className={`inline-flex mt-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${item.branded ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{item.branded ? 'COM LOGO' : 'SEM LOGO'}</div></button>)}
          </div>
        </div>
      </div>
      <div className="space-y-8 print:space-y-0">{tags.map((tag, index) => <DisplayArtwork key={tag.id} tag={tag} business={tag.business_id ? businesses[tag.business_id] : undefined} template={template} last={index === tags.length - 1} />)}</div>
    </div>
  )
}
