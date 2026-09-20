import React, { useEffect, useState } from 'react'
import { Check, ImageIcon, Package, Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { Product, Plan } from '../../types'
import { api } from '../../services/api'

type ProductDraft = {
  id?: string
  name: string
  description: string
  image: string
  price: string
  stock: string
  status: 'active' | 'inactive'
  featuresText: string
}

const emptyProduct: ProductDraft = { name: '', description: '', image: '', price: '', stock: '0', status: 'active', featuresText: '' }

const toDraft = (product: Product): ProductDraft => ({
  id: product.id, name: product.name, description: product.description || '', image: product.image || '',
  price: String(product.price), stock: String(product.stock), status: product.status,
  featuresText: (product.features || []).join('\n'),
})

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProductDraft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [brokenImages, setBrokenImages] = useState<string[]>([])

  useEffect(() => {
    api.products.getAll().then(setProducts).catch(() => {})
    api.plans.getAll().then(setPlans).catch(() => {})
  }, [])

  const announce = (message: string) => {
    setSavedMsg(message)
    window.setTimeout(() => setSavedMsg(null), 3000)
  }

  const updateDraft = <K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current)

  const handleSaveProduct = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!draft) return
    const price = Number(draft.price)
    const stock = Number(draft.stock)
    if (!draft.name.trim()) return setFormError('Informe o nome do produto.')
    if (!Number.isFinite(price) || price < 0) return setFormError('Informe um preço válido.')
    if (!Number.isInteger(stock) || stock < 0) return setFormError('Informe um estoque inteiro igual ou maior que zero.')
    setFormError(null)
    setIsSaving(true)
    try {
      const saved = await api.products.save({
        id: draft.id, name: draft.name.trim(), description: draft.description.trim(), image: draft.image.trim(), price, stock, status: draft.status,
        features: draft.featuresText.split('\n').map((item) => item.trim()).filter(Boolean),
      })
      setProducts((current) => draft.id ? current.map((product) => product.id === saved.id ? saved : product) : [...current, saved].sort((a, b) => a.price - b.price))
      setDraft(null)
      announce(draft.id ? `Produto "${saved.name}" atualizado.` : `Produto "${saved.name}" cadastrado.`)
    } catch (error: any) {
      setFormError(error?.message || 'Não foi possível salvar o produto. Tente novamente.')
    } finally { setIsSaving(false) }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!window.confirm(`Excluir "${product.name}" do catálogo? Esta ação não pode ser desfeita.`)) return
    try {
      await api.products.delete(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
      announce(`Produto "${product.name}" excluído.`)
    } catch (error: any) { announce(error?.message || 'Não foi possível excluir o produto.') }
  }

  const handleUpdatePlanPrice = async (planId: string, newPrice: number) => {
    const plan = plans.find((p) => p.id === planId)
    if (!plan || !Number.isFinite(newPrice) || newPrice < 0) return
    try {
      await api.plans.update({ id: planId, price: newPrice })
      setPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, price: newPrice } : p)))
      announce(`Preço do plano "${plan.name}" atualizado.`)
    } catch {}
  }

  return <div className="space-y-8 pb-12">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-black tracking-tight text-slate-900">Gestão de Produtos, Estoque & Planos</h1><p className="mt-1 text-xs text-slate-500">Cadastre produtos, imagens, preços, estoque e características exibidas na loja.</p></div>
      <button onClick={() => { setDraft(emptyProduct); setFormError(null) }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"><Plus className="h-4 w-4" /> Novo produto</button>
    </div>
    {savedMsg && <div role="status" className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><Check className="h-4 w-4 text-emerald-600" /><span>{savedMsg}</span></div>}
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Package className="h-5 w-5 text-purple-600" /><span>Produtos físicos</span></h2>
      {products.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center"><Package className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Nenhum produto cadastrado.</p><button onClick={() => { setDraft(emptyProduct); setFormError(null) }} className="mt-4 text-sm font-bold text-blue-600 hover:text-blue-700">Cadastrar o primeiro produto</button></div> : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {products.map((prod) => <article key={prod.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="h-40 bg-slate-100">{prod.image && !brokenImages.includes(prod.id) ? <img src={prod.image} alt={prod.name} onError={() => setBrokenImages((current) => [...current, prod.id])} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400"><ImageIcon className="h-9 w-9" /></div>}</div>
          <div className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{prod.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{prod.description || 'Sem descrição.'}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${prod.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{prod.status === 'active' ? 'Ativo' : 'Inativo'}</span></div><div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 text-xs"><div><span className="block text-slate-400">Preço</span><strong className="text-slate-900">R$ {prod.price.toFixed(2).replace('.', ',')}</strong></div><div><span className="block text-slate-400">Estoque</span><strong className="text-slate-900">{prod.stock} un.</strong></div></div><div className="mt-4 flex gap-2"><button onClick={() => { setDraft(toDraft(prod)); setFormError(null) }} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><Pencil className="h-3.5 w-3.5" /> Editar</button><button onClick={() => handleDeleteProduct(prod)} aria-label={`Excluir ${prod.name}`} className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></button></div></div>
        </article>)}
      </div>}
    </div>
    <div className="space-y-4 border-t border-slate-200 pt-4"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Sparkles className="h-5 w-5 text-amber-500" /><span>Planos de assinatura</span></h2><div className="grid grid-cols-1 gap-6 md:grid-cols-3">{plans.map((pl) => <div key={pl.id} className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div><div className="mb-2 flex items-center justify-between"><h3 className="text-base font-bold text-slate-900">{pl.name}</h3>{pl.popular && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Destaque</span>}</div><p className="mb-4 text-xs text-slate-500">{pl.description}</p><div className="mb-4 space-y-1 text-xs text-slate-600"><div><strong>Tags:</strong> {pl.max_tags}</div><div><strong>Estabelecimentos:</strong> {pl.max_businesses}</div></div></div><div className="flex items-center justify-between border-t border-slate-100 pt-4"><div><label className="block text-[10px] font-bold uppercase text-slate-400">Mensalidade (R$)</label><input type="number" min="0" step="0.10" defaultValue={pl.price} onBlur={(e) => handleUpdatePlanPrice(pl.id, Number(e.target.value))} className="w-28 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm font-black text-slate-900 focus:bg-white focus:outline-none" /></div><span className="text-[11px] italic text-slate-400">Salva ao sair</span></div></div>)}</div></div>
    {draft && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="product-dialog-title"><form onSubmit={handleSaveProduct} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-6 flex items-start justify-between gap-4"><div><h2 id="product-dialog-title" className="text-xl font-black text-slate-900">{draft.id ? 'Editar produto' : 'Novo produto'}</h2><p className="mt-1 text-xs text-slate-500">As alterações aparecem na loja assim que forem salvas.</p></div><button type="button" onClick={() => setDraft(null)} aria-label="Fechar" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>{formError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{formError}</p>}<div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-bold text-slate-700">Nome do produto<input required value={draft.name} onChange={(e) => updateDraft('name', e.target.value)} maxLength={120} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="sm:col-span-2 text-sm font-bold text-slate-700">Descrição<textarea value={draft.description} onChange={(e) => updateDraft('description', e.target.value)} maxLength={2000} rows={3} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="sm:col-span-2 text-sm font-bold text-slate-700">URL da imagem<input type="url" value={draft.image} onChange={(e) => updateDraft('image', e.target.value)} placeholder="https://..." className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>{draft.image && <img src={draft.image} alt="Prévia do produto" onError={(e) => { e.currentTarget.style.display = 'none' }} className="sm:col-span-2 h-36 w-full rounded-2xl border border-slate-200 object-cover" />}<label className="text-sm font-bold text-slate-700">Preço (R$)<input required type="number" min="0" step="0.01" value={draft.price} onChange={(e) => updateDraft('price', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="text-sm font-bold text-slate-700">Estoque<input required type="number" min="0" step="1" value={draft.stock} onChange={(e) => updateDraft('stock', e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label><label className="text-sm font-bold text-slate-700">Status<select value={draft.status} onChange={(e) => updateDraft('status', e.target.value as ProductDraft['status'])} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="active">Ativo</option><option value="inactive">Inativo</option></select></label><label className="sm:col-span-2 text-sm font-bold text-slate-700">Características <span className="font-normal text-slate-400">(uma por linha)</span><textarea value={draft.featuresText} onChange={(e) => updateDraft('featuresText', e.target.value)} maxLength={2400} rows={4} placeholder={'NFC programável\nMaterial resistente\nPronta para ativação'} className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label></div><div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end"><button type="button" onClick={() => setDraft(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Cancelar</button><button disabled={isSaving} type="submit" className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{isSaving ? 'Salvando...' : 'Salvar produto'}</button></div></form></div>}
  </div>
}
