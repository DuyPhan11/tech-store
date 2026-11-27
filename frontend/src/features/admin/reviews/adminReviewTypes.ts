export type AdminReviewStatus = 'VISIBLE' | 'HIDDEN_BY_OWNER' | 'HIDDEN_BY_ADMIN'

export interface AdminReviewResponse {
  id: number
  productId: number
  productName: string
  productSlug: string
  userId: number
  customerName: string
  customerEmail: string
  orderId: number
  orderCode: string
  rating: number
  comment: string
  status: AdminReviewStatus
  hiddenAt: string | null
  hiddenReason: string | null
  createdAt: string
  updatedAt: string
}
