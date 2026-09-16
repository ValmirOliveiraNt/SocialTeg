import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  LayoutDashboard,
  ShieldAlert,
  User as UserIcon,
  LogOut,
  Menu,
  X,
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

  const isPublicPage =
    location.pathname === '/' ||
    location.pathname.startsWith('/loja') ||
    location.pathname.startsWith('/checkout')

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 text-center flex items-center justify-between">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Plataforma SaaS NFC Oficial • Redirecionamento Dinâmico em Nuvem</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400 text-[11px]">
          <span>Garantia de 99.9% Uptime</span>
          <span>•</span>
          <span>Suporte Técnico Especializado</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2 group hover:opacity-95 transition">
              <BrandLogo size="md" />
            </Link>

            {isPublicPage && (
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
                <a href="#como-funciona" className="hover:text-blue-600 transition">
                  Como Funciona
                </a>
                <a href="#recursos" className="hover:text-blue-600 transition">
                  Recursos
                </a>
                <a href="#demonstracao" className="hover:text-blue-600 transition">
                  Demonstração
                </a>
                <a href="#planos" className="hover:text-blue-600 transition">
                  Planos
                </a>
                <a href="#faq" className="hover:text-blue-600 transition">
                  FAQ
                </a>
                <Link to="/loja" className="hover:text-blue-600 transition">
                  Comprar Tags
                </Link>
              </nav>
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/loja"
              className="relative p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
              title="Carrinho de Compras"
            >
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {totalCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition border border-purple-200"
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Painel Admin
                  </Link>
                ) : (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition border border-blue-200"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    Meu Painel
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
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
                    <span className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-medium">
                      {currentUser.role === 'admin' ? 'Administrador' : 'Cliente'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                    title="Sair"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 transition"
                >
                  Entrar
                </Link>
                <Link
                  to="/loja"
                  className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition"
                >
                  Comprar Tag NFC
                </Link>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-3">
            <Link to="/loja" className="relative p-2 text-slate-600">
              <ShoppingBag className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            to="/loja"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-base font-semibold text-slate-800"
          >
            Loja de Tags NFC
          </Link>

          {currentUser ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-semibold text-purple-700"
                >
                  Painel Administrador
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-base font-semibold text-blue-700"
                >
                  Meu Painel de Tags
                </Link>
              )}
              <button
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left py-2 text-sm text-red-600 font-medium"
              >
                Sair da Conta
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center py-2.5 bg-blue-600 text-white font-semibold rounded-lg"
            >
              Fazer Login / Cadastrar
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
