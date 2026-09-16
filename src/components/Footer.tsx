import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, Star } from 'lucide-react'
import { BrandLogo } from './BrandLogo'

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Link to="/" className="inline-block hover:opacity-90 transition">
              <BrandLogo size="md" theme="dark" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Plataforma SaaS profissional de gerenciamento dinâmico de Tags NFC para estabelecimentos comerciais. Mais avaliações 5 estrelas no Google com um simples toque de smartphone.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/50">
              <ShieldCheck className="w-4 h-4" />
              <span>Chips Originais NTAG213 • 100% Compatível</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition">
                  Início
                </Link>
              </li>
              <li>
                <a href="/#como-funciona" className="hover:text-white transition">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="/#recursos" className="hover:text-white transition">
                  Recursos
                </a>
              </li>
              <li>
                <a href="/#planos" className="hover:text-white transition">
                  Planos e Preços
                </a>
              </li>
              <li>
                <Link to="/loja" className="hover:text-white transition">
                  Loja de Tags NFC
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Ações Suportadas
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Google Avaliações (5 Estrelas)
              </li>
              <li>Instagram & Redes Sociais</li>
              <li>WhatsApp Comercial Inteligente</li>
              <li>Cardápio Digital & Wi-Fi</li>
              <li>Página Intermediária Personalizada</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Segurança & Garantia
            </h4>
            <div className="space-y-3 text-xs">
              <p className="leading-relaxed">
                As tags não precisam ser regravadas fisicamente quando você altera seu destino. O redirecionamento dinâmico é controlado pelo painel na nuvem com 99.9% de uptime.
              </p>
              <div className="pt-2 flex items-center gap-3">
                <span className="px-2 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                  SSL 256-bit
                </span>
                <span className="px-2 py-1 rounded bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                  LGPD Compliant
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SocialTag SaaS. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              Desenvolvido com tecnologia NFC Dinâmica
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
