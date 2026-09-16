import React, { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { AuditLog } from '../../types'
import { api } from '../../services/api'

export const AdminLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    api.logs.getAll().then(setLogs).catch(() => {})
  }, [])

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      return (
        l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (l.user_email && l.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })
  }, [logs, searchTerm])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Logs de Auditoria & Segurança
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Histórico imutável de ações administrativas, ativações de tags, pedidos e logins.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por ação, e-mail ou detalhes do log..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Data & Hora</th>
                <th className="py-3.5 px-4">Ação</th>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Entidade / ID</th>
                <th className="py-3.5 px-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Nenhum log registrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {log.user_email || 'Sistema'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                      {log.entity_type} ({log.entity_id})
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
