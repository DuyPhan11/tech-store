import { ApiError } from '../../lib/api/apiClient'
import type { OrderResponse } from '../orders/orderTypes'

export interface CancelRecoveryDeps {
  getMyOrders: () => Promise<OrderResponse[]>
  getOrderDetail: (id: number) => Promise<OrderResponse>
}

export interface CancelRecoveryResult {
  message: string
  /** Danh sách đơn mới nhất; null nếu không tải lại được. */
  orders: OrderResponse[] | null
  /** Chi tiết mới nhất của đơn vừa hủy thất bại; null nếu không tải được. */
  detail: OrderResponse | null
}

/**
 * Khách hủy đơn thất bại (vd. cửa hàng vừa xác nhận / hủy đơn — UC14) → tải lại danh sách và chi tiết
 * để màn hình hiện đúng trạng thái thật, kèm thông báo dễ hiểu. Không đổi hành vi API UC08.
 */
export async function recoverAfterCancelFailure(
  err: unknown,
  orderId: number,
  deps: CancelRecoveryDeps,
): Promise<CancelRecoveryResult> {
  const [ordersResult, detailResult] = await Promise.allSettled([deps.getMyOrders(), deps.getOrderDetail(orderId)])
  const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : null
  const detail = detailResult.status === 'fulfilled' ? detailResult.value : null

  const reason = err instanceof Error && err.message ? err.message : 'Không thể hủy đơn hàng'
  const stateChanged = err instanceof ApiError && (err.status === 400 || err.status === 404 || err.status === 409)
  let message = reason
  if (stateChanged) {
    const current = detail ? ` Trạng thái hiện tại: ${detail.statusLabel}.` : ''
    message = `Không thể hủy: đơn hàng vừa được cửa hàng cập nhật.${current} ${reason}`
  }
  if (orders) message += ' Danh sách đơn hàng đã được làm mới.'
  return { message, orders, detail }
}
