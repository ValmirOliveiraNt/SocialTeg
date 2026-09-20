import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  MapPin,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { PaymentGatewayService, ShippingAddress } from '../services/payment'

export const CheckoutPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, subtotal, totalCount, clearCart } = useCart()
  const { currentUser, register, login } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [authMode, setAuthMode] = useState<'register' | 'login'>('register')
  const [userName, setUserName] = useState(currentUser?.name || '')
  const [userEmail, setUserEmail] = useState(currentUser?.email || '')
  const [userPhone, setUserPhone] = useState(currentUser?.phone || '')

  const [address, setAddress] = useState<ShippingAddress>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip: '',
  })

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix')
  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [installments, setInstallments] = useState(1)

  const shipping = PaymentGatewayService.calculateShipping(address.zip, totalCount)
  const pixDiscount = paymentMethod === 'pix' ? subtotal * 0.05 : 0
  const finalTotal = Math.max(0, subtotal - pixDiscount + shipping)

  const handleAuthNext = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentUser) {
      if (authMode === 'register') {
        if (!userName.trim() || !userEmail.trim()) {
          setError('Informe seu nome e e-mail para prosseguir.')
          return
        }
        const user = await register(userName.trim(), userEmail.trim(), userPhone.trim())
        if (!user) {
          setError('Erro ao cadastrar. E-mail já cadastrado.')
          return
        }
      } else {
        const ok = await login(userEmail.trim())
        if (!ok) {
          setError('Usuário não encontrado com este e-mail.')
          return
        }
      }
    }
    setStep(2)
  }

  const handleAddressNext = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!address.street || !address.number || !address.city || !address.state || !address.zip) {
      setError('Preencha todos os campos obrigatórios do endereço.')
      return
    }
    setStep(3)
  }

  const handleFinishPayment = async () => {
    if (!currentUser) return
    setError(null)
    setLoading(true)

    try {
      const result = await PaymentGatewayService.processCheckout(
        currentUser.id,
        items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        address,
        {
          method: paymentMethod,
          cardDetails:
            paymentMethod === 'credit_card'
              ? {
                  holderName: cardHolder,
                  cardNumber,
                  expiry: cardExpiry,
                  cvv: cardCvv,
                  installments,
                }
              : undefined,
        }
      )

      clearCart()
      navigate(`/order-success/${result.orderId}`)
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o pagamento')
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md w-full mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Seu carrinho está vazio</h2>
          <p className="text-xs text-slate-500 mb-6">
            Adicione Tags NFC ou Displays de balcão para iniciar o processo de compra.
          </p>
          <Link
            to="/loja"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <span>Ir para a Loja</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Checkout de Tags NFC</h1>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className={step >= 1 ? 'font-bold text-blue-600' : ''}>1. Identificação</span>
            <span>→</span>
            <span className={step >= 2 ? 'font-bold text-blue-600' : ''}>2. Endereço de Entrega</span>
            <span>→</span>
            <span className={step >= 3 ? 'font-bold text-blue-600' : ''}>3. Pagamento</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            {step === 1 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">
                      {currentUser ? 'Confirmar Identificação' : 'Dados do Comprador'}
                    </h2>
                  </div>
                  {!currentUser && (
                    <div className="flex gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setAuthMode('register')}
                        className={`px-3 py-1 rounded-lg font-semibold ${
                          authMode === 'register'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Novo Cadastro
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className={`px-3 py-1 rounded-lg font-semibold ${
                          authMode === 'login'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Já sou Cliente
                      </button>
                    </div>
                  )}
                </div>

                {currentUser ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                        <div className="text-xs text-slate-500">{currentUser.email}</div>
                        <div className="text-xs text-slate-500">{currentUser.phone}</div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        Conectado
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continuar para Endereço</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAuthNext} className="space-y-4">
                    {authMode === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                          Nome Completo / Razão Social
                        </label>
                        <input
                          type="text"
                          required
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Ex: Carlos Eduardo ou Café das Flores Ltda"
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                        E-mail de Acesso
                      </label>
                      <input
                        type="email"
                        required
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="contato@empresa.com.br"
                        className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    {authMode === 'register' && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase">
                          Telefone / WhatsApp
                        </label>
                        <input
                          type="tel"
                          required
                          value={userPhone}
                          onChange={(e) => setUserPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>{authMode === 'register' ? 'Criar Conta e Prosseguir' : 'Entrar e Prosseguir'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Endereço de Entrega das Tags</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Voltar
                  </button>
                </div>

                <form onSubmit={handleAddressNext} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        CEP
                      </label>
                      <input
                        type="text"
                        required
                        value={address.zip}
                        onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                        placeholder="01426-000"
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Rua / Avenida
                      </label>
                      <input
                        type="text"
                        required
                        value={address.street}
                        onChange={(e) => setAddress({ ...address, street: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Número
                      </label>
                      <input
                        type="text"
                        required
                        value={address.number}
                        onChange={(e) => setAddress({ ...address, number: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Complemento (Opcional)
                      </label>
                      <input
                        type="text"
                        value={address.complement}
                        onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Bairro
                      </label>
                      <input
                        type="text"
                        required
                        value={address.neighborhood}
                        onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Cidade
                      </label>
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        UF
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={2}
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <span>Prosseguir para Pagamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Método de Pagamento</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Voltar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <QrCode className="w-6 h-6 text-emerald-600" />
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        5% Desconto
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">PIX Instantâneo</div>
                    <div className="text-[11px] text-slate-500">Aprovação em segundos</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit_card')}
                    className={`p-4 rounded-2xl border-2 text-left transition cursor-pointer ${
                      paymentMethod === 'credit_card'
                        ? 'border-blue-500 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Até 12x
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-900">Cartão de Crédito</div>
                    <div className="text-[11px] text-slate-500">Liberação imediata</div>
                  </button>
                </div>

                {paymentMethod === 'pix' && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 mb-6 text-xs text-emerald-900 space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Desconto de 5% aplicado no PIX</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Ao clicar em finalizar, o QR Code dinâmico do PIX e a chave Copia e Cola serão gerados. Os seriais de ativação das suas Tags serão liberados instantaneamente.
                    </p>
                  </div>
                )}

                {paymentMethod === 'credit_card' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Número do Cartão
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Nome Impresso no Cartão
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="MM/AA"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                        Parcelamento
                      </label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                      >
                        <option value={1}>1x de R$ {finalTotal.toFixed(2)} (sem juros)</option>
                        <option value={2}>2x de R$ {(finalTotal / 2).toFixed(2)} (sem juros)</option>
                        <option value={3}>3x de R$ {(finalTotal / 3).toFixed(2)} (sem juros)</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleFinishPayment}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>
                    {loading ? 'Processando Pagamento...' : `Pagar R$ ${finalTotal.toFixed(2).replace('.', ',')}`}
                  </span>
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs sticky top-24">
              <h3 className="text-base font-bold text-slate-900 pb-4 mb-4 border-b border-slate-100 flex items-center justify-between">
                <span>Resumo do Pedido</span>
                <span className="text-xs text-slate-500 font-normal">{totalCount} item(ns)</span>
              </h3>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 pb-3 border-b border-slate-100 last:border-0">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        R$ {item.product.price.toFixed(2).replace('.', ',')} un.
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-slate-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-slate-800">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 hover:bg-slate-100 text-slate-600 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right text-xs font-bold text-slate-900">
                      R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-2 text-xs border-t border-slate-100">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                </div>
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Desconto PIX (5%)</span>
                    <span>- R$ {pixDiscount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Frete (Correios)</span>
                  <span>{shipping === 0 ? 'Grátis' : `R$ ${shipping.toFixed(2).replace('.', ',')}`}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

