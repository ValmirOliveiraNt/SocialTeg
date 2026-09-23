import React, { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Users,
  Radio,
  ShoppingBag,
  Package,
  FileText,
  LogOut,
  ExternalLink,
  Menu,
  X,
  LayoutDashboard,
  CreditCard,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { BrandLogo } from '../../components/BrandLogo'

export const AdminLayout: React.FC = () => {
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navItems = [
    { label: 'Visão Geral Global', path: '/admin', icon: LayoutDashboard },
    { label: 'Gestão de Clientes', path: '/admin/clients', icon: Users },
    { label: 'Assinaturas & Coletas', path: '/admin/subscriptions', icon: CreditCard },
    { label: 'Estoque & Tags NFC', path: '/admin/tags', icon: Radio },
    { label: 'Gestão de Pedidos', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Produtos & Displays', path: '/admin/products', icon: Package },
    { label: 'Logs de Auditoria', path: '/admin/logs', icon: FileText },
  ]

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F4F7FB] flex flex-col selection:bg-blue-600 selection:text-white">
      <div className="bg-[#071A33] text-blue-100 text-xs py-1.5 px-4 flex items-center justify-between border-b border-blue-950">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="font-bold text-white">PAINEL MESTRE DO ADMINISTRADOR (SaaS)</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1">
            <span>Página Inicial</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <aside className="hidden lg:flex w-64 bg-[#0B1F3B] text-slate-300 flex-col p-4 h-full min-h-0 overflow-hidden border-r border-blue-950">
          <div className="flex flex-1 min-h-0 flex-col gap-6">
            <Link to="/admin" className="flex items-center gap-2 px-2 hover:opacity-90 transition">
              <BrandLogo size="md" theme="dark" />
            </Link>

            <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/admin' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#006CFF] text-white font-bold shadow-sm shadow-blue-900/40'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-blue-200 font-bold text-xs">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-blue-300 truncate">admin@avaliatag.com.br</div>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="w-full py-2 px-3 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition flex items-center gap-2 font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-y-auto">
          <header className="lg:hidden bg-[#0B1F3B] text-white p-4 flex items-center justify-between border-b border-blue-950">
            <Link to="/admin">
              <BrandLogo size="sm" theme="dark" />
            </Link>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </header>

          {mobileNavOpen && (
            <div className="lg:hidden bg-[#0B1F3B] text-slate-300 p-4 space-y-2 border-b border-blue-950">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                      isActive ? 'bg-[#006CFF] text-white' : 'text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          )}

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
