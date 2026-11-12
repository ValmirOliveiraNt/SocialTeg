import test from 'node:test'
import assert from 'node:assert/strict'
import {
  isPixCopiaECola,
  identifyPixKeyType,
  formatPixKey,
  generatePixPayload,
} from '../src/utils/pix.ts'

test('detects pix copia e cola BR Code format', () => {
  const brCode = '00020126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5913LOJA EXEMPLO6009SAO PAULO62070503***6304E2CA'
  assert.equal(isPixCopiaECola(brCode), true)
  assert.equal(isPixCopiaECola('11999999999'), false)
  assert.equal(isPixCopiaECola('usuario@email.com'), false)
})

test('identifies pix key types', () => {
  assert.equal(identifyPixKeyType('123.456.789-00'), 'cpf')
  assert.equal(identifyPixKeyType('12345678900'), 'cpf')
  assert.equal(identifyPixKeyType('12.345.678/0001-90'), 'cnpj')
  assert.equal(identifyPixKeyType('12345678000190'), 'cnpj')
  assert.equal(identifyPixKeyType('contato@avaliatag.com.br'), 'email')
  assert.equal(identifyPixKeyType('+5511999998888'), 'phone')
  assert.equal(identifyPixKeyType('(84) 99999-8888'), 'phone')
  assert.equal(identifyPixKeyType('123e4567-e89b-12d3-a456-426614174000'), 'random')
  assert.equal(identifyPixKeyType('00020101021126360014br.gov.bcb.pix...'), 'copia_e_cola')
})

test('formats pix keys for display', () => {
  assert.equal(formatPixKey('12345678900'), '123.456.789-00')
  assert.equal(formatPixKey('12345678000190'), '12.345.678/0001-90')
  assert.equal(formatPixKey('+5584999998888'), '(84) 99999-8888')
})

test('generates valid EMV BR Code payload with CRC16 checksum', () => {
  const payload = generatePixPayload({
    pixKey: 'contato@avaliatag.com.br',
    name: 'AvaliaTag',
    city: 'Parnamirim',
    description: 'Comanda 12',
  })

  assert.ok(payload.startsWith('000201'))
  assert.ok(payload.includes('0014br.gov.bcb.pix'))
  assert.ok(payload.includes('contato@avaliatag.com.br'))
  assert.ok(payload.includes('AVALIATAG'))
  assert.ok(payload.includes('PARNAMIRIM'))
  assert.ok(payload.includes('6304'))

  // Preserves existing copia e cola payload unchanged
  const existingPayload = '00020126360014br.gov.bcb.pix0114+55119999999995204000053039865802BR5913LOJA EXEMPLO6009SAO PAULO62070503***6304E2CA'
  assert.equal(generatePixPayload({ pixKey: existingPayload }), existingPayload)
})
