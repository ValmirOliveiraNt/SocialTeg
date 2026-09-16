import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Star, Radio, ArrowUpRight } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block hover:opacity-90 transition">
              <BrandLogo size="md" theme="dark" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Plataforma SaaS profissional de aproximação física e redirecionamento dinâmico em nuvem. Facilite o caminho entre a experiência do cliente e a avaliação no Google.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-medium bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4" />
                <span>NTAG213 Original • 100% Compatível</span>
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-blue-400 font-medium bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <Radio className="w-3.5 h-3.5" />
                <span>Redirecionamento em Nuvem</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Navegação
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a href="/#como-funciona" className="hover:text-white transition">
                  Como funciona
                </a>
              </li>
              <li>
                <a href="/#beneficios" className="hover:text-white transition">
                  Benefícios
                </a>
              </li>
              <li>
                <a href="/#google" className="hover:text-white transition">
                  Google & Presença Local
                </a>
              </li>
              <li>
                <a href="/#demonstracao" className="hover:text-white transition">
                  Demonstração interativa
                </a>
              </li>
              <li>
                <a href="/#segmentos" className="hover:text-white transition">
                  Segmentos atendidos
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-white transition">
                  Perguntas frequentes
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Ações & Recursos
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center gap-1.5 text-amber-400">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>Google Avaliações Direto</span>
              </li>
              <li>
                <Link to="/loja" className="hover:text-white transition flex items-center gap-1">
                  <span>Totens e Displays de Balcão</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/loja" className="hover:text-white transition flex items-center gap-1">
                  <span>Adesivos NFC Resinados</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <a href="/#comparativo" className="hover:text-white transition">
                  Antes e Depois do Balcão
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Acesso ao Painel do Cliente
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Transparência & Dados
            </h4>
            <div className="space-y-2.5 text-xs leading-relaxed text-slate-400">
              <p>
                As avaliações no Google devem ser sempre voluntárias e autênticas. O AvaliaTag simplifica o acesso técnico e não garante posições específicas de ranqueamento.
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-slate-900 text-[10px] font-mono text-slate-300 border border-slate-800">
                  Criptografia SSL
                </span>
                <span className="px-2 py-1 rounded bg-slate-900 text-[10px] font-mono text-slate-300 border border-slate-800">
                  LGPD em Conformidade
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} AvaliaTag. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-[11px] text-slate-500">
              Google e Google Maps são marcas registradas da Google LLC. O AvaliaTag é uma solução independente.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
