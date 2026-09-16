import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  Star,
  Smartphone,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Layers,
  Sparkles,
  ChevronDown,
  Building,
  BarChart3,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Plan } from '../types'
import { api } from '../services/api'

export const LandingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  const [simulatedTouch, setSimulatedTouch] = useState(false)
  const [notificationDismissed, setNotificationDismissed] = useState(false)

  useEffect(() => {
    api.plans.getAll().then((list) => {
      setPlans(list.filter((p) => p.status === 'active'))
    }).catch(() => {})
  }, [])

  const handleSimulateNfcTouch = () => {
    setSimulatedTouch(true)
    setNotificationDismissed(false)
  }

  const faqs = [
    {
      q: 'O que é a tecnologia NFC e como ela funciona no estabelecimento?',
      a: 'NFC (Near Field Communication) é a tecnologia de comunicação por aproximação já presente em quase 100% dos smartphones modernos (inclusive os usados para Apple Pay e Google Pay). Quando o cliente aproxima a parte superior do celular da Tag, o link de avaliação abre automaticamente na tela sem precisar abrir a câmera ou instalar nenhum aplicativo.',
    },
    {
      q: 'Quais aparelhos de celular são compatíveis com a Tag NFC?',
      a: 'Todos os iPhones a partir do iPhone XS/XR (iOS 13+) lêem nativamente em segundo plano sem aplicativo. Nos celulares Android (Samsung, Motorola, Xiaomi, etc.), mais de 95% dos modelos já possuem NFC integrado de fábrica.',
    },
    {
      q: 'Se eu mudar de link ou rede social, preciso comprar outra Tag física?',
      a: 'Não! Esse é o grande diferencial da nossa plataforma SaaS. As Tags são gravadas com links dinâmicos permanentes da nuvem. Você pode alterar o destino da sua Tag para o Google Avaliações hoje, para o Instagram amanhã, ou para um WhatsApp com promoção em 1 clique pelo seu painel sem tocar na Tag física.',
    },
    {
      q: 'Como encontro meu link oficial do Google Avaliações para cadastrar?',
      a: 'É muito simples: acesse o perfil da sua empresa no Google pelo próprio buscador ou Google Maps, clique em "Solicitar avaliações" e copie o link curto gerado pelo Google. Basta colar no painel da AvaliaTeg.',
    },
    {
      q: 'E se o cliente tiver um celular muito antigo sem NFC?',
      a: 'Todas as nossas placas e stands acompanham um QR Code em alta definição impresso junto à Tag. Se o cliente tiver um aparelho sem NFC, basta apontar a câmera do celular para o QR Code!',
    },
    {
      q: 'Posso gerenciar mais de uma loja ou filial na mesma conta?',
      a: 'Sim! Nos planos Pro e Enterprise você pode cadastrar múltiplos estabelecimentos e atribuir cada Tag ao seu respectivo caixa, mesa, filial ou atendente.',
    },
    {
      q: 'O que acontece se uma Tag for roubada ou perdida?',
      a: 'Você pode desativar ou bloquear a Tag imediatamente pelo painel administrativo em segundos. Ninguém conseguirá reativá-la ou utilizá-la.',
    },
    {
      q: 'Posso acompanhar quantas pessoas aproximaram o celular de cada Tag?',
      a: 'Sim! O painel oferece relatórios em tempo real mostrando o total de aproximações diárias, horários de pico, tipos de aparelho (iOS vs Android) e ranking das Tags mais produtivas do seu negócio.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-25"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold shadow-xs">
                <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span>Nova Geração de Tags NFC com Redirecionamento Dinâmico</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                Transforme clientes em <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">avaliações 5 estrelas</span> com um simples toque.
              </h1>

              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Aproxime o smartphone da Tag NFC e leve seu cliente direto para a tela de avaliação do Google em menos de 3 segundos. Sem digitar links, sem atrito e com métricas em tempo real.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/loja"
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Comprar minha Tag NFC</span>
                </Link>
                <a
                  href="#demonstracao"
                  className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base rounded-2xl border border-slate-300 shadow-xs transition flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Ver demonstração interativa</span>
                </a>
              </div>

              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Sem mensalidade obrigatória</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Troque o link quando quiser</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Display acrílico ou stand premium</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm">
                <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Display Stand NFC
                    </span>
                  </div>

                  <div className="py-6 flex flex-col items-center text-center">
                    <img
                      src="/logo.png"
                      alt="AvaliaTeg"
                      className="w-36 h-auto mx-auto mb-4 object-contain rounded-2xl shadow-sm border border-slate-100 p-1 bg-white"
                    />

                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <h3 className="font-bold text-slate-900 text-lg">
                      Avalie-nos no Google
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Aproxime seu celular no balcão e receba mais clientes pelo topo do Google Maps
                    </p>

                    <div className="mt-6 w-full p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          +84%
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">Mais Avaliações</div>
                          <div className="text-[11px] text-slate-500">Média de novos reviews</div>
                        </div>
                      </div>
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
              Fluxo Passo a Passo
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Como funciona a plataforma AvaliaTeg
            </p>
            <p className="text-slate-600 text-base mt-3">
              Da compra à primeira avaliação do seu cliente: um processo 100% intuitivo e sem complicação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Compre sua Tag NFC',
                desc: 'Escolha displays elegantes de balcão ou adesivos impermeáveis de mesa em nossa loja oficial.',
                icon: ShoppingBag,
              },
              {
                step: '02',
                title: 'Ative no seu Painel',
                desc: 'Basta digitar o serial gravado na Tag para vinculá-la instantaneamente ao seu estabelecimento.',
                icon: ShieldCheck,
              },
              {
                step: '03',
                title: 'Configure o Destino',
                desc: 'Cole seu link oficial do Google Avaliações ou personalize uma página com as cores da sua empresa.',
                icon: Layers,
              },
              {
                step: '04',
                title: 'Posicione no Balcão',
                desc: 'Coloque a Tag no caixa, mesas ou recepção em local visível para o cliente.',
                icon: Building,
              },
              {
                step: '05',
                title: 'Cliente Aproxima o Celular',
                desc: 'Sem necessidade de aplicativo! Uma notificação surge na tela em milissegundos.',
                icon: Smartphone,
              },
              {
                step: '06',
                title: 'Avaliação Direta no Google',
                desc: 'A tela de 5 estrelas é aberta instantaneamente. Mais avaliações aumentam seu ranking no Maps.',
                icon: Star,
              },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-black text-blue-600/40 group-hover:text-blue-600 transition">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="demonstracao" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
              Simulador Interativo
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-2 tracking-tight">
              Veja exatamente o que o seu cliente vê
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Clique no botão abaixo para simular a aproximação de um smartphone na Tag NFC do seu balcão.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            <div className="space-y-4 text-center lg:text-left">
              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 max-w-md">
                <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                  Tag NFC Física no Balcão
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  O chip físico é programado com nosso link dinâmico seguro. Toque na Tag com o celular para disparar o gatilho NFC.
                </p>
                <button
                  onClick={handleSimulateNfcTouch}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-sm shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Aproximar Celular da Tag NFC</span>
                </button>
              </div>
            </div>

            <div className="w-[300px] h-[580px] bg-slate-950 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col justify-between">
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-2"></div>

              <div className="flex-1 bg-slate-900 rounded-[34px] overflow-hidden p-4 relative flex flex-col justify-between border border-slate-800">
                <div className="text-center pt-2">
                  <div className="text-xs font-mono text-slate-400">14:28</div>
                  <div className="text-[11px] text-slate-500">Hoje</div>
                </div>

                {simulatedTouch && !notificationDismissed ? (
                  <div className="my-auto animate-in fade-in slide-in-from-top duration-300">
                    <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-3 border border-blue-500/40 shadow-xl">
                      <div className="flex items-center justify-between text-[11px] text-blue-400 mb-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Radio className="w-3.5 h-3.5 animate-pulse" />
                          <span>TAG NFC DETECTADA</span>
                        </div>
                        <span className="text-[10px] text-slate-400">agora</span>
                      </div>
                      <p className="text-xs font-bold text-white mb-1">
                        Seu Estabelecimento
                      </p>
                      <p className="text-[11px] text-slate-300 mb-3">
                        Aproximação instantânea: avaliação 5 estrelas pronta no Google!
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNotificationDismissed(true)}
                          className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-center rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
                        >
                          Avaliação Aberta
                        </button>
                        <button
                          onClick={() => setNotificationDismissed(true)}
                          className="px-2.5 py-1.5 bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer"
                        >
                          Fechar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400 mb-3">
                      <Radio className="w-6 h-6 animate-pulse" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Aguardando aproximação da Tag física...
                    </p>
                  </div>
                )}

                <div className="text-center pb-2">
                  <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Diferenciais Exclusivos
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Tudo o que sua empresa precisa para liderar a região
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Redirecionamento Dinâmico',
                desc: 'Mude o link de destino a qualquer momento sem regravar a Tag nem perder o chip.',
                icon: RefreshCw,
              },
              {
                title: 'Métricas & Relatórios',
                desc: 'Acompanhe quantos clientes aproximaram o celular, dias de maior movimento e SO.',
                icon: BarChart3,
              },
              {
                title: 'Múltiplos Estabelecimentos',
                desc: 'Gerencie restaurantes, consultórios ou filiais em um único painel integrado.',
                icon: Building,
              },
              {
                title: 'Página de Encantamento',
                desc: 'Crie uma tela intermediária com suas fotos, logotipo e mensagem de agradecimento.',
                icon: Sparkles,
              },
            ].map((feature, i) => {
              const Icon = feature.icon
              return (
                <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-2">{feature.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="planos" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Planos Transparentes
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-2">
              Comece grátis na compra da Tag ou turbine com recursos Pro
            </h2>
            <p className="text-slate-600 text-sm mt-3">
              Valores configuráveis dinamicamente pelo painel do sistema.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-8 border flex flex-col justify-between relative ${
                  plan.popular
                    ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20'
                    : 'border-slate-200 shadow-xs'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full shadow-xs">
                    Mais Recomendado
                  </span>
                )}

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2).replace('.', ',')}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-slate-500 font-medium">/mês</span>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-6 border-t border-slate-100">
                  <Link
                    to="/loja"
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold text-center block transition ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Escolher Plano
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">
              Dúvidas Frequentes
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Perguntas sobre NFC, compatibilidade e ativação
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index
              return (
                <div
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 transition"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left font-bold text-slate-900 text-sm flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180 text-blue-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-black mb-4">
            Pronto para multiplicar as avaliações do seu comércio?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto mb-8">
            Adquira sua primeira Tag NFC hoje mesmo com garantia total de redirecionamento dinâmico.
          </p>
          <Link
            to="/loja"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-blue-700 font-bold text-base rounded-2xl shadow-xl transition transform hover:scale-105"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Comprar Minha Tag Agora</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
