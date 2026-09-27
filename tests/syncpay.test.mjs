import test from 'node:test'
import assert from 'node:assert/strict'
import { classifySyncPayTransaction, validSignature } from '../functions/api/syncpay-webhook.ts'

test('transaction.updated does not approve an order unless the transaction status is paid', () => {
  assert.deepEqual(classifySyncPayTransaction('pending', 'transaction.updated'), {
    status: 'pending', paid: false, failed: false, refunded: false,
  })
  assert.equal(classifySyncPayTransaction('completed', 'transaction.updated').paid, true)
  assert.equal(classifySyncPayTransaction('', 'cashin_paid').paid, true)
  assert.equal(classifySyncPayTransaction('refunded', 'transaction.updated').refunded, true)
})

test('validates SyncPay timestamped HMAC and rejects tampering or replay', async () => {
  const raw = JSON.stringify({ event: 'transaction.updated', transaction: { status: 'completed' } })
  const secret = 'test-webhook-secret'
  const timestamp = String(Math.floor(Date.now() / 1000))
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${raw}`))
  const signature = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')

  assert.equal(await validSignature(raw, `t=${timestamp},v1=${signature}`, null, secret), true)
  assert.equal(await validSignature(`${raw} `, `t=${timestamp},v1=${signature}`, null, secret), false)
  assert.equal(await validSignature(raw, `t=${Number(timestamp) - 301},v1=${signature}`, null, secret), false)
  assert.equal(await validSignature(raw, null, `Bearer ${secret}`, secret), true)
})
