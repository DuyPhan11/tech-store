import { apiFetch } from './apiClient'
import type { OrderResponse, CancelOrderRequest } from '../../features/orders/orderTypes'

export const orderApi = {
  /**
   * Lấy danh sách lịch sử đơn hàng của người dùng hiện tại
   */
  getMyOrders(): Promise<OrderResponse[]> {
    return apiFetch<OrderResponse[]>('/orders/me')
  },

  /**
   * Xem chi tiết một đơn hàng theo ID
   */
  getOrderDetail(id: number): Promise<OrderResponse> {
    return apiFetch<OrderResponse>(`/orders/me/${id}`)
  },

  /**
   * Hủy đơn hàng kèm lý do
   */
  cancelOrder(id: number, cancelReason: string): Promise<OrderResponse> {
    const payload: CancelOrderRequest = { cancelReason }
    return apiFetch<OrderResponse>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
