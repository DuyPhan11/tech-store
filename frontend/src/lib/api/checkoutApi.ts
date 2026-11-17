import { apiFetch } from './apiClient'
import type { CheckoutRequest, CheckoutResponse } from '../../features/checkout/checkoutTypes'

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
}
