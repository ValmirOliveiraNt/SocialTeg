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
  ChevronUp,
  Building,
  BarChart3,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Search,
  Check,
  Zap,
  Users,
  Utensils,
  Scissors,
  Stethoscope,
  Hotel,
  ShoppingBasket,
  Dumbbell,
  Wrench,
  HelpCircle,
  Eye,
  AlertCircle,
  Clock,
  QrCode,
  SlidersHorizontal,
} from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { Plan } from '../types'
import { api } from '../services/api'

export const LandingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([])
  const [activeFaq, setActiveFaq] = useState<number | null>(0)
  
  // Demonstração interativa estado
  const [simStep, setSimStep] = useState<number>(0)
  const [simRating, setSimRating] = useState<number>(5)
  const [simMode, setSimMode] = useState<'nfc' | 'qr'>('nfc')
  const [isSimulating, setIsSimulating] = useState<boolean>(false)

  // Segmento selecionado
  const [activeSegment, setActiveSegment] = useState<number>(0)

  useEffect(() => {
    api.plans
      .getAll()
      .then((list) => {
        const active = list.filter((p) => p.status === 'active')
        if (active.length > 0) {
          setPlans(active)
        } else {
          // Fallback seguro
          setPlans([
            {
              id: 'starter',
              name: 'Tag Individual',
              description: 'Ideal para profissionais autônomos e pequenos comércios',
              price: 0,
              billing_interval: 'monthly',
              max_tags: 1,
              max_businesses: 1,
              analytics_enabled: true,
              advanced_analytics: false,
              status: 'active',
              popular: false,
              features: [
                'Inclusa na compra do Display Físico',
                'Redirecionamento direto para Google Avaliações',
                'Métricas básicas de leituras diárias',
                'Troque o link pelo painel quando desejar',
                'QR Code dinâmico incluso',
              ],
            },
            {
              id: 'pro',
              name: 'Profissional',
              description: 'Para estabelecimentos com múltiplos caixas ou mesas',
              price: 49.9,
              billing_interval: 'monthly',
              max_tags: 10,
              max_businesses: 3,
              analytics_enabled: true,
              advanced_analytics: true,
              status: 'active',
              popular: true,
              features: [
                'Até 10 Tags gerenciadas no mesmo painel',
                'Até 3 estabelecimentos ou filiais',
                'Telemetria detalhada (horários de pico, NFC vs QR)',
                'Ações secundárias (Instagram, WhatsApp e Cardápio)',
                'Página de recepção personalizada com sua marca',
                'Suporte prioritário via WhatsApp',
              ],
            },
            {
              id: 'enterprise',
              name: 'Empresarial & Franquias',
              description: 'Para redes de lojas, clínicas e franquias em expansão',
              price: 129.9,
              billing_interval: 'monthly',
              max_tags: 50,
              max_businesses: 10,
              analytics_enabled: true,
              advanced_analytics: true,
              status: 'active',
              popular: false,
              features: [
                'Até 50 Tags com gestão unificada',
                'Multi-estabelecimentos ilimitados',
                'Relatórios consolidados de desempenho regional',
                'Exportação de métricas completas para CSV',
                'Acesso multiusuário para gerentes de loja',
                'Consultoria técnica de implementação',
              ],
            },
          ])
        }
      })
      .catch(() => {})
  }, [])

  // Dispara a animação da simulação interativa
  const handleStartSimulation = () => {
    setIsSimulating(true)
    setSimStep(1)
    
    // Passo 1: aproximação
    setTimeout(() => {
      setSimStep(2) // Notificação nativa surge
    }, 1200)

    // Passo 2: clique e tela do Google abre
    setTimeout(() => {
      setSimStep(3) // Tela do Google abre com 5 estrelas
      setIsSimulating(false)
    }, 2400)
  }

  const handleFinishSimulation = () => {
    setSimStep(4) // Feedback de sucesso
  }

  const handleResetSimulation = () => {
    setSimStep(0)
    setIsSimulating(false)
  }

  const segments = [
    {
      id: 'restaurantes',
      title: 'Restaurantes, Bares & Cafés',
      icon: Utensils,
      description: 'Posicione o display no caixa de pagamento ou na régua de saída do salão.',
      quote: 'O cliente acabou de ter uma ótima experiência gastronômica e deixa 5 estrelas antes mesmo de sair da porta.',
      metric: 'Balcão de Caixa ou Saída',
    },
    {
      id: 'barbearias',
      title: 'Barbearias & Salões de Beleza',
      icon: Scissors,
      description: 'Coloque a Tag NFC na bancada de atendimento em frente ao espelho ou na recepção.',
      quote: 'Com o visual recém-finalizado e alta autoestima, o cliente avalia com prazer em poucos segundos.',
      metric: 'Bancada ou Recepção',
    },
    {
      id: 'clinicas',
      title: 'Clínicas & Consultórios',
      icon: Stethoscope,
      description: 'Disponibilize na mesa de atendimento do pós-consulta ou na recepção de saída.',
      quote: 'Pacientes acolhidos com cuidado compartilham sua satisfação de forma segura e profissional.',
      metric: 'Recepção / Pós-Consulta',
    },
    {
      id: 'hoteis',
      title: 'Hotéis & Pousadas',
      icon: Hotel,
      description: 'Fixe no balcão de check-out ao entregar as chaves e fechar a diária.',
      quote: 'Hóspedes satisfeitos com a estadia deixam avaliações detalhadas que impactam novos viajantes.',
      metric: 'Balcão de Check-out',
    },
    {
      id: 'varejo',
      title: 'Lojas & Varejo',
      icon: ShoppingBasket,
      description: 'Ao lado da máquina de cartão de crédito no momento do pagamento.',
      quote: 'Enquanto a maquininha processa o comprovante, o cliente aproxima o smartphone e conclui a avaliação.',
      metric: 'Ponto de Checkout',
    },
    {
      id: 'academias',
      title: 'Academias & Estúdios',
      icon: Dumbbell,
      description: 'Na catraca de saída ou balcão de suporte e avaliação física.',
      quote: 'Alunos motivados fortalecem a reputação do seu espaço fitness nas pesquisas locais.',
      metric: 'Catraca / Recepção',
    },
    {
      id: 'oficinas',
      title: 'Oficinas & Concessionárias',
      icon: Wrench,
      description: 'No balcão de entrega do veículo revisado e pagamento.',
      quote: 'A confiança em serviços automotivos é construída na entrega pontual e no serviço comprovado.',
      metric: 'Entrega de Veículos',
    },
  ]

  const faqs = [
    {
      q: 'O que é o AvaliaTag?',
      a: 'O AvaliaTag é uma solução integrada que une hardware elegante (displays e adesivos com chip NFC e QR Code dinâmico) a uma plataforma em nuvem. Ele permite que seus clientes acessem a página de avaliação do Google da sua empresa em menos de 3 segundos, simplesmente aproximando o smartphone da Tag.',
    },
    {
      q: 'Como o cliente deixa uma avaliação?',
      a: 'É extremamente simples: o cliente encosta a parte superior do celular na Tag (via NFC) ou aponta a câmera para o QR Code impresso no display. Uma notificação nativa surge na tela do smartphone e, com um toque, o cliente já está na página de avaliação 5 estrelas do Google da sua empresa.',
    },
    {
      q: 'Funciona com iPhone e Android?',
      a: 'Sim! O AvaliaTag é compatível com praticamente 100% dos smartphones do mercado. No iPhone (modelos XR, XS e mais novos, com iOS 13+), a leitura por NFC é nativa e em segundo plano. Em smartphones Android, mais de 95% dos modelos contam com NFC de fábrica. Para qualquer aparelho sem NFC, o QR Code impresso no display garante acesso imediato via câmera.',
    },
    {
      q: 'O AvaliaTag precisa de aplicativo? O cliente precisa instalar alguma coisa?',
      a: 'Não! Nem você nem seu cliente precisam instalar nenhum aplicativo. A tecnologia NFC e a câmera funcionam de forma nativa no sistema operacional do celular (iOS e Android), abrindo o navegador diretamente.',
    },
    {
      q: 'Posso usar QR Code junto com o NFC?',
      a: 'Sim! Todos os nossos displays e stands físicos acompanham um QR Code em alta definição gravado com o mesmo link dinâmico da Tag. Assim, seu cliente pode escolher aproximar o celular ou ler o QR Code com a câmera.',
    },
    {
      q: 'As avaliações vão diretamente para o Google?',
      a: 'Sim. O link dinâmico direciona o navegador do cliente diretamente para o fluxo oficial de avaliação do Perfil da sua Empresa no Google (Google Business Profile). O cliente avalia logado em sua própria conta Google pessoal.',
    },
    {
      q: 'Mais avaliações melhoram minha presença no Google?',
      a: 'As avaliações de clientes são um dos fatores considerados pelo Google na classificação local de empresas, juntamente com a relevância do termo pesquisado e a distância geográfica. Manter um fluxo frequente de avaliações positivas autênticas transmite confiança aos consumidores e fortalece o destaque do seu perfil no Google Maps e na Pesquisa Local.',
    },
    {
      q: 'Posso trocar o link ou destino depois de comprar a Tag física?',
      a: 'Sim! Esse é um dos maiores diferenciais da plataforma AvaliaTag. A Tag física é vinculada a um link dinâmico em nuvem. A qualquer momento você pode entrar no seu painel e alterar o destino: pode ser o Google Avaliações hoje, seu Instagram amanhã, ou um WhatsApp de atendimento, sem precisar comprar uma nova Tag.',
    },
    {
      q: 'Posso usar o AvaliaTag em qualquer tipo de negócio?',
      a: 'Com certeza! O AvaliaTag é indicado para qualquer estabelecimento que atenda clientes presencialmente: restaurantes, bares, barbearias, salões, clínicas, hotéis, lojas de rua, academias, oficinas mecânicas, pet shops e escritórios.',
    },
    {
      q: 'As avaliações geradas são autênticas?',
      a: 'Totalmente autênticas. O AvaliaTag não gera avaliações falsas nem incentiva práticas artificiais. Ele apenas remove a barreira técnica para que clientes reais, que acabaram de consumir na sua empresa, possam compartilhar sua opinião voluntária e honesta no Google.',
    },
  ]

  const advertisedMonthlyPrice = (plans.find((item) => item.id === 'plan-pro') || plans[0])?.price ?? 29.9
  const advertisedMonthlyPriceLabel = advertisedMonthlyPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white antialiased">
      <Navbar />

      <main className="flex-1">
        {/* =========================================================================
            1. HERO SECTION
           ========================================================================= */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200/80">
          {/* Fundo com grade sutil e orbs de iluminação suave */}
          <div className="absolute inset-0 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.18] pointer-events-none"></div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/3 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Coluna de Texto & Proposta de Valor */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* Badge Superior */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Mais avaliações. Mais confiança. Mais presença no Google.</span>
                </div>

                {/* Título Principal */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                  Transforme cada cliente satisfeito em uma{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
                    avaliação no Google.
                  </span>
                </h1>

                {/* Subtítulo */}
                <p className="text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                  O AvaliaTag torna simples para seus clientes deixarem uma avaliação após uma experiência positiva com sua empresa.
                </p>

                {/* CTAs da Primeira Dobra */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <Link
                    to="/loja"
                    className="w-full sm:w-auto px-7 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 group cursor-pointer"
                  >
                    <span>Quero receber mais avaliações no Google</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a
                    href="#como-funciona"
                    className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-base rounded-2xl border border-slate-300 shadow-xs hover:border-slate-400 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ver como funciona ↓</span>
                  </a>
                </div>

                {/* Micro-sinais de confiança */}
                <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2.5 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sem necessidade de aplicativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>iPhone & Android nativos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Redirecionamento 100% dinâmico</span>
                  </div>
                </div>
              </div>

              {/* Coluna Visual: Composição de Produto & Smartphone */}
              <div className="lg:col-span-5 flex justify-center relative">
                <img
                  src="/brand/hero-nfc-applications-1600x900.png"
                  alt="Aplicações AvaliaTag em tag NFC e placa de balcão"
                  className="relative z-10 w-full max-w-[620px] rounded-[2rem] shadow-2xl shadow-blue-950/10 object-cover"
                />
                <div className="hidden relative w-full max-w-[420px]">
                  {/* Glow decorativo de fundo */}
                  <div className="absolute -top-6 -left-6 w-64 h-64 bg-blue-400/25 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

                  {/* Card Central de Produto */}
                  <div className="relative bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/90 z-10">
                    {/* Header do Mockup */}
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-400"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                        <span>Display Oficial NFC</span>
                      </div>
                    </div>

                    {/* Representação Física do Stand de Balcão */}
                    <div className="py-6 flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <img
                          src="/brand/logo-horizontal-color-600.png"
                          alt="AvaliaTag"
                          className="w-32 h-auto object-contain rounded-2xl shadow-sm border border-slate-100 p-1.5 bg-white"
                        />
                        <span className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                          NFC + QR
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      <h3 className="font-extrabold text-slate-900 text-lg">
                        Avalie-nos no Google
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                        Aproxime seu smartphone da placa ou aponte a câmera para o QR Code
                      </p>

                      {/* Chip NFC com pulso visual suave */}
                      <div className="mt-5 p-3 w-full rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200/70 flex items-center justify-between text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                            <Radio className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Aproximação em 2s
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Abre direto na tela de 5 estrelas
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-blue-700 bg-white px-2 py-1 rounded-md border border-blue-200 shadow-xs">
                          Nativo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card 1: Notificação de Leitura do Celular */}
                  <div className="absolute -top-4 -right-4 sm:-right-8 bg-slate-900/95 backdrop-blur-md text-white p-3 sm:p-3.5 rounded-2xl shadow-2xl border border-slate-700 max-w-[220px] z-20 animate-float-slow hidden sm:block">
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-blue-400 font-bold">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      <span>TAG NFC DETECTADA</span>
                    </div>
                    <p className="text-xs font-semibold text-white leading-tight">
                      Sua Empresa no Google Maps
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Toque para enviar sua avaliação 5 estrelas
                    </p>
                  </div>

                  {/* Floating Card 2: Prova Social no Google Maps */}
                  <div className="absolute -bottom-5 -left-4 sm:-left-8 bg-white p-3.5 rounded-2xl shadow-2xl border border-slate-200 max-w-[240px] z-20 animate-float-reverse">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        ★
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          4,9 • Excelente
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Perfil da Empresa no Google
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-600 font-medium bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                      <span>Fluxo contínuo de reviews</span>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SEÇÃO "O PROBLEMA"
           ========================================================================= */}
        <section id="problema" className="py-20 lg:py-24 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Cabeçalho da Seção */}
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                O Desafio do Comércio Físico
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Clientes satisfeitos nem sempre deixam uma avaliação.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Muitas empresas oferecem uma ótima experiência, mas perdem a oportunidade de transformar essa satisfação em avaliações no Google porque pedir uma avaliação é difícil, demorado ou simplesmente esquecido.
              </p>
            </div>

            {/* 3 Cards Modernos Numerados */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 01 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-black text-slate-300 group-hover:text-blue-600 transition-colors">
                      01
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-600 shadow-xs">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl mb-3">
                    Poucos clientes deixam avaliação
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Clientes insatisfeitos costumam reclamar com facilidade, mas clientes satisfeitos simplesmente seguem com a sua rotina se não houver um convite imediato no momento certo.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs text-slate-500 font-medium">
                  A satisfação existe, mas não vira recomendação pública.
                </div>
              </div>

              {/* Card 02 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-black text-slate-300 group-hover:text-blue-600 transition-colors">
                      02
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-600 shadow-xs">
                      <Clock className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl mb-3">
                    O processo tradicional é complicado
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Pedir para o cliente abrir o navegador, pesquisar o nome da loja, encontrar o perfil correto e clicar em avaliar exige muitas etapas. Cada clique a mais gera desistência.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs text-slate-500 font-medium">
                  O atrito excessivo faz o cliente desistir no caminho.
                </div>
              </div>

              {/* Card 03 */}
              <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono text-3xl font-black text-slate-300 group-hover:text-blue-600 transition-colors">
                      03
                    </span>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-600 shadow-xs">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl mb-3">
                    Perda de oportunidades locais
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Sem um fluxo constante e recente de avaliações, a empresa deixa de alimentar um sinal valioso de confiança e atratividade frente aos concorrentes da sua vizinhança.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/60 text-xs text-slate-500 font-medium">
                  Concorrentes mais ativos ganham a preferência do consumidor.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. SEÇÃO GOOGLE & PRESENÇA LOCAL
           ========================================================================= */}
        <section id="google" className="py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
          {/* Luzes decorativas */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Texto explicativo institucional */}
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Google Maps & Busca Local
                </span>
                
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Suas avaliações também ajudam sua empresa a se destacar no Google.
                </h2>

                <p className="text-slate-300 text-base leading-relaxed">
                  O Perfil da Empresa no Google (Google Business Profile) permite que clientes encontrem seu estabelecimento tanto na Pesquisa quanto no Google Maps.
                </p>

                <p className="text-slate-300 text-sm leading-relaxed">
                  Para gerar os resultados locais, o Google utiliza diversos fatores combinados, incluindo:
                </p>

                {/* Lista de fatores locais do Google */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Relevância</div>
                      <div className="text-[11px] text-slate-400">Correspondência com a busca do usuário</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Distância</div>
                      <div className="text-[11px] text-slate-400">Proximidade geográfica do cliente</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Destaque & Notoriedade</div>
                      <div className="text-[11px] text-slate-400">Popularidade no mundo real e online</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white">Volume & Notas</div>
                      <div className="text-[11px] text-slate-400">Quantidade de avaliações e média recente</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-800/60 text-xs text-blue-200 leading-relaxed">
                  <p className="font-semibold text-white mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Comunicação Transparente:
                  </p>
                  Mais avaliações e classificações positivas podem contribuir para melhorar a classificação local da empresa, gerando prova social autêntica e aumentando o potencial de descoberta.
                </div>

                <div className="pt-2">
                  <Link
                    to="/loja"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <span>Quero melhorar minha estratégia de avaliações</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Simulação Visual de Busca Local */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-950 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-2xl">
                  {/* Barra de Busca Simulada */}
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2.5 bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 flex-1 max-w-sm">
                      <Search className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 font-mono">restaurante perto de mim</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono pl-3 shrink-0">
                      Exemplo ilustrativo
                    </span>
                  </div>

                  {/* Lista de Resultados Locais Simulados */}
                  <div className="space-y-3">
                    {/* Card 1: Sua Empresa com AvaliaTag */}
                    <div className="p-4 rounded-2xl bg-slate-900 border-2 border-blue-500/80 shadow-lg shadow-blue-950/50 relative">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-base">Sua Empresa</span>
                          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Com AvaliaTag
                          </span>
                        </div>
                        <span className="text-xs text-emerald-400 font-bold">Aberto agora</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span className="font-black text-amber-400 text-sm">4,9</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-slate-400 font-semibold">(238 avaliações recentes)</span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        "Atendimento impecável! Fácil de avaliar e ambiente acolhedor..."
                      </p>
                    </div>

                    {/* Card 2: Concorrente Médio */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 opacity-85">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-300 text-sm">Empresa Concorrente A</span>
                        <span className="text-[11px] text-slate-500">A 400m</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-amber-400">4,5</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4].map((s) => (
                            <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                          <Star className="w-3 h-3 text-slate-600" />
                        </div>
                        <span className="text-slate-400">(87 avaliações)</span>
                      </div>
                    </div>

                    {/* Card 3: Outra Empresa */}
                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 opacity-65">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-400 text-sm">Empresa Concorrente B</span>
                        <span className="text-[11px] text-slate-500">A 650m</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-amber-400">4,3</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4].map((s) => (
                            <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                          <Star className="w-3 h-3 text-slate-600" />
                        </div>
                        <span className="text-slate-500">(41 avaliações)</span>
                      </div>
                    </div>
                  </div>

                  {/* Diagrama de Valor / Funil Visual */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-white">Mais avaliações</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">No balcão</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-blue-400">Mais prova</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Social ativa</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-indigo-400">Mais confiança</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">De novos clientes</div>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-emerald-400">Mais visitas</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">No seu negócio</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            4. SEÇÃO "POR QUE GOOGLE?" (JORNADA DO CONSUMIDOR)
           ========================================================================= */}
        <section id="jornada" className="py-20 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Comportamento do Consumidor Moderno
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Antes de escolher uma empresa, muita gente procura por ela no Google.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                A decisão de entrar em um restaurante, agendar um dentista ou visitar uma loja começa quase sempre na tela do celular.
              </p>
            </div>

            {/* Timeline da Jornada do Consumidor */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {[
                {
                  step: '01',
                  title: 'Google Maps / Busca',
                  desc: 'O cliente pesquisa por serviços ou produtos próximos da sua localização.',
                  icon: Search,
                },
                {
                  step: '02',
                  title: 'Perfil da Empresa',
                  desc: 'Analisa o Perfil no Google, fotos do local e horário de funcionamento.',
                  icon: Building,
                },
                {
                  step: '03',
                  title: 'Avaliações Recentes',
                  desc: 'Lê as opiniões dos últimos clientes para saber se o serviço ainda é de qualidade.',
                  icon: Star,
                },
                {
                  step: '04',
                  title: 'Confiança Gerada',
                  desc: 'A constância de boas notas reduz o receio e transmite segurança imediata.',
                  icon: ShieldCheck,
                },
                {
                  step: '05',
                  title: 'Visita ou Compra',
                  desc: 'O cliente traça a rota no GPS, liga para reservar ou entra diretamente na sua loja.',
                  icon: MapPin,
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          Passo {item.step}
                        </span>
                        <Icon className="w-5 h-5 text-slate-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-2">{item.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. SEÇÃO "COMO FUNCIONA"
           ========================================================================= */}
        <section id="como-funciona" className="py-20 lg:py-24 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Experiência Sem Atrito
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                É simples para você.<br className="hidden sm:inline" /> É simples para seu cliente.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Eliminamos qualquer barreira técnica entre a satisfação do cliente no atendimento e a publicação da avaliação no Google.
              </p>
            </div>

            {/* 3 Passos Principais com Grande Destaque Visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Passo 01 */}
              <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-blue-500/20">
                  01
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Cliente conclui o atendimento
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  No balcão de pagamento, na mesa de refeição, na recepção de saída ou no momento da entrega do serviço concluído.
                </p>
                <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Momento ideal com cliente receptivo</span>
                </div>
              </div>

              {/* Passo 02 */}
              <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-blue-500/20">
                  02
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Aproxima o celular ou lê o QR Code
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Basta aproximar o smartphone da Tag física com tecnologia NFC nativa ou apontar a câmera para o QR Code de alta precisão.
                </p>
                <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  <span>Sem baixar nenhum aplicativo</span>
                </div>
              </div>

              {/* Passo 03 */}
              <div className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-slate-100 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mb-6 shadow-md shadow-blue-500/20">
                  03
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">
                  Avalia sua empresa no Google
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  A página oficial de avaliação do Google da sua empresa abre direto com as 5 estrelas prontas para serem confirmadas.
                </p>
                <div className="pt-4 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Avaliação real publicada em segundos</span>
                </div>
              </div>
            </div>

            {/* Fluxo Visual Desktop (Tag -> Celular -> Google) */}
            <div className="mt-12 hidden lg:flex items-center justify-center gap-6 p-6 rounded-2xl bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600" />
                Display Físico no Balcão
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Aproximação NFC do Celular (1s)
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Google Avaliações Aberto
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Avaliação 5 Estrelas Publicada
              </span>
            </div>
          </div>
        </section>

        {/* =========================================================================
            6. DEMONSTRAÇÃO INTERATIVA ("VEJA COMO É FÁCIL")
           ========================================================================= */}
        <section id="demonstracao" className="py-20 lg:py-24 bg-slate-950 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Simulador Interativo
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Veja como é fácil
              </h2>
              <div className="flex items-center justify-center gap-2 font-mono text-xs sm:text-sm text-slate-400">
                <span>TAG</span>
                <span>→</span>
                <span>SMARTPHONE</span>
                <span>→</span>
                <span>GOOGLE</span>
                <span>→</span>
                <span className="text-amber-400">★★★★★</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Painel de Controle da Simulação */}
              <div className="lg:col-span-6 space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
                      Escolha o método de leitura:
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      O cliente pode aproximar o celular do chip NFC ou apontar a câmera para o QR Code impresso no display.
                    </p>
                  </div>

                  {/* Alternador de Modo: NFC vs QR Code */}
                  <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                    <button
                      onClick={() => setSimMode('nfc')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        simMode === 'nfc'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                      <span>Aproximação NFC</span>
                    </button>
                    <button
                      onClick={() => setSimMode('qr')}
                      className={`py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        simMode === 'qr'
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QR Code Câmera</span>
                    </button>
                  </div>

                  {/* Botão de Disparo */}
                  <button
                    onClick={handleStartSimulation}
                    disabled={isSimulating}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Smartphone className="w-5 h-5" />
                    <span>
                      {isSimulating
                        ? 'Simulando leitura em andamento...'
                        : 'Simular experiência do cliente'}
                    </span>
                  </button>

                  {/* Indicador de Status dos Passos */}
                  <div className="pt-4 border-t border-slate-800 grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div
                      className={`p-2 rounded-xl border ${
                        simStep >= 0 ? 'border-blue-500/50 bg-blue-950/40 text-blue-300' : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      1. Stand
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        simStep >= 1 ? 'border-blue-500/50 bg-blue-950/40 text-blue-300' : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      2. Leitura
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        simStep >= 3 ? 'border-blue-500/50 bg-blue-950/40 text-blue-300' : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      3. Google
                    </div>
                    <div
                      className={`p-2 rounded-xl border ${
                        simStep >= 4 ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300' : 'border-slate-800 text-slate-500'
                      }`}
                    >
                      4. Avaliado
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <button
                      onClick={handleResetSimulation}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Reiniciar simulação
                    </button>
                    <Link
                      to="/login"
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <span>Quero usar o AvaliaTag</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Aparelho Smartphone Realista Interativo */}
              <div className="lg:col-span-6 flex justify-center">
                <div className="w-[310px] h-[590px] bg-slate-950 rounded-[48px] p-3 shadow-2xl border-4 border-slate-800 relative flex flex-col justify-between">
                  {/* Ilha dinâmica / Notch */}
                  <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-1.5 shrink-0 flex items-center justify-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2"></span>
                    <span className="w-2 h-2 rounded-full bg-slate-950"></span>
                  </div>

                  {/* Tela do Celular */}
                  <div className="flex-1 bg-slate-900 rounded-[36px] overflow-hidden p-4 relative flex flex-col justify-between border border-slate-800">
                    {/* Barra de Status Superior */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 px-1">
                      <span>14:35</span>
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-emerald-400" />
                        <span>5G</span>
                        <span>100%</span>
                      </div>
                    </div>

                    {/* Conteúdo Dinâmico da Tela baseado em simStep */}
                    <div className="my-auto w-full">
                      {simStep === 0 && (
                        <div className="text-center py-6 px-2 space-y-4">
                          <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-blue-400">
                            {simMode === 'nfc' ? (
                              <Radio className="w-8 h-8 animate-pulse" />
                            ) : (
                              <QrCode className="w-8 h-8" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">
                              Aguardando aproximação
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              {simMode === 'nfc'
                                ? 'Aproxime a parte superior do celular da Tag NFC do balcão.'
                                : 'Aponte a câmera para o QR Code da placa.'}
                            </p>
                          </div>
                          <button
                            onClick={handleStartSimulation}
                            className="text-xs bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg border border-blue-500/40 transition cursor-pointer"
                          >
                            Toque para simular
                          </button>
                        </div>
                      )}

                      {(simStep === 1 || simStep === 2) && (
                        <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          {/* Notificação nativa do sistema */}
                          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl p-3.5 border border-blue-500/50 shadow-xl text-left">
                            <div className="flex items-center justify-between text-[10px] text-blue-400 mb-1 font-bold">
                              <span className="flex items-center gap-1">
                                <Radio className="w-3 h-3" />
                                {simMode === 'nfc' ? 'TAG NFC DETECTADA' : 'QR CODE DETECTADO'}
                              </span>
                              <span className="text-slate-400">agora</span>
                            </div>
                            <p className="text-xs font-bold text-white">
                              Sua Empresa no Google Maps
                            </p>
                            <p className="text-[11px] text-slate-300 mt-0.5 mb-2.5 leading-snug">
                              Avaliação rápida 5 estrelas pronta para envio.
                            </p>
                            <button
                              onClick={() => setSimStep(3)}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                            >
                              Abrir Avaliação no Google
                            </button>
                          </div>
                        </div>
                      )}

                      {simStep === 3 && (
                        <div className="bg-white rounded-2xl p-4 text-slate-900 shadow-xl border border-slate-100 text-left space-y-3 animate-in fade-in slide-in-from-bottom duration-300">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                                G
                              </div>
                              <span className="text-xs font-bold text-slate-800">
                                Google Avaliações
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">Oficial</span>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-900">Sua Empresa</p>
                            <p className="text-[10px] text-slate-500">
                              Como foi sua experiência neste local?
                            </p>
                          </div>

                          {/* Seletor de Estrelas Interativo */}
                          <div className="flex items-center justify-center gap-1.5 py-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setSimRating(star)}
                                className="p-1 hover:scale-125 transition-transform cursor-pointer"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    star <= simRating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>

                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 italic text-center">
                            "Atendimento nota 10, recomendo a todos!"
                          </div>

                          <button
                            onClick={handleFinishSimulation}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                          >
                            Postar Avaliação
                          </button>
                        </div>
                      )}

                      {simStep === 4 && (
                        <div className="text-center py-6 px-2 space-y-3 animate-in zoom-in-95 duration-200">
                          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                            <Check className="w-7 h-7 stroke-[3]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">
                              Avaliação 5★ Enviada!
                            </p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              A avaliação já aparece no Perfil da Empresa no Google Maps.
                            </p>
                          </div>
                          <button
                            onClick={handleResetSimulation}
                            className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline pt-2 cursor-pointer"
                          >
                            Testar novamente
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Barra Inferior do Sistema Operacional */}
                    <div className="text-center pb-1">
                      <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================================================
            7. BENEFÍCIOS ("MAIS DO QUE UMA TAG.")
           ========================================================================= */}
        <section id="beneficios" className="py-20 lg:py-24 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Vantagens Reais
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Mais do que uma tag.
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Uma solução completa desenvolvida para transformar a experiência física dos seus clientes em presença digital e prova social contínua.
              </p>
            </div>

            <div className="mb-10 rounded-[2rem] overflow-hidden bg-[#0B1F3B] border border-blue-950 shadow-xl">
              <div className="grid md:grid-cols-[minmax(0,1fr)_280px] items-stretch">
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">Conexões que geram resultados</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mt-3">Tecnologia NFC que aproxima clientes e fortalece negócios.</h3>
                  <p className="text-sm text-blue-100/75 mt-3 max-w-2xl">Uma experiência consistente entre o ponto físico, a página aberta pela tag e a gestão dos resultados.</p>
                </div>
                <img src="/brand/benefits-panel-dark.png" alt="Mais visibilidade, clientes, confiança e crescimento" className="w-full h-full object-cover object-left" />
              </div>
            </div>

            {/* Grid de 8 Benefícios Concretos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'Facilita o pedido de avaliações',
                  desc: 'Sua equipe não precisa passar vergonha ou pedir favores. A presença da Tag no balcão convida o cliente de forma natural e profissional.',
                },
                {
                  icon: Zap,
                  title: 'Reduz o atrito a zero',
                  desc: 'Nada de buscar o nome da loja no Google ou digitar URLs. O cliente aproxima o smartphone e já cai na tela de 5 estrelas.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Fortalece a prova social',
                  desc: 'Clientes satisfeitos registram sua experiência no calor do momento, quando a percepção positiva de valor está no ápice.',
                },
                {
                  icon: TrendingUp,
                  title: 'Fluxo constante e autêntico',
                  desc: 'Ajuda a manter um ritmo contínuo de avaliações recentes, transmitindo segurança para quem pesquisa sobre sua empresa.',
                },
                {
                  icon: Search,
                  title: 'Presença nas buscas locais',
                  desc: 'Avaliações e classificações positivas são sinais considerados pelo Google na ordenação de resultados do Maps e Pesquisa.',
                },
                {
                  icon: RefreshCw,
                  title: 'Redirecionamento 100% dinâmico',
                  desc: 'Mude o link de destino quando quiser pelo painel na nuvem sem precisar comprar nem reprogramar a Tag física.',
                },
                {
                  icon: BarChart3,
                  title: 'Telemetria & Métricas ao vivo',
                  desc: 'Acompanhe total de leituras, horários de pico, canal de leitura (NFC vs QR) e desempenho de cada ponto físico.',
                },
                {
                  icon: Layers,
                  title: 'Display Físico Premium',
                  desc: 'Displays em acrílico cristal ou madeira maciça de alta durabilidade que enriquecem a estética do seu balcão.',
                },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xs">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mb-2">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            8. SEÇÃO PARA DIFERENTES TIPOS DE NEGÓCIO
           ========================================================================= */}
        <section id="segmentos" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Segmentos Atendidos
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Feito para negócios que dependem da confiança dos clientes.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Descubra onde posicionar o AvaliaTag para transformar o atendimento do seu setor em um canal contínuo de avaliações.
              </p>
            </div>

            {/* Grid Interativo de Segmentos */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Lista de botões de segmentos */}
              <div className="lg:col-span-5 space-y-2">
                {segments.map((seg, idx) => {
                  const Icon = seg.icon
                  const isSelected = activeSegment === idx
                  return (
                    <button
                      key={seg.id}
                      onClick={() => setActiveSegment(idx)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/15 text-slate-900'
                          : 'bg-slate-100/80 border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-600 border border-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-sm">{seg.title}</span>
                      </div>
                      <ArrowRight
                        className={`w-4 h-4 transition-transform ${
                          isSelected ? 'text-blue-600 translate-x-1' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>

              {/* Detalhe do Segmento Ativo */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg relative overflow-hidden">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-3">
                      {React.createElement(segments[activeSegment].icon, {
                        className: 'w-7 h-7 text-blue-600',
                      })}
                      <h3 className="text-xl font-black text-slate-900">
                        {segments[activeSegment].title}
                      </h3>
                    </div>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      {segments[activeSegment].metric}
                    </span>
                  </div>

                  <p className="text-base text-slate-700 leading-relaxed mb-6 font-medium">
                    {segments[activeSegment].description}
                  </p>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 mb-6 italic text-sm text-slate-600 leading-relaxed relative">
                    <span className="text-2xl text-blue-400 font-serif leading-none block mb-1">“</span>
                    {segments[activeSegment].quote}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="text-xs text-slate-500">
                      Pronto para instalar sem reformas ou fios no balcão.
                    </div>
                    <Link
                      to="/loja"
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                    >
                      <span>Ver opções de displays</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            9. SEÇÃO VISUAL "ANTES E DEPOIS"
           ========================================================================= */}
        <section id="comparativo" className="py-20 lg:py-24 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Comparativo de Balcão
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                A diferença entre pedir e facilitar.
              </h2>
              <p className="text-base text-slate-600 leading-relaxed">
                Veja o que acontece no fluxo de atendimento comum em comparação à experiência com AvaliaTag.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* O Fluxo Tradicional (Sem AvaliaTag) */}
              <div className="p-8 rounded-3xl bg-rose-50/50 border-2 border-rose-200/80 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-rose-200 mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                      Antes (Sem AvaliaTag)
                    </span>
                    <span className="text-xs font-semibold text-rose-600">Alto atrito</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Cliente conclui o atendimento e tem uma excelente experiência.</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Paga a conta, pega suas coisas e sai do estabelecimento.</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Pensa em avaliar mais tarde em casa pelo computador ou celular.</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        4
                      </span>
                      <span>Esquece com a correria do dia a dia ou acha trabalhoso procurar a loja no Google.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-white border border-rose-200 text-center">
                  <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    Resultado final
                  </div>
                  <div className="text-sm font-semibold text-slate-800 mt-1">
                    Zero novas avaliações registradas publicamente.
                  </div>
                </div>
              </div>

              {/* O Fluxo Inteligente (Com AvaliaTag) */}
              <div className="p-8 rounded-3xl bg-blue-50/50 border-2 border-blue-300 shadow-xl shadow-blue-500/5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-blue-200 mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                      Com AvaliaTag
                    </span>
                    <span className="text-xs font-semibold text-blue-700">Zero atrito</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        1
                      </span>
                      <span>Cliente conclui o atendimento encantado com a sua empresa.</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        2
                      </span>
                      <span>Vê o display com design moderno e claro no balcão ou caixa.</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        3
                      </span>
                      <span>Aproxima o celular em 2 segundos — a tela com 5 estrelas do Google abre no ato.</span>
                    </div>

                    <div className="flex items-start gap-3 text-sm text-slate-800 font-medium">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        4
                      </span>
                      <span>Confirma a avaliação em menos de 10 segundos antes de ir embora.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-2xl bg-white border border-blue-300 text-center shadow-xs">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Resultado final
                  </div>
                  <div className="text-sm font-bold text-slate-900 mt-1">
                    Avaliação autêntica garantida e prova social fortalecida no Google.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            10. SEÇÃO DO PRODUTO FÍSICO & TECNOLOGIA
           ========================================================================= */}
        <section id="produto" className="py-20 lg:py-24 bg-slate-900 text-white border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                Hardware & Nuvem
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Construído com materiais nobres e tecnologia original.
              </h2>
              <p className="text-base text-slate-400 leading-relaxed">
                Design elegante que harmoniza com a decoração do seu estabelecimento, com chips NXP homologados e durabilidade garantida.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              <img src="/brand/nfc-tag-black.png" alt="Tag NFC AvaliaTag preta" className="w-full aspect-square object-cover rounded-3xl border border-slate-700 shadow-xl" />
              <img src="/brand/nfc-tag-white.png" alt="Tag NFC AvaliaTag branca" className="w-full aspect-square object-cover rounded-3xl border border-slate-700 shadow-xl" />
              <img src="/brand/nfc-counter-sign.png" alt="Placa de balcão AvaliaTag" className="w-full aspect-square object-cover rounded-3xl border border-slate-700 shadow-xl" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Item 1 */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Material
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Acrílico Cristal 3mm
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Corte a laser de alta precisão, cantos arredondados e base estável para balcões. Resistente a álcool 70% e produtos de higienização.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                    Chip NFC
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    NTAG213 Original
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compatibilidade total com iPhone (iOS 13+) e Android com NFC. Leitura por radiofrequência em menos de 0,5 segundo sem contato físico direto.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Impressão UV
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    QR Code de Alta Densidade
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Impressão UV permanente direta no acrílico que não desbota com a luz solar. Para leitura instantânea pela câmera de qualquer aparelho.
                </p>
              </div>

              {/* Item 4 */}
              <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Software em Nuvem
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Painel SaaS Dinâmico
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gerencie todas as suas tags e altere o link para onde elas apontam em tempo real, sem precisar reprogramar nem tocar no chip físico.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/loja"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl shadow-xl transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>Ver modelos disponíveis na Loja Oficial</span>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            11. PLANOS E PREÇOS TRANSPARENTES
           ========================================================================= */}
        <section id="planos" className="py-20 lg:py-24 bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Assinatura simples
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Tudo incluído por {advertisedMonthlyPriceLabel} por mês.
              </h2>
              <p className="text-sm sm:text-base text-slate-600">
                Receba a primeira placa padrão AvaliaTag em comodato, use todos os recursos e cancele quando quiser.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 max-w-lg mx-auto items-stretch">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 border flex flex-col justify-between relative transition-all duration-200 ${
                    plan.popular
                      ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20'
                      : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider py-1 px-3.5 rounded-full shadow-xs">
                      Mais Escolhido
                    </span>
                  )}

                  <div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">{plan.name}</h3>
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
                          <span className="leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 mt-6 border-t border-slate-100">
                    <Link
                      to="/loja"
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold text-center block transition cursor-pointer ${
                        plan.popular
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      }`}
                    >
                      Assinar AvaliaTag
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            12. FAQ (PERGUNTAS FREQUENTES)
           ========================================================================= */}
        <section id="faq" className="py-20 lg:py-24 bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                Tire Suas Dúvidas
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Perguntas frequentes sobre o AvaliaTag
              </h2>
              <p className="text-sm text-slate-500">
                Tudo o que você precisa saber sobre NFC, QR Code, compatibilidade e dinâmica dos links.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = activeFaq === index
                return (
                  <div
                    key={index}
                    className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/70 transition"
                  >
                    <button
                      onClick={() => setActiveFaq(isOpen ? null : index)}
                      className="w-full p-5 text-left font-bold text-slate-900 text-sm sm:text-base flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/50 transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-white">
                        {faq.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            13. CTA FINAL DE ALTO IMPACTO
           ========================================================================= */}
        <section id="comecar" className="py-20 lg:py-28 bg-[#0B1F3B] text-white text-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: "linear-gradient(90deg, rgba(11,31,59,.97), rgba(11,31,59,.82)), url('/brand/cta-background-1600x600.png')" }}>
          {/* Brilhos de fundo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -top-10 left-1/4 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/60 border border-blue-700/60 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dê o próximo passo na reputação da sua empresa</span>
            </span>

            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Faça sua próxima avaliação acontecer.
            </h2>

            <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Facilite o caminho para que seus clientes compartilhem a experiência que tiveram com sua empresa. Sem atrito, no balcão e no momento certo.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/loja"
                className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base rounded-2xl shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Quero receber mais avaliações</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#como-funciona"
                className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-base rounded-2xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Conhecer o AvaliaTag</span>
              </a>
            </div>

            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Entrega rápida para todo o Brasil</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Garantia de redirecionamento dinâmico</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Suporte técnico especializado</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
export default LandingPage
