import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  Check,
  ArrowRight,
  ShieldCheck,
  Truck,
  Star,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Product } from '../types'
import { api } from '../services/api'
import { useCart } from '../context/CartContext'

export const StorePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const { addToCart, items, totalCount, subtotal } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    api.products.getAll().then((list) => {
      setProducts(list.filter((p) => p.status === 'active'))
    }).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-slate-200 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Loja Oficial AvaliaTag
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-1">
              Displays e Tags NFC para Balcão e Mesas
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Todos os modelos vêm com chip original NTAG213 e redirecionamento dinâmico incluso.
            </p>
          </div>

          {totalCount > 0 && (
            <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-xs border border-slate-200">
              <div>
                <div className="text-[11px] text-slate-400 font-medium">Itens no carrinho:</div>
                <div className="text-sm font-bold text-slate-900">
                  {totalCount} un. • R$ {subtotal.toFixed(2).replace('.', ',')}
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>Finalizar Pedido</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {products.map((product) => {
            const inCart = items.find((i) => i.product.id === product.id)

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs hover:shadow-lg transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>NFC + QR Code</span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg mb-2 leading-snug">
                      {product.name}
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    <div className="space-y-1.5 mb-6">
                      {product.features.slice(0, 3).map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Preço unitário
                      </span>
                      <div className="text-2xl font-black text-slate-900">
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        inCart
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{inCart ? `No Carrinho (${inCart.quantity})` : 'Adicionar'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-slate-900 text-white rounded-3xl p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Frete Rápido para Todo o Brasil</h4>
              <p className="text-xs text-slate-400 mt-0.5">Envio com código de rastreamento pelos Correios</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Garantia Vitalícia de Chip</h4>
              <p className="text-xs text-slate-400 mt-0.5">Troca ou substituição garantida em caso de defeito</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Pronta para Uso Imediato</h4>
              <p className="text-xs text-slate-400 mt-0.5">Basta abrir o pacote, ativar no painel e posicionar</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
