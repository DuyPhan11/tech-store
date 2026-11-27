export type ReviewStatus = 'VISIBLE' | 'HIDDEN_BY_OWNER' | 'HIDDEN_BY_ADMIN'

export interface ReviewResponse {
  id: number
  userId: number
  authorName: string
  productId: number
  productName: string
  productSlug: string
  orderId: number
  orderCode: string
  rating: number
  comment: string
  status: ReviewStatus
  hiddenAt: string | null
  hiddenReason: string | null
  createdAt: string
  updatedAt: string
}

export interface ProductReviewsResponse {
  productId: number
  averageRating: number
  totalReviews: number
  reviews: ReviewResponse[]
}

export interface EligibleReviewOrder {
  orderId: number
  orderCode: string
  completedAt: string
}

export interface CreateReviewRequest {
  productId: number
  orderId: number
  rating: number
  comment: string
}

export interface UpdateReviewRequest {
  rating: number
  comment: string
}
