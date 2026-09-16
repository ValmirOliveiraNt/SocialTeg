import React, { useRef, useState } from 'react'
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react'
import {
  X,
  Copy,
  Check,
  Download,
  Printer,
  ExternalLink,
  Smartphone,
  Radio,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { NFCTag } from '../types'
import { NFCWriterModal } from './NFCWriterModal'
import { getPublicTagUrl } from '../utils/url'

interface QRCodeModalProps {
  tag: NFCTag
  onClose: () => void
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ tag, onClose }) => {
  const [copied, setCopied] = useState(false)
  const [writerOpen, setWriterOpen] = useState(false)
  const qrCanvasRef = useRef<HTMLDivElement>(null)

  const publicUrl = getPublicTagUrl(tag.public_id)
  const qrUrl = `${publicUrl}?src=qr`

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadPNG = () => {
    const canvas = qrCanvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `qrcode-${tag.public_id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Radio className="w-3.5 h-3.5" />
            NFC & QR Code Dinâmico
          </div>
          <h3 className="text-xl font-bold text-slate-900">{tag.name}</h3>
          <p className="text-xs text-slate-500 mt-1">
            Serial: <span className="font-mono font-bold text-slate-700">{tag.serial_number}</span>
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 mb-3">
            <QRCodeSVG
              value={qrUrl}
              size={180}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png',
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          </div>

          <div className="hidden" ref={qrCanvasRef}>
            <QRCodeCanvas
              value={qrUrl}
              size={1024}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="text-[11px] text-slate-500 text-center flex items-center gap-1.5 mt-1">
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            Aproxime o celular ou aponte a câmera para o QR Code
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setWriterOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Gravar Chip NFC Físico</span>
          </button>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDownloadPNG}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" />
              Baixar PNG
            </button>

            <Link
              to={`/print-stand/${tag.id}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              Imprimir Display
            </Link>
          </div>

          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full inline-flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
          >
            <span>Testar redirecionamento em nova aba</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {writerOpen && (
        <NFCWriterModal tag={tag} onClose={() => setWriterOpen(false)} />
      )}
    </div>
  )
}
