import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
  Edit2,
  Plus,
  Building2,
  Trash2,
  SlidersHorizontal,
  AlertCircle,
  Lock,
  Unlock,
  X,
} from 'lucide-react'
import { User, UserStatus, Business, NFCTag } from '../../types'
import { api } from '../../services/api'
import { BusinessExperienceModal } from '../../components/BusinessExperienceModal'

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
  const [businessManagerUser, setBusinessManagerUser] = useState<User | null>(null)
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null)
  const [businessFormOpen, setBusinessFormOpen] = useState(false)
  const [businessSaving, setBusinessSaving] = useState(false)
  const [businessError, setBusinessError] = useState('')
  const [configBusiness, setConfigBusiness] = useState<Business | null>(null)
  const [businessForm, setBusinessForm] = useState({
    name: '', description: '', phone: '', email: '', website: '', address: '', city: '', state: '',
  })

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

  const openBusinessForm = (business?: Business) => {
    setEditingBusiness(business || null)
    setBusinessError('')
    setBusinessForm({
      name: business?.name || '', description: business?.description || '', phone: business?.phone || '',
      email: business?.email || businessManagerUser?.email || '', website: business?.website || '',
      address: business?.address || '', city: business?.city || '', state: business?.state || '',
    })
    setBusinessFormOpen(true)
  }

  const handleSaveBusiness = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!businessManagerUser) return
    setBusinessSaving(true)
    setBusinessError('')
    try {
      await api.businesses.save({
        id: editingBusiness?.id,
        owner_id: businessManagerUser.id,
        ...businessForm,
        name: businessForm.name.trim(),
        description: businessForm.description.trim(),
        phone: businessForm.phone.trim(),
        email: businessForm.email.trim(),
        website: businessForm.website.trim(),
        address: businessForm.address.trim(),
        city: businessForm.city.trim(),
        state: businessForm.state.trim().toUpperCase(),
        country: editingBusiness?.country || 'Brasil',
      })
      setBusinessFormOpen(false)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      setBusinessError(err instanceof Error ? err.message : 'Não foi possível salvar o estabelecimento.')
    } finally {
      setBusinessSaving(false)
    }
  }

  const handleDeleteBusiness = async (business: Business) => {
    if (!confirm(`Excluir o estabelecimento “${business.name}”? As tags vinculadas serão desvinculadas, mas não serão apagadas.`)) return
    try {
      await api.businesses.delete(business.id)
      setRefreshTrigger((prev) => prev + 1)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Não foi possível excluir o estabelecimento.')
    }
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
                            onClick={() => setBusinessManagerUser(u)}
                            title="Gerenciar estabelecimentos"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          >
                            <Building2 className="w-4 h-4" />
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

      {businessManagerUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="business-manager-title" className="mx-auto my-4 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Conta de {businessManagerUser.name}</p>
                <h2 id="business-manager-title" className="mt-1 text-lg font-bold text-slate-900">Estabelecimentos do cliente</h2>
                <p className="mt-1 text-xs text-slate-500">Cadastre, altere os dados ou configure a experiência das tags sem acessar a conta do cliente.</p>
              </div>
              <button type="button" aria-label="Fechar gerenciamento de estabelecimentos" onClick={() => setBusinessManagerUser(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => openBusinessForm()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700">
                <Plus className="h-4 w-4" /> Adicionar estabelecimento
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {businesses.filter((business) => business.owner_id === businessManagerUser.id).map((business) => {
                const tagCount = tags.filter((tag) => tag.business_id === business.id).length
                return (
                  <article key={business.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-slate-900">{business.name}</h3>
                        <p className="mt-1 text-xs text-slate-500">{[business.address, business.city, business.state].filter(Boolean).join(' · ') || 'Endereço não informado'}</p>
                        <p className="mt-1 text-[11px] font-medium text-slate-400">{tagCount} tag{tagCount === 1 ? '' : 's'} vinculada{tagCount === 1 ? '' : 's'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setConfigBusiness(business)} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                          <SlidersHorizontal className="h-3.5 w-3.5" /> Configurar
                        </button>
                        <button type="button" onClick={() => openBusinessForm(business)} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200">
                          <Edit2 className="h-3.5 w-3.5" /> Editar
                        </button>
                        <button type="button" onClick={() => void handleDeleteBusiness(business)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
              {!businesses.some((business) => business.owner_id === businessManagerUser.id) && (
                <div className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-xs text-slate-500">Este cliente ainda não possui estabelecimentos cadastrados.</div>
              )}
            </div>
          </section>
        </div>
      )}

      {businessFormOpen && businessManagerUser && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-xs">
          <section role="dialog" aria-modal="true" aria-labelledby="business-form-title" className="mx-auto my-4 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="business-form-title" className="text-lg font-bold text-slate-900">{editingBusiness ? 'Editar estabelecimento' : 'Novo estabelecimento'}</h2><p className="mt-1 text-xs text-slate-500">Este cadastro ficará vinculado a {businessManagerUser.name}.</p></div>
              <button type="button" aria-label="Fechar formulário" onClick={() => setBusinessFormOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {businessError && <div role="alert" className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{businessError}</div>}
            <form onSubmit={handleSaveBusiness} className="mt-5 space-y-4 text-xs">
              <label className="block font-semibold text-slate-700">Nome do estabelecimento *<input required value={businessForm.name} onChange={(event) => setBusinessForm((current) => ({ ...current, name: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
              <label className="block font-semibold text-slate-700">Descrição<input value={businessForm.description} onChange={(event) => setBusinessForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block font-semibold text-slate-700">Telefone<input value={businessForm.phone} onChange={(event) => setBusinessForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
                <label className="block font-semibold text-slate-700">E-mail<input type="email" value={businessForm.email} onChange={(event) => setBusinessForm((current) => ({ ...current, email: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
              </div>
              <label className="block font-semibold text-slate-700">Site<input type="url" value={businessForm.website} onChange={(event) => setBusinessForm((current) => ({ ...current, website: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
              <label className="block font-semibold text-slate-700">Endereço *<input required value={businessForm.address} onChange={(event) => setBusinessForm((current) => ({ ...current, address: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">Cidade *<input required value={businessForm.city} onChange={(event) => setBusinessForm((current) => ({ ...current, city: event.target.value }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal focus:bg-white focus:outline-hidden" /></label>
                <label className="block font-semibold text-slate-700">UF *<input required maxLength={2} value={businessForm.state} onChange={(event) => setBusinessForm((current) => ({ ...current, state: event.target.value.toUpperCase() }))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 font-normal uppercase focus:bg-white focus:outline-hidden" /></label>
              </div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setBusinessFormOpen(false)} className="rounded-xl px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-100">Cancelar</button><button type="submit" disabled={businessSaving} className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700 disabled:opacity-60">{businessSaving ? 'Salvando...' : 'Salvar estabelecimento'}</button></div>
            </form>
          </section>
        </div>
      )}

      {configBusiness && (
        <BusinessExperienceModal business={configBusiness} onClose={() => setConfigBusiness(null)} onSaved={() => { setConfigBusiness(null); setRefreshTrigger((prev) => prev + 1) }} />
      )}
    </div>
  )
}

