export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'

export type PaymentMethod = 'COD' | 'ONLINE_MOCK'

export type PaymentStatus = 'UNPAID' | 'PAID' | 'CANCELLED' | 'REFUNDED' | 'FAILED'

export interface OrderItemDto {
  id: number
  productId: number
  productName: string
  productSku: string
  productImage?: string
  unitPrice: number
  quantity: number
  subtotalAmount: number
}

export interface OrderResponse {
  id: number
  orderCode: string
  status: OrderStatus
  statusLabel: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentStatusLabel: string
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  branchId?: number
  branchName?: string
  totalItemsAmount: number
  discountAmount: number
  finalAmount: number
  notes?: string
  cancelReason?: string
  cancelledAt?: string
  canCancel: boolean
  itemSummary?: string
  items: OrderItemDto[]
  createdAt: string
  updatedAt: string
}

export interface CancelOrderRequest {
  cancelReason: string
}
