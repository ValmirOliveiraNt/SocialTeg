import React, { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Radio, Smartphone, X } from 'lucide-react'
import { NFCTag } from '../types'
import { api } from '../services/api'

function publicIdFromNdef(event: any): string | null {
  const urlRecord = event.message?.records?.find((record: any) => record.recordType === 'url')
  if (!urlRecord?.data) return null
  try {
    const value = new TextDecoder().decode(urlRecord.data)
    const path = new URL(value).pathname.match(/^\/t\/([^/]+)$/)
    return path ? decodeURIComponent(path[1]) : null
  } catch {
    return null
  }
}

export const NFCInventoryReaderModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [state, setState] = useState<'idle' | 'reading' | 'found' | 'error'>('idle')
  const [tag, setTag] = useState<NFCTag | null>(null)
  const [message, setMessage] = useState('')
  const controller = useRef<AbortController | null>(null)
  const supported = typeof window !== 'undefined' && 'NDEFReader' in window

  const stop = () => controller.current?.abort()
  const start = async () => {
    if (!supported) {
      setState('error')
      setMessage('Use o Google Chrome em um celular Android com NFC ativado para ler a tag no estoque.')
      return
    }
    try {
      stop()
      controller.current = new AbortController()
      setTag(null)
      setMessage('')
      setState('reading')
      const reader = new (window as any).NDEFReader()
      reader.onreadingerror = () => {
        setState('error')
        setMessage('Não foi possível ler o conteúdo NDEF desta tag. Verifique se ela foi gravada pelo AvaliaTag.')
      }
      reader.onreading = async (event: any) => {
        stop()
        const publicId = publicIdFromNdef(event)
        if (!publicId) {
          setState('error')
          setMessage('A tag lida não contém um link válido do AvaliaTag.')
          return
        }
        try {
          const result = await api.tags.identifyByPublicId(publicId)
          if (!result?.serial_number) throw new Error('Tag não cadastrada no estoque.')
          setTag(result)
          setState('found')
        } catch (error: any) {
          setState('error')
          setMessage(error?.message || 'Esta tag não pertence ao estoque ou não está disponível para sua conta.')
        }
      }
      await reader.scan({ signal: controller.current.signal })
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        setState('error')
        setMessage(error?.name === 'NotAllowedError' ? 'Autorize o uso de NFC no navegador para continuar.' : error?.message || 'Não foi possível iniciar a leitura NFC.')
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl relative">
        <button onClick={() => { stop(); onClose() }} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
        <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center"><Radio className="w-6 h-6" /></div><div><h3 className="font-black text-slate-900">Identificar tag no estoque</h3><p className="text-xs text-slate-500">Leia a tag física para localizar seu serial cadastrado.</p></div></div>
        {state === 'idle' && <button onClick={start} className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center justify-center gap-2"><Smartphone className="w-5 h-5" />Ler tag NFC</button>}
        {state === 'reading' && <div className="py-7 text-center"><Radio className="w-12 h-12 mx-auto text-purple-600 animate-pulse mb-3" /><p className="font-bold text-slate-900">Aproxime a tag do celular</p><p className="text-xs text-slate-500 mt-1">A leitura será associada ao serial registrado no estoque.</p><button onClick={() => { stop(); setState('idle') }} className="mt-5 text-xs font-bold text-slate-500">Cancelar</button></div>}
        {state === 'found' && tag && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 text-emerald-800"><CheckCircle2 className="w-5 h-5" /><strong>Tag identificada</strong></div><p className="mt-4 text-[10px] uppercase font-bold tracking-wider text-emerald-700">Serial cadastrado</p><p className="font-mono text-lg font-black text-slate-900 mt-1">{tag.serial_number}</p><p className="text-xs text-slate-600 mt-3">{tag.name} · {tag.status}</p><button onClick={start} className="mt-5 w-full py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold">Ler outra tag</button></div>}
        {state === 'error' && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900"><div className="flex gap-2"><AlertCircle className="w-5 h-5 shrink-0" /><p className="text-xs leading-relaxed">{message}</p></div><button onClick={start} className="mt-4 w-full py-2.5 rounded-xl bg-amber-700 text-white text-xs font-bold">Tentar novamente</button></div>}
      </div>
    </div>
  )
}
