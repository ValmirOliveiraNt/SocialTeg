import React, { useState, useEffect } from 'react'
import { Package, Check, Sparkles } from 'lucide-react'
import { Product, Plan } from '../../types'
import { api } from '../../services/api'

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  useEffect(() => {
    api.products.getAll().then(setProducts).catch(() => {})
    api.plans.getAll().then(setPlans).catch(() => {})
  }, [])

  const handleUpdateProductPrice = async (productId: string, newPrice: number) => {
    const prod = products.find((p) => p.id === productId)
    if (!prod) return
    try {
      await api.products.save({ id: productId, price: newPrice })
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p)))
      setSavedMsg(`Preço de "${prod.name}" atualizado no Cloudflare D1!`)
      setTimeout(() => setSavedMsg(null), 2500)
    } catch {}
  }

  const handleUpdatePlanPrice = async (planId: string, newPrice: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan) return
    try {
      await api.plans.update({ id: planId, price: newPrice })
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, price: newPrice } : p)))
      setSavedMsg(`Preço do plano "${plan.name}" atualizado no Cloudflare D1!`)
      setTimeout(() => setSavedMsg(null), 2500)
    } catch {}
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Gestão de Produtos, Estoque & Planos
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ajuste dinamicamente os preços de venda das Tags físicas e mensalidades dos planos SaaS.
        </p>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          <span>Produtos Físicos (Tags NFC & Stands)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-full h-40 object-cover rounded-2xl mb-4 border border-slate-200"
                />
                <h3 className="font-bold text-slate-900 text-sm mb-1">{prod.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                  {prod.description}
                </p>

                <div className="text-xs text-slate-600 space-y-1 mb-4">
                  <div><strong>Estoque disponível:</strong> {prod.stock} un.</div>
                  <div><strong>Status:</strong> {prod.status}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    defaultValue={prod.price}
                    onBlur={(e) => handleUpdateProductPrice(prod.id, Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-sm font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <span className="text-[11px] text-slate-400 italic">Salva ao sair do campo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <span>Planos de Assinatura do Software SaaS</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((pl) => (
            <div
              key={pl.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-900 text-base">{pl.name}</h3>
                  {pl.popular && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Destaque
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mb-4">{pl.description}</p>

                <div className="text-xs text-slate-600 space-y-1 mb-4">
                  <div><strong>Limite de Tags:</strong> {pl.max_tags} tags</div>
                  <div><strong>Limite de Estabelecimentos:</strong> {pl.max_businesses} locais</div>
                  <div><strong>Métricas avançadas:</strong> {pl.advanced_analytics ? 'Sim' : 'Básica'}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400">
                    Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    defaultValue={pl.price}
                    onBlur={(e) => handleUpdatePlanPrice(pl.id, Number(e.target.value))}
                    className="w-28 px-3 py-1.5 text-sm font-black text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                </div>
                <span className="text-[11px] text-slate-400 italic">Salva ao sair</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

