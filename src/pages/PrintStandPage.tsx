import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Printer, ArrowLeft, Star, Smartphone, Radio } from 'lucide-react'
import { NFCTag, Business } from '../types'
import { api } from '../services/api'
import { GoogleIcon } from '../components/GoogleIcon'
import { getPublicTagUrl } from '../utils/url'

export const PrintStandPage: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>()
  const [tag, setTag] = useState<NFCTag | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)

  useEffect(() => {
    if (!tagId) return
    api.tags.getById(tagId).then(async (foundTag) => {
      if (foundTag) {
        setTag(foundTag)
        if (foundTag.business_id) {
          const foundBiz = await api.businesses.getById(foundTag.business_id)
          setBusiness(foundBiz || null)
        }
      }
    }).catch(() => {})
  }, [tagId])

  if (!tag) {
    return (
      <div className="p-8 text-center text-slate-600">
        Tag não encontrada. <Link to="/dashboard/tags" className="text-blue-600 underline">Voltar</Link>
      </div>
    )
  }

  const publicUrl = getPublicTagUrl(tag.public_id)

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      <div className="max-w-xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          to="/dashboard/tags"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Tags
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir Display de Balcão (A4)
        </button>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 border-2 border-slate-300 text-center relative print:shadow-none print:border print:border-dashed print:border-slate-400 print:rounded-none">
        <div className="flex justify-center items-center gap-2 mb-4">
          <GoogleIcon className="w-7 h-7" />
          <span className="font-bold text-lg text-slate-800 tracking-tight">Avaliações do Google</span>
        </div>

        <div className="flex justify-center gap-1.5 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className="w-7 h-7 fill-amber-400 text-amber-400" />
          ))}
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-1 leading-tight">
          {business?.name || tag.name}
        </h1>
        <p className="text-sm text-slate-600 font-medium mb-6">
          Sua opinião é fundamental para nossa equipe!
        </p>

        <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 mb-6 inline-block">
          <QRCodeSVG
            value={publicUrl}
            size={220}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
              x: undefined,
              y: undefined,
              height: 42,
              width: 42,
              excavate: true,
            }}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-950 font-semibold mb-6 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <span>1. Aproxime o celular da Tag NFC</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>2. Ou aponte a câmera para o QR Code</span>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-mono text-slate-400">ID: {tag.public_id}</span>
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <img src="/logo.png" alt="SocialTag" className="h-4 w-auto object-contain" />
            <span>SocialTag NFC Inteligente</span>
          </div>
        </div>
      </div>
    </div>
  )
}
