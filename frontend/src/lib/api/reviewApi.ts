import { apiFetch } from './apiClient'
import type {
  CreateReviewRequest,
  EligibleReviewOrder,
  ProductReviewsResponse,
  ReviewResponse,
  UpdateReviewRequest,
} from '../../features/reviews/reviewTypes'

export const reviewApi = {
  getProductReviews(productId: number | string, signal?: AbortSignal): Promise<ProductReviewsResponse> {
    return apiFetch<ProductReviewsResponse>(`/products/${productId}/reviews`, { signal })
  },

  getEligibleOrders(productId: number | string): Promise<EligibleReviewOrder[]> {
    return apiFetch<EligibleReviewOrder[]>(`/reviews/eligible?productId=${encodeURIComponent(String(productId))}`)
  },

  getMyReviews(): Promise<ReviewResponse[]> {
    return apiFetch<ReviewResponse[]>('/reviews/me')
  },

  createReview(request: CreateReviewRequest): Promise<ReviewResponse> {
    return apiFetch<ReviewResponse>('/reviews', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },

  updateReview(reviewId: number, request: UpdateReviewRequest): Promise<ReviewResponse> {
    return apiFetch<ReviewResponse>(`/reviews/${reviewId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    })
  },

  hideReview(reviewId: number, reason?: string): Promise<ReviewResponse> {
    return apiFetch<ReviewResponse>(`/reviews/${reviewId}/hide`, {
      method: 'PATCH',
      body: JSON.stringify(reason ? { reason } : {}),
    })
  },
}
