import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Tag,
  Building2,
  ShoppingBag,
  CreditCard,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Plus,
  User as UserIcon,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { ActivateTagModal } from '../../components/ActivateTagModal'
import { NFCTag, Business } from '../../types'
import { BrandLogo } from '../../components/BrandLogo'

export const DashboardLayout: React.FC = () => {
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [activateModalOpen, setActivateModalOpen] = useState(false)
  const [businesses, setBusinesses] = useState<Business[]>([])

  useEffect(() => {
    if (!currentUser) return
    api.businesses.getAll(currentUser.id).then((res) => {
      if (Array.isArray(res)) setBusinesses(res)
    }).catch(() => {})
  }, [currentUser])

  const navItems = [
    { label: 'Visão Geral', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Minhas Tags NFC', path: '/dashboard/tags', icon: Tag },
    { label: 'Estabelecimentos', path: '/dashboard/businesses', icon: Building2 },
    { label: 'Meus Pedidos', path: '/dashboard/orders', icon: ShoppingBag },
    { label: 'Meu Plano & Fatura', path: '/dashboard/plans', icon: CreditCard },
  ]

  const handleTagActivated = (tag: NFCTag) => {
    setActivateModalOpen(false)
    navigate(`/dashboard/tags/${tag.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="font-medium">Painel do Cliente • SocialTag SaaS</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1">
            <span>Página Inicial</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="flex-1 flex">
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between p-4 sticky top-0 h-screen">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 px-2 hover:opacity-90 transition">
              <BrandLogo size="md" />
            </Link>

            <button
              onClick={() => setActivateModalOpen(true)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ativar Nova Tag</span>
            </button>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-4 h-4 m-2 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{currentUser?.email}</div>
              </div>
            </div>

            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="w-full py-2 px-3 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition flex items-center gap-2 font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo size="sm" />
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActivateModalOpen(true)}
                className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg"
              >
                + Ativar Tag
              </button>
              <button
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {mobileNavOpen && (
            <div className="lg:hidden bg-white border-b border-slate-200 p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700'
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

      {activateModalOpen && (
        <ActivateTagModal
          businesses={businesses}
          onSuccess={handleTagActivated}
          onClose={() => setActivateModalOpen(false)}
        />
      )}
    </div>
  )
}
