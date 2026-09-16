import React, { useState, useEffect } from 'react'
import { CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Plan } from '../../types'
import { api } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

export const CustomerPlansPage: React.FC = () => {
  const { currentUser, updateProfile } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [currentPlanId, setCurrentPlanId] = useState(currentUser?.plan_id || 'plan-pro')
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    api.plans.getAll().then((list) => {
      setPlans(list.filter((p) => p.status === 'active'))
    }).catch(() => {})
  }, [])

  const handleSelectPlan = async (plan: Plan) => {
    setCurrentPlanId(plan.id)
    updateProfile({ plan_id: plan.id })

    await api.logs.add({
      user_id: currentUser?.id,
      user_email: currentUser?.email,
      action: 'UPGRADE_PLAN',
      entity_type: 'subscription',
      entity_id: plan.id,
      details: `Plano atualizado para: ${plan.name}`,
    })

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    })

    setMsg(`Plano ${plan.name} ativado com sucesso!`)
    setTimeout(() => setMsg(null), 3000)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Meu Plano & Assinatura
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie os limites de Tags, filiais cadastradas e recursos da sua conta.
        </p>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlanId

          return (
            <div
              key={p.id}
              className={`bg-white rounded-3xl p-6 border flex flex-col justify-between relative transition ${
                isCurrent
                  ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md'
                  : 'border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider py-0.5 px-3 rounded-full shadow-2xs">
                  Plano Atual
                </span>
              )}

              <div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{p.name}</h3>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed min-h-[32px]">
                  {p.description}
                </p>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">
                    {p.price === 0 ? 'Grátis' : `R$ ${p.price.toFixed(2).replace('.', ',')}`}
                  </span>
                  {p.price > 0 && <span className="text-xs text-slate-400 font-medium">/mês</span>}
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs">
                  {p.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isCurrent}
                  onClick={() => handleSelectPlan(p)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-default ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  <span>{isCurrent ? 'Plano Ativo' : 'Mudar para este Plano'}</span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Garantia e Cancelamento Fácil</div>
            <div className="text-[11px] text-slate-500">
              Você pode alterar ou cancelar seu plano a qualquer momento sem fidelidade ou taxas de cancelamento.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
