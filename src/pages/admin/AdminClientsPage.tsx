import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  Edit2,
  Lock,
  Unlock,
  X,
} from 'lucide-react'
import { User, UserStatus, Business, NFCTag } from '../../types'
import { api } from '../../services/api'

export const AdminClientsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const [users, setUsers] = useState<User[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [tags, setTags] = useState<NFCTag[]>([])

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingPhone, setEditingPhone] = useState('')

  useEffect(() => {
    api.users.getAll().then((list) => {
      setUsers(list.filter((u) => u.role === 'customer'))
    }).catch(() => {})
    api.businesses.getAll().then(setBusinesses).catch(() => {})
    api.tags.getAll().then(setTags).catch(() => {})
  }, [refreshTrigger])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm))

      const matchStatus = statusFilter === 'all' || u.status === statusFilter

      return matchSearch && matchStatus
    })
  }, [users, searchTerm, statusFilter])

  const handleToggleBlock = async (u: User) => {
    const nextStatus: UserStatus = u.status === 'active' ? 'blocked' : 'active'
    try {
      await api.users.update({ id: u.id, status: nextStatus })
      await api.logs.add({
        action: nextStatus === 'blocked' ? 'BLOCK_USER' : 'UNBLOCK_USER',
        entity_type: 'user',
        entity_id: u.id,
        details: `Status do usuário ${u.name} alterado para ${nextStatus}.`,
      })
    } catch {}
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleOpenEdit = (u: User) => {
    setSelectedUser(u)
    setEditingName(u.name)
    setEditingPhone(u.phone || '')
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      await api.users.update({
        id: selectedUser.id,
        name: editingName.trim(),
        phone: editingPhone.trim(),
      })
    } catch {}

    setSelectedUser(null)
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Gestão de Clientes & Contas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Controle de acesso, detalhes e auditoria de usuários do sistema SaaS.
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="all">Todos os Status ({users.length})</option>
            <option value="active">Ativos</option>
            <option value="blocked">Bloqueados</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Estabelecimentos</th>
                <th className="py-3.5 px-4">Tags Vinculadas</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Cadastro</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const userBiz = businesses.filter((b) => b.owner_id === u.id)
                  const userTags = tags.filter((t) => t.owner_id === u.id)

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 font-bold flex items-center justify-center shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {u.email} • {u.phone}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {userBiz.length} local(is)
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                          {userBiz.map((b) => b.name).join(', ') || 'Nenhum'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{userTags.length} tags</span>
                        <div className="text-[10px] text-slate-400">
                          {userTags.filter((t) => t.status === 'active').length} ativas
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            u.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {u.status === 'active' ? 'Ativo' : 'Bloqueado'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-[11px] text-slate-500">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Editar Cliente"
                            className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBlock(u)}
                            title={u.status === 'active' ? 'Bloquear Cliente' : 'Desbloquear'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              u.status === 'active'
                                ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-red-600 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <Lock className="w-4 h-4" />
                            ) : (
                              <Unlock className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 relative">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Editar Dados do Cliente</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase">Nome</label>
                <input
                  type="text"
                  required
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase">E-mail</label>
                <input
                  type="email"
                  disabled
                  value={selectedUser.email}
                  className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 uppercase">Telefone</label>
                <input
                  type="text"
                  value={editingPhone}
                  onChange={(e) => setEditingPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

