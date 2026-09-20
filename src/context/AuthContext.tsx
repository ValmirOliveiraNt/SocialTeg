import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, UserRole } from '../types'
import { api } from '../services/api'

interface AuthContextType {
  currentUser: User | null
  token: string | null
  isRestoringSession: boolean
  isAdmin: boolean
  isCustomer: boolean
  login: (email: string, password?: string) => Promise<{ success: boolean; role?: UserRole; error?: string }>
  loginAs: (role: UserRole) => void
  register: (name: string, email: string, phone: string, password: string) => Promise<{ user: User | null; error?: string }>
  logout: () => Promise<void>
  updateProfile: (data: Partial<User>) => void
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = 'avaliatag_session_token'

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [isRestoringSession, setIsRestoringSession] = useState(true)

  useEffect(() => {
    async function checkCurrentSession() {
      const savedToken = localStorage.getItem(TOKEN_KEY)
      if (!savedToken) {
        setIsRestoringSession(false)
        return
      }
      try {
        // The server remains the source of truth. Do not trust a locally stored
        // token until it has been checked for expiry, revocation and account status.
        const res = await api.auth.getMe()
        if (res.user) setCurrentUser(res.user)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setCurrentUser(null)
      } finally {
        setIsRestoringSession(false)
      }
    }

    checkCurrentSession()
  }, [])

  const refreshUser = async () => {
    if (!token) return
    try {
      const res = await api.auth.getMe()
      if (res.user) {
        setCurrentUser(res.user)
      }
    } catch {}
  }

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    try {
      const data = await api.auth.login(email, password)
      if (data.user && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token)
        setToken(data.token)
        setCurrentUser(data.user)
        return { success: true, role: data.user.role }
      }
      return { success: false, error: 'Credenciais inválidas' }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao conectar ao servidor' }
    }
  }

  const loginAs = (_role: UserRole) => {}

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ user: User | null; error?: string }> => {
    try {
      const data = await api.auth.register(name, email, phone, password)
      if (data.user && data.token) {
        localStorage.setItem(TOKEN_KEY, data.token)
        setToken(data.token)
        setCurrentUser(data.user)
        return { user: data.user }
      }
      return { user: null, error: 'Erro ao registrar usuário' }
    } catch (err: any) {
      return { user: null, error: err.message || 'Erro ao registrar' }
    }
  }

  const logout = async () => {
    try {
      await api.auth.logout()
    } catch {}
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setCurrentUser(null)
  }

  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser) return
    const updated = { ...currentUser, ...data, updated_at: new Date().toISOString() }

    try {
      const saved = await api.users.update(updated)
      setCurrentUser(saved)
    } catch {
      setCurrentUser(updated)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isRestoringSession,
        isAdmin: currentUser?.role === 'admin',
        isCustomer: currentUser?.role === 'customer',
        login,
        loginAs,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

