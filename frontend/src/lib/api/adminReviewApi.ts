import { apiFetch } from './apiClient'
import type { AdminReviewResponse, AdminReviewStatus } from '../../features/admin/reviews/adminReviewTypes'

export const adminReviewApi = {
  listReviews(status?: AdminReviewStatus | 'ALL', q?: string): Promise<AdminReviewResponse[]> {
    const params = new URLSearchParams()
    if (status && status !== 'ALL') {
      params.set('status', status)
    }
    if (q && q.trim()) {
      params.set('q', q.trim())
    }
    const qs = params.toString()
    return apiFetch<AdminReviewResponse[]>(`/admin/reviews${qs ? `?${qs}` : ''}`)
  },

  hideReview(reviewId: number, reason: string): Promise<AdminReviewResponse> {
    return apiFetch<AdminReviewResponse>(`/admin/reviews/${reviewId}/hide`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    })
  },
}
