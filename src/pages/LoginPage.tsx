import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, User as UserIcon, Phone, ArrowRight, Lock } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { Footer } from '../components/Footer'
import { useAuth } from '../context/AuthContext'

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isRegister) {
      if (!name || !email || !password) {
        setError('Preencha os campos obrigatórios')
        return
      }
      const res = await register(name, email, phone, password)
      if (res.user) {
        navigate('/dashboard')
      } else {
        setError(res.error || 'Erro ao cadastrar usuário.')
      }
    } else {
      const res = await login(email, password)
      if (res.success) {
        if (email.toLowerCase().includes('admin')) {
          navigate('/admin')
        } else {
          navigate('/dashboard')
        }
      } else {
        setError(res.error || 'E-mail ou senha incorretos.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
          <div className="text-center mb-8">
            <img src="/brand/logo-horizontal-color-600.png" alt="AvaliaTag" className="h-16 w-auto mx-auto mb-3 object-contain" />
            <h1 className="text-2xl font-black text-slate-900">
              {isRegister ? 'Criar Conta AvaliaTag' : 'Acesse seu Painel AvaliaTag'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {isRegister
                ? 'Comece a gerenciar suas Tags NFC e avaliações'
                : 'Gerencie suas Tags NFC, links e métricas'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  Nome Completo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome ou Razão Social"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@empresa.com.br"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                  WhatsApp / Celular
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isRegister ? 'Cadastrar e Acessar' : 'Entrar no Painel'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister)
                setError(null)
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
            >
              {isRegister
                ? 'Já possui uma conta cadastrada? Faça login'
                : 'Primeira vez aqui? Crie sua conta'}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
