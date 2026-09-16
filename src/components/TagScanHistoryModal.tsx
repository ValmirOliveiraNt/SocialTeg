import React, { useMemo } from 'react'
import {
  X,
  Radio,
  QrCode,
  Smartphone,
  MapPin,
  Clock,
  Calendar,
  Download,
  Activity,
} from 'lucide-react'
import { NFCTag, TagScan, TagDestination, Business } from '../types'

interface TagScanHistoryModalProps {
  tag: NFCTag
  scans: TagScan[]
  destination?: TagDestination | null
  business?: Business | null
  onClose: () => void
}

export const TagScanHistoryModal: React.FC<TagScanHistoryModalProps> = ({
  tag,
  scans,
  destination,
  business,
  onClose,
}) => {
  const sortedScans = useMemo(() => {
    return [...scans].sort(
      (a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime()
    )
  }, [scans])

  const nfcCount = useMemo(() => {
    return sortedScans.filter(
      (s) => !s.reading_method?.toLowerCase().includes('qr') && !s.referrer?.toLowerCase().includes('qr')
    ).length
  }, [sortedScans])

  const qrCount = sortedScans.length - nfcCount

  const handleExportCSV = () => {
    const headers = [
      'Data e Hora Local',
      'Método de Leitura',
      'Dispositivo',
      'Sistema Operacional',
      'Navegador',
      'Cidade e Estado',
      'País',
      'Destino',
      'Tag',
      'Serial',
    ]

    const rows = sortedScans.map((s) => [
      `"${s.local_time ? `${s.local_date || ''} ${s.local_time}` : new Date(s.scanned_at).toLocaleString('pt-BR')}"`,
      `"${s.reading_method || (s.referrer?.includes('qr') ? 'QR Code' : 'NFC Aproximação')}"`,
      `"${s.device_type || 'Mobile'}"`,
      `"${s.operating_system || ''}"`,
      `"${s.browser || ''}"`,
      `"${s.region || ''}"`,
      `"${s.country || 'Brasil'}"`,
      `"${s.destination_type || destination?.type || 'google_review'}"`,
      `"${tag.name}"`,
      `"${tag.serial_number}"`,
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `leituras-${tag.public_id}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">{tag.name}</h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tag.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {tag.status === 'active' ? 'Ativa' : 'Pausada'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Serial: <strong className="text-slate-800">{tag.serial_number}</strong> • ID:{' '}
                <strong className="text-slate-800">{tag.public_id}</strong>
                {tag.location && ` • Local: ${tag.location}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sortedScans.length > 0 && (
              <button
                onClick={handleExportCSV}
                title="Exportar Leituras em CSV"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Exportar</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Metric Highlights */}
        <div className="grid grid-cols-3 gap-3 p-6 pb-4 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Total Leituras</span>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{sortedScans.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Aproximações registradas</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>NFC vs QR</span>
            </div>
            <div className="text-sm font-bold text-slate-900 mt-1.5 flex items-center gap-2">
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-xs">
                {nfcCount} NFC
              </span>
              <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 text-xs">
                {qrCount} QR
              </span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Canal de captura</div>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="text-[11px] text-slate-500 font-semibold uppercase flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Última Leitura</span>
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1.5 truncate">
              {sortedScans[0]
                ? sortedScans[0].local_time
                  ? `${sortedScans[0].local_date || ''} ${sortedScans[0].local_time}`
                  : new Date(sortedScans[0].scanned_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                : 'Nenhuma leitura'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">
              {sortedScans[0]?.region || 'Aguardando primeiro toque'}
            </div>
          </div>
        </div>

        {/* Scans List / Timeline */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Histórico Detalhado de Leituras em Tempo Real ({sortedScans.length})
            </h4>
            {business && (
              <span className="text-[11px] text-slate-500 font-medium">
                Estabelecimento: <strong className="text-slate-700">{business.name}</strong>
              </span>
            )}
          </div>

          {sortedScans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <Radio className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Nenhuma leitura registrada ainda</p>
              <p className="text-xs text-slate-400 mt-1">
                Aproxime seu smartphone da Tag NFC ou aponte a câmera para o QR Code para ver o primeiro log.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sortedScans.map((scan, idx) => {
                const isQR =
                  scan.reading_method?.toLowerCase().includes('qr') ||
                  scan.referrer?.toLowerCase().includes('qr')

                const scanDate = new Date(scan.scanned_at)
                const formattedDate =
                  scan.local_date ||
                  scanDate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                const formattedTime =
                  scan.local_time ||
                  scanDate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })

                return (
                  <div
                    key={scan.id || idx}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isQR
                            ? 'bg-purple-50 text-purple-600 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}
                      >
                        {isQR ? <QrCode className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isQR
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isQR ? 'Leitura QR Code' : 'Aproximação NFC'}
                          </span>

                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formattedTime}
                          </span>

                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {formattedDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Smartphone className="w-3 h-3 text-slate-400" />
                            {scan.operating_system || 'Dispositivo'} • {scan.browser || 'Navegador'}
                          </span>

                          {scan.region && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {scan.region}
                            </span>
                          )}

                          {scan.timezone && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              ({scan.timezone})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 flex sm:flex-col justify-between items-center sm:items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Destino</span>
                      <span className="text-xs font-bold text-blue-600 capitalize">
                        {(scan.destination_type || destination?.type || 'google_review').replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 rounded-b-3xl flex items-center justify-between text-xs text-slate-500">
          <span>Telemetria em tempo real com identificação de fuso horário local.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
