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
  paymentMethod: 'COD' | 'ONLINE_MOCK'
  mockPaymentSuccess?: boolean
  couponCode?: string | null
  recipientName: string
  recipientPhone: string
  shippingAddress: string
  notes?: string | null
  idempotencyKey?: string
}

/** POST /api/checkout/coupon-preview (UC07/UC13, ADR-022). */
export interface CouponPreviewRequest {
  couponCode: string
  source: 'CART' | 'BUY_NOW'
  selectedCartItemIds?: number[]
  productId?: number
  quantity?: number
}

export interface CouponPreviewResponse {
  couponCode: string
  subtotal: number
  discountAmount: number
  finalAmount: number
}

/** errors.reason khi mã không áp dụng được (400). */
export type CouponRejectReason =
  | 'NOT_FOUND'
  | 'DISABLED'
  | 'NOT_STARTED'
  | 'EXPIRED'
  | 'EXHAUSTED'
  | 'MIN_ORDER_NOT_MET'
  | 'ALREADY_USED'
