import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeCouponCode, validateCoupon } from '../functions/_lib/coupons.ts'

const dbWithCoupon = (coupon) => ({
  prepare() {
    return {
      bind() {
        return { first: async () => coupon }
      },
    }
  },
})

const baseCoupon = {
  id: 'coupon-1', code: 'BEMVINDO10', description: '', discount_type: 'percentage', discount_value: 10,
  minimum_order_amount: 0, maximum_discount_amount: null, usage_limit: null, usage_count: 0,
  starts_at: null, expires_at: null, status: 'active',
}

test('normalizes coupon codes and calculates percentage, fixed and capped discounts', async () => {
  assert.equal(normalizeCouponCode(' bem vindo!_10 '), 'BEMVINDO_10')
  assert.equal((await validateCoupon(dbWithCoupon(baseCoupon), 'bemvindo10', 200)).discount, 20)
  assert.equal((await validateCoupon(dbWithCoupon({ ...baseCoupon, discount_type: 'fixed', discount_value: 35 }), 'bemvindo10', 200)).discount, 35)
  assert.equal((await validateCoupon(dbWithCoupon({ ...baseCoupon, discount_value: 50, maximum_discount_amount: 30 }), 'bemvindo10', 200)).discount, 30)
})

test('rejects coupons outside validity, minimum order and usage rules', async () => {
  await assert.rejects(() => validateCoupon(dbWithCoupon({ ...baseCoupon, minimum_order_amount: 300 }), 'BEMVINDO10', 200), /pedido mínimo/)
  await assert.rejects(() => validateCoupon(dbWithCoupon({ ...baseCoupon, usage_limit: 2, usage_count: 2 }), 'BEMVINDO10', 200), /limite/)
  await assert.rejects(() => validateCoupon(dbWithCoupon({ ...baseCoupon, expires_at: '2020-01-01T00:00:00.000Z' }), 'BEMVINDO10', 200), /expirou/)
  await assert.rejects(() => validateCoupon(dbWithCoupon({ ...baseCoupon, starts_at: '2999-01-01T00:00:00.000Z' }), 'BEMVINDO10', 200), /ainda não/)
  await assert.rejects(() => validateCoupon(dbWithCoupon({ ...baseCoupon, status: 'inactive' }), 'BEMVINDO10', 200), /inválido ou inativo/)
})
