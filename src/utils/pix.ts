/**
 * Utilitários para geração de Payload Pix (BR Code / EMV QRCPS-MPM)
 * em conformidade com o padrão oficial do Banco Central do Brasil.
 */

export interface PixPayloadOptions {
  key?: string
  pixKey?: string
  name?: string
  city?: string
  amount?: number | string
  description?: string
  txid?: string
}

export type PixKeyType = 'cpf' | 'cnpj' | 'phone' | 'email' | 'random' | 'copia_e_cola'

function crc16(str: string): string {
  let crc = 0xffff
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff
      } else {
        crc = (crc << 1) & 0xffff
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

export function isPixCopiaECola(value: string | null | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  return trimmed.startsWith('000201') && trimmed.length >= 30
}

export function identifyPixKeyType(value: string | null | undefined): PixKeyType {
  if (!value) return 'random'
  const trimmed = value.trim()
  if (isPixCopiaECola(trimmed)) return 'copia_e_cola'

  const digits = trimmed.replace(/\D/g, '')
  if (trimmed.includes('@')) return 'email'
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) return 'random'
  if (trimmed.startsWith('+') || trimmed.includes('(') || (digits.startsWith('55') && digits.length >= 12)) return 'phone'
  if (digits.length === 14) return 'cnpj'
  if (digits.length === 10) return 'phone'
  if (digits.length === 11) {
    if (trimmed.startsWith('+55') || trimmed.includes('(') || trimmed.includes('-') && trimmed.includes(' ')) return 'phone'
    return 'cpf'
  }
  return 'random'
}

export function formatPixKey(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (isPixCopiaECola(trimmed)) return trimmed

  const digits = trimmed.replace(/\D/g, '')
  const type = identifyPixKeyType(trimmed)

  if (type === 'cpf' && digits.length === 11) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  if (type === 'cnpj' && digits.length === 14) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }
  if (type === 'phone') {
    const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits
    if (local.length === 11) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
    }
    if (local.length === 10) {
      return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
    }
  }

  return trimmed
}

export function generatePixPayload(options: PixPayloadOptions): string {
  const rawKey = (options.key || options.pixKey || '').trim()
  if (!rawKey) return ''

  // Se já for um código Pix Copia e Cola completo
  if (isPixCopiaECola(rawKey)) {
    return rawKey
  }

  // Normalização de telefone para formato internacional com +55 exigido pelo Bacen
  let cleanKey = rawKey
  const digitsOnly = cleanKey.replace(/\D/g, '')
  if (/^\d{10,11}$/.test(digitsOnly) && !cleanKey.includes('@')) {
    cleanKey = `+55${digitsOnly}`
  }

  // Nome do recebedor (max 25 caracteres alfanuméricos sem acentos)
  const cleanName = (options.name || 'RECEBEDOR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, 25)
    .toUpperCase() || 'RECEBEDOR'

  // Cidade do recebedor (max 15 caracteres sem acentos)
  const cleanCity = (options.city || 'BRASIL')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .trim()
    .slice(0, 15)
    .toUpperCase() || 'BRASIL'

  // Merchant Account Information (ID 26)
  const gui = formatEmvField('00', 'br.gov.bcb.pix')
  const pixKey = formatEmvField('01', cleanKey)
  const desc = options.description ? formatEmvField('02', options.description.trim().slice(0, 40)) : ''
  const mai = formatEmvField('26', `${gui}${pixKey}${desc}`)

  let payload =
    formatEmvField('00', '01') + // Payload Format Indicator
    mai + // Merchant Account Information
    formatEmvField('52', '0000') + // Merchant Category Code
    formatEmvField('53', '986') // Transaction Currency (986 = BRL)

  if (options.amount && Number(options.amount) > 0) {
    const formattedAmount = Number(options.amount).toFixed(2)
    payload += formatEmvField('54', formattedAmount)
  }

  payload +=
    formatEmvField('58', 'BR') + // Country Code
    formatEmvField('59', cleanName) + // Merchant Name
    formatEmvField('60', cleanCity) // Merchant City

  // Additional Data Field Template (ID 62)
  const cleanTxid = (options.txid || '***').slice(0, 25)
  const addData = formatEmvField('05', cleanTxid)
  payload += formatEmvField('62', addData)

  // CRC16 Checksum (ID 63)
  const payloadToHash = `${payload}6304`
  const checksum = crc16(payloadToHash)
  return `${payloadToHash}${checksum}`
}
