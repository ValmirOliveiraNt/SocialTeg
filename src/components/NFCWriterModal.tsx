import React, { useState } from 'react'
import {
  X,
  Radio,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  Info,
  Apple,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { NFCTag } from '../types'
import { getPublicTagUrl } from '../utils/url'

interface NFCWriterModalProps {
  tag: NFCTag
  onClose: () => void
}

export const NFCWriterModal: React.FC<NFCWriterModalProps> = ({ tag, onClose }) => {
  const [activeTab, setActiveTab] = useState<'write' | 'ios-tips'>('write')
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const publicUrl = getPublicTagUrl(tag.public_id)
  const isWebNfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window

  const handleStartWriting = async () => {
    if (!isWebNfcSupported) {
      setStatus('error')
      setErrorMessage(
        'A gravação direta pelo navegador está disponível no Google Chrome para Android. Abra esta página no celular Android do estabelecimento para gravar as Tags com compatibilidade total para iPhones.'
      )
      return
    }

    try {
      setStatus('scanning')
      setErrorMessage(null)

      const ndef = new (window as any).NDEFReader()

      await ndef.write({
        records: [
          {
            recordType: 'url',
            data: publicUrl,
          },
        ],
      })

      setStatus('success')
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      })
    } catch (err: any) {
      setStatus('error')
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Permissão para uso de NFC foi negada pelo usuário. Verifique as configurações do Chrome.')
      } else if (err.name === 'NotSupportedError') {
        setErrorMessage('Este chip não aceita gravação NDEF pelo navegador. Tente formatar como NDEF primeiro usando um app dedicado.')
      } else {
        setErrorMessage(err.message || 'Falha ao gravar no chip NFC. Tente aproximar novamente.')
      }
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Gravar Chip NFC Físico</h3>
            <p className="text-xs text-slate-500">
              Serial: <span className="font-mono font-bold text-slate-800">{tag.serial_number}</span>
            </p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl mb-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('write')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'write' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Gravação da Tag
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios-tips')}
            className={`flex-1 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'ios-tips' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>Regras para iPhone (iOS)</span>
          </button>
        </div>

        {activeTab === 'write' ? (
          <>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  URL Segura Permanente (Compatível com iOS e Android)
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded">
                  HTTPS Obrigatório
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-200 rounded-xl text-slate-700"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                Esta URL é protegida por SSL e redireciona dinamicamente na nuvem para a ação configurada.
              </p>
            </div>

            {status === 'idle' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Gravação em 1 clique (Android Chrome):</strong>
                    <p className="mt-0.5 text-[11px] text-blue-800">
                      Clique no botão abaixo e encoste a Tag virgem na traseira do celular para gravar instantaneamente.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartWriting}
                  className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-5 h-5" />
                  <span>Gravar Tag Agora (Web NFC)</span>
                </button>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-2">
                  <span className="font-bold text-slate-800 block text-[11px] uppercase">
                    Ou grave pelo app gratuito NFC Tools (iPhone e Android):
                  </span>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500">
                    <li>Copie o link HTTPS acima clicando em <strong>Copiar</strong>.</li>
                    <li>Abra o app <strong>NFC Tools</strong>.</li>
                    <li>Toque em <strong>Escrever (Write)</strong> → <strong>Adicionar um registro</strong> → <strong>URL / URI</strong>.</li>
                    <li>Cole o link HTTPS e toque em <strong>Escrever</strong>.</li>
                    <li>Encoste a Tag no celular até confirmar o sucesso.</li>
                  </ol>
                </div>
              </div>
            )}

            {status === 'scanning' && (
              <div className="text-center py-6 space-y-4 animate-in fade-in">
                <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto animate-ping">
                  <Radio className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Aproxime a Tag NFC agora</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    Encoste a Tag virgem na parte superior traseira do celular até vibrar.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="text-xs text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center py-4 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">Tag Gravada com Sucesso!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                    O chip físico foi programado com a URL segura oficial e agora responde em iPhones e Androids.
                  </p>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('idle')}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Gravar Outra
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Instrução:</strong>
                    <p className="mt-1 text-[11px] leading-relaxed">{errorMessage}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Voltar
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 text-xs animate-in fade-in">
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-blue-300">
                <Apple className="w-4 h-4" />
                <span>Por que o iPhone às vezes não lê uma Tag virgem?</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Diferente do Android, a Apple impõe 4 regras de segurança rigorosas para a leitura automática em segundo plano (Background Tag Reading):
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">O link gravado deve ser HTTPS</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    O iOS bloqueia completamente links sem SSL (<code>http://</code> ou <code>localhost</code>). O link do AvaliaTag (<code>https://avaliatag.pages.dev/t/...</code>) cumpre essa exigência 100%.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Posição da Antena: Topo do iPhone</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    No iPhone, a antena fica na <strong>borda superior</strong> (ao lado das câmeras traseiras). Encoste o <strong>topo do aparelho</strong> na tag, e não o meio ou o centro.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Tela deve estar Acesa (Ligada)</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Para economizar bateria, o iPhone desliga o leitor de NFC quando a tela está preta/apagada. Basta dar um toque na tela para acendê-la.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-900 block text-xs">Formatar como NDEF (se o chip for virgem)</strong>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tags compradas de fábrica às vezes vêm sem o bloco de capacidade NFC Forum Type 2. No app <strong>NFC Tools</strong>, vá na aba <strong>Outros</strong> → <strong>Formatar como NDEF</strong> antes de escrever a URL.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Voltar para Gravação
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
