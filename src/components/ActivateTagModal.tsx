import React, { useState } from 'react'
import { X, Sparkles, CheckCircle2, AlertCircle, Building2, Link as LinkIcon, Radio } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Business, NFCTag } from '../types'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { SavingIndicator } from './SavingIndicator'

interface ActivateTagModalProps {
  businesses: Business[]
  onSuccess: (tag: NFCTag) => void
  onClose: () => void
}

export const ActivateTagModal: React.FC<ActivateTagModalProps> = ({
  businesses,
  onSuccess,
  onClose,
}) => {
  const { currentUser } = useAuth()
  const [step, setStep] = useState<1 | 2>(1)
  const [serialCode, setSerialCode] = useState('')
  const [matchedTag, setMatchedTag] = useState<NFCTag | null>(null)
  const [selectedBusinessId, setSelectedBusinessId] = useState(businesses[0]?.id || '')
  const [tagName, setTagName] = useState('')
  const [locationName, setLocationName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!serialCode.trim()) {
      setError('Por favor, informe o código serial da Tag impresso no produto ou embalagem.')
      return
    }

    setLoading(true)

    try {
      const tag = await api.tags.getBySerial(serialCode.trim())

      if (!tag) {
        setError('Código serial não encontrado. Verifique o código gravado na sua Tag NFC.')
        setLoading(false)
        return
      }

      if (tag.owner_id && tag.owner_id !== currentUser?.id) {
        setError('Esta Tag NFC já pertence a outro usuário e não pode ser transferida diretamente.')
        setLoading(false)
        return
      }

      if (tag.status === 'blocked' || tag.status === 'lost') {
        setError('Esta Tag NFC está marcada como bloqueada no sistema. Contate o suporte.')
        setLoading(false)
        return
      }

      setMatchedTag(tag)
      setTagName(tag.name || `Tag ${tag.serial_number}`)
      setLocationName(tag.location || 'Balcão de Atendimento')
      setStep(2)
    } catch (err: any) {
      setError(err.message || 'Erro ao consultar tag no servidor')
    } finally {
      setLoading(false)
    }
  }

  const handleFinishActivation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!matchedTag || !currentUser) return

    if (!selectedBusinessId) {
      setError('Por favor, selecione um estabelecimento para vincular esta Tag.')
      return
    }

    if (!targetUrl.trim().startsWith('http')) {
      setError('A URL de destino deve começar com https://')
      return
    }

    setLoading(true)

    try {
      const updatedTag: Partial<NFCTag> = {
        id: matchedTag.id,
        owner_id: currentUser.id,
        business_id: selectedBusinessId,
        name: tagName.trim() || matchedTag.name,
        location: locationName.trim() || 'Balcão',
        status: 'active',
        activated_at: new Date().toISOString(),
      }

      const activated = await api.tags.save(updatedTag)

      await api.destinations.save({
        tag_id: activated.id,
        type: 'google_review',
        title: 'Google Avaliações',
        target_url: targetUrl.trim(),
        configuration: {
          direct_redirect: false,
          welcome_title: 'Sua avaliação no Google é muito importante!',
          welcome_message: 'Leva menos de 30 segundos e nos ajuda a melhorar sempre.',
          star_rating_incentive: true,
          primary_color: '#ea580c',
        },
      })

      await api.logs.add({
        user_id: currentUser.id,
        user_email: currentUser.email,
        action: 'ACTIVATE_TAG',
        entity_type: 'nfc_tag',
        entity_id: activated.id,
        details: `Tag serial ${activated.serial_number} ativada pelo usuário para o estabelecimento ${selectedBusinessId}.`,
      })

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      })

      onSuccess(activated)
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar a Tag')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Ativar Nova Tag NFC</h3>
            <p className="text-xs text-slate-500">
              Passo {step} de 2 • {step === 1 ? 'Validação do Código' : 'Vínculo e Destino'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 leading-relaxed">
              Digite o código ou serial de ativação gravado no seu produto físico ou na nota de envio.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Código Serial da Tag NFC
              </label>
              <input
                type="text"
                required
                value={serialCode}
                onChange={(e) => setSerialCode(e.target.value.toUpperCase())}
                placeholder="Ex: TAG-BR-8821"
                className="w-full px-4 py-2.5 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <SavingIndicator label="Consultando Tag..." />
                ) : (
                  <>
                    <span>Validar Tag</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 2 && matchedTag && (
          <form onSubmit={handleFinishActivation} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tag identificada: <strong>{matchedTag.serial_number}</strong></span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Pronta para Ativação
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                Estabelecimento
              </label>
              <div className="relative">
                <select
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city} - {b.state})
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Nome da Tag
                </label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Ex: Tag Balcão"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                  Localização Física
                </label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Próximo ao Caixa"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                URL Oficial do Google Avaliações
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cole o link de avaliação que você obtém no perfil da sua empresa no Google. Você pode alterar quando quiser!
              </p>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Voltar
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <SavingIndicator label="Ativando Tag..." />
                  ) : (
                    'Concluir Ativação'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

