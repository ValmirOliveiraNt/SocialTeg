import { api } from './api'

export interface CheckoutPaymentData {
  method: 'pix'
  document: string
  phone: string
  couponCode?: string
}

export interface PaymentProcessResult {
  success: boolean
  transactionId: string
  orderId: string
  pixQrCode?: string
  pixCopiaECola?: string
  message: string
}

export interface ShippingAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zip: string
}

export const PaymentGatewayService = {
  calculateShipping(zipCode: string, _itemsCount: number): number {
    const cleanZip = zipCode.replace(/\D/g, '')
    if (cleanZip.length < 8) return 19.9
    if (cleanZip.startsWith('0') || cleanZip.startsWith('1')) {
      return 0
    }
    return 19.9
  },

  async processCheckout(
    userId: string,
    items: { productId: string; quantity: number }[],
    address: ShippingAddress,
    payment: CheckoutPaymentData
  ): Promise<PaymentProcessResult> {
    const res = await api.orders.create({
      payment_method: 'pix',
      document: payment.document,
      phone: payment.phone,
      coupon_code: payment.couponCode || undefined,
      shipping_address: address,
      items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
    })

    await api.logs.add({
      user_id: userId,
      action: 'CREATE_PIX_ORDER',
      entity_type: 'order',
      entity_id: res.orderId,
      details: `Pedido ${res.orderId} criado e aguardando confirmação do Pix pela SyncPay no valor de R$ ${Number(res.total).toFixed(2)}.`,
    })

    return {
      success: true,
      transactionId: res.provider_transaction_id,
      orderId: res.orderId,
      pixCopiaECola: res.pix_code,
      message: 'Cobrança Pix criada. Aguardando pagamento.',
    }
  }
}
