import React, { useState } from 'react'
import { AlertCircle, CheckCircle2, Radio, SkipForward, Smartphone, X } from 'lucide-react'
import { NFCTag } from '../types'
import { getPublicTagUrl } from '../utils/url'

export const BatchNFCWriterModal: React.FC<{ tags: NFCTag[]; onClose: () => void }> = ({ tags, onClose }) => {
  const [index, setIndex] = useState(0)
  const [completed, setCompleted] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'writing' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const tag = tags[index]
  const supported = typeof window !== 'undefined' && 'NDEFReader' in window

  const next = () => {
    if (index + 1 >= tags.length) return onClose()
    setIndex((value) => value + 1)
    setStatus('idle')
    setMessage('')
  }

  const writeCurrent = async () => {
    if (!supported) {
      setStatus('error')
      setMessage('Use o Google Chrome em um celular Android com NFC ativado para a gravação em lote.')
      return
    }
    try {
      setStatus('writing')
      const ndef = new (window as any).NDEFReader()
      await ndef.write({ records: [{ recordType: 'url', data: `${getPublicTagUrl(tag.public_id)}?src=nfc` }] })
      setCompleted((items) => [...items, tag.id])
      setStatus('success')
    } catch (error: any) {
      setStatus('error')
      setMessage(error?.name === 'NotAllowedError' ? 'Permissão NFC negada. Autorize o acesso e tente novamente.' : error?.message || 'Não foi possível gravar esta tag.')
    }
  }

  if (!tag) return null
  return <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 relative">
      <button onClick={onClose} className="absolute right-4 top-4 p-2 text-slate-400 hover:bg-slate-100 rounded-xl cursor-pointer"><X className="w-5 h-5" /></button>
      <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><Radio className="w-6 h-6" /></div><div><h3 className="font-black text-slate-900">Gravação NFC em lote</h3><p className="text-xs text-slate-500">{completed.length} concluídas de {tags.length}</p></div></div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden mb-5"><div className="h-full bg-blue-600 transition-all" style={{ width: `${(completed.length / tags.length) * 100}%` }} /></div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tag {index + 1} de {tags.length}</p>
        <p className="font-black text-slate-900 mt-1">{tag.name}</p><p className="font-mono text-xs text-slate-500">{tag.serial_number}</p>
        {status === 'writing' && <p className="mt-4 text-sm font-bold text-blue-600 animate-pulse">Aproxime esta tag do celular…</p>}
        {status === 'success' && <p className="mt-4 text-sm font-bold text-emerald-700 flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" />Gravada com sucesso</p>}
        {status === 'error' && <p className="mt-4 text-xs text-amber-800 flex items-start justify-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{message}</p>}
      </div>
      <div className="flex gap-2 mt-5">
        {status === 'success' ? <button onClick={next} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">{index + 1 === tags.length ? 'Concluir lote' : 'Próxima tag'}</button> : <button onClick={writeCurrent} disabled={status === 'writing'} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"><Smartphone className="w-4 h-4" />{status === 'error' ? 'Tentar novamente' : 'Gravar esta tag'}</button>}
        {status !== 'success' && <button onClick={next} className="px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 cursor-pointer"><SkipForward className="w-4 h-4" />Pular</button>}
      </div>
    </div>
  </div>
}
