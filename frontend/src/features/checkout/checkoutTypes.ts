export interface OrderItemResponse {
  productId: number
  productName: string
  productSku: string
  productImage?: string | null
  unitPrice: number
  quantity: number
  subtotalAmount: number
}

export interface CheckoutResponse {
  orderId: number
  orderCode: string
  status: string
  paymentMethod: string
  paymentStatus: string
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  totalItemsAmount: number
  discountAmount: number
  finalAmount: number
  items: OrderItemResponse[]
}

export interface CheckoutRequest {
  source: 'CART' | 'BUY_NOW'
  selectedCartItemIds?: number[]
  productId?: number
  quantity?: number
  branchId: number
  paymentMethod: 'COD'
  couponCode?: string | null
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  notes?: string | null
  idempotencyKey?: string
}
