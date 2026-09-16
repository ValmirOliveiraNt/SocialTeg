import { OrderItem } from '../types'
import { api } from './api'

export interface CheckoutPaymentData {
  method: 'pix' | 'credit_card' | 'boleto'
  cardDetails?: {
    cardNumber: string
    holderName: string
    expiry: string
    cvv: string
    installments: number
  }
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
    const user = await api.users.getById(userId)
    if (!user) {
      throw new Error('Usuário não encontrado.')
    }

    const products = await api.products.getAll()
    const orderItems: OrderItem[] = []
    let subtotal = 0

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)
      if (!product) {
        throw new Error(`Produto não encontrado: ${item.productId}`)
      }
      const itemTotal = product.price * item.quantity
      subtotal += itemTotal
      orderItems.push({
        id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        order_id: '',
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: product.price,
        total: itemTotal,
      })
    }

    const shipping = this.calculateShipping(address.zip, items.length)
    const discount = payment.method === 'pix' ? subtotal * 0.05 : 0
    const total = Math.max(0, subtotal - discount + shipping)

    const orderId = 'ORD-' + Date.now().toString().slice(-6)
    orderItems.forEach((it) => (it.order_id = orderId))

    const res = await api.orders.create({
      id: orderId,
      user_id: user.id,
      user_name: user.name,
      user_email: user.email,
      status: 'paid',
      subtotal,
      discount,
      shipping,
      total,
      payment_status: 'approved',
      payment_method: payment.method,
      shipping_address: address,
      items: orderItems,
    })

    await api.logs.add({
      user_id: user.id,
      user_email: user.email,
      action: 'CREATE_ORDER',
      entity_type: 'order',
      entity_id: orderId,
      details: `Pedido ${orderId} concluído com sucesso via ${payment.method.toUpperCase()} no valor de R$ ${total.toFixed(2)}.`,
    })

    return {
      success: true,
      transactionId: 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      orderId: res.orderId || orderId,
      pixQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014br.gov.bcb.pix0136avaliatag-pagamento@banco.com.br520400005303986540' + total.toFixed(2),
      pixCopiaECola: '00020126580014br.gov.bcb.pix0136avaliatag-pagamento@banco.com.br520400005303986540' + total.toFixed(2) + '5802BR5915AVALIATAG6009SAOPAULO62070503***6304ABCD',
      message: 'Pagamento processado com sucesso!',
    }
  }
}
