import { apiFetch } from './apiClient'
import type {
  CheckoutRequest,
  CheckoutResponse,
  CouponPreviewRequest,
  CouponPreviewResponse,
} from '../../features/checkout/checkoutTypes'

export const checkoutApi = {
  /**
   * Đặt hàng và thanh toán (yêu cầu đăng nhập ROLE_CUSTOMER)
   */
  checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
    const headers: Record<string, string> = {}
    if (request.idempotencyKey) {
      headers['Idempotency-Key'] = request.idempotencyKey
    }

    return apiFetch<CheckoutResponse>('/checkout', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    })
  },

  /**
   * Xem trước mã giảm giá (ROLE_CUSTOMER; ADR-022). Không tiêu lượt.
   * Lỗi mã → ApiError 400 với errors.reason. Chưa nối vào CartPage/CheckoutPage (FS16).
   */
  previewCoupon(request: CouponPreviewRequest): Promise<CouponPreviewResponse> {
    return apiFetch<CouponPreviewResponse>('/checkout/coupon-preview', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  },
}
