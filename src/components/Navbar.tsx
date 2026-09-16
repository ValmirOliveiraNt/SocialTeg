import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  LayoutDashboard,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Radio,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { BrandLogo } from './BrandLogo'

export const Navbar: React.FC = () => {
  const { currentUser, isAdmin, logout } = useAuth()
  const { totalCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isHomePage = location.pathname === '/'
  const isPublicPage =
    isHomePage ||
    location.pathname.startsWith('/loja') ||
    location.pathname.startsWith('/checkout')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isHomePage && !scrolled
          ? 'bg-white/80 md:bg-white/90 backdrop-blur-md border-b border-slate-200/50'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs'
      }`}
    >
      {/* Barra superior de status oficial */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 text-center flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">
            Plataforma Oficial AvaliaTag • Tags NFC & QR Code Dinâmicos
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-blue-400" />
            NFC NTAG213 Homologado
          </span>
          <span>•</span>
          <span>Sem Mensalidade Obrigatória</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group hover:opacity-95 transition">
              <BrandLogo size="md" />
            </Link>

            {isPublicPage && (
              <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
                <a
                  href="/#como-funciona"
                  className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
                >
                  Como funciona
                </a>
                <a
                  href="/#beneficios"
                  className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
                >
                  Benefícios
                </a>
                <a
                  href="/#google"
                  className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
                >
                  Google
                </a>
                <a
                  href="/#segmentos"
                  className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
                >
                  Para negócios
                </a>
                <a
                  href="/#demonstracao"
                  className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
                >
                  Demonstração
                </a>
                <a
                  href="/#faq"
                  className="hover:text-blue-600 transition-colors py-1 cursor-pointer"
                >
                  Dúvidas
                </a>
                <Link
                  to="/loja"
                  className="text-slate-800 font-semibold hover:text-blue-600 transition-colors py-1"
                >
                  Loja
                </Link>
              </nav>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/loja"
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
              title="Loja / Carrinho de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {totalCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition border border-purple-200"
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Painel Admin
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    Meu Painel
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center border border-slate-300">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[110px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">
                      {currentUser.role === 'admin' ? 'Admin' : 'Cliente'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                    title="Sair"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Entrar
                </Link>
                <a
                  href="/#como-funciona"
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Quero conhecer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
                <Link
                  to="/loja"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 transition"
                >
                  Comprar Tag NFC
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Link to="/loja" className="relative p-2 text-slate-600">
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
              aria-label="Menu de Navegação"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1 pb-3 border-b border-slate-100 text-sm font-medium text-slate-700">
            <a
              href="/#como-funciona"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition"
            >
              Como funciona
            </a>
            <a
              href="/#beneficios"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition"
            >
              Benefícios
            </a>
            <a
              href="/#google"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition"
            >
              Google & Presença Local
            </a>
            <a
              href="/#segmentos"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition"
            >
              Para negócios
            </a>
            <a
              href="/#demonstracao"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition"
            >
              Demonstração interativa
            </a>
            <a
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg hover:bg-slate-50 transition"
            >
              Dúvidas frequentes
            </a>
            <Link
              to="/loja"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 px-3 rounded-lg font-bold text-blue-600 hover:bg-blue-50 transition"
            >
              Loja oficial de Tags NFC
            </Link>
          </nav>

          {currentUser ? (
            <div className="pt-2 space-y-2">
              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 px-3 text-center text-sm font-bold text-purple-700 bg-purple-50 rounded-xl border border-purple-200"
                >
                  Painel Administrador
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full py-2.5 px-3 text-center text-sm font-bold text-blue-700 bg-blue-50 rounded-xl border border-blue-200"
                >
                  Meu Painel de Tags
                </Link>
              )}
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-center py-2 text-xs text-red-600 font-semibold"
              >
                Sair da Conta
              </button>
            </div>
          ) : (
            <div className="pt-2 grid grid-cols-2 gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200"
              >
                Entrar
              </Link>
              <Link
                to="/loja"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20"
              >
                Comprar Tag
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
