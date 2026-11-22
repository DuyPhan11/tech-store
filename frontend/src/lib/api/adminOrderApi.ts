import { apiFetch } from './apiClient'
import type {
  AdminOrder,
  AdminOrderListQuery,
  AdminOrderPage,
  OrderStatus,
} from '../../features/admin/orders/adminOrderTypes'

/** UC14 — API quản trị đơn hàng (ROLE_STAFF, ADMIN kế thừa; ADR-023). */
export const adminOrderApi = {
  list(query: AdminOrderListQuery = {}, signal?: AbortSignal): Promise<AdminOrderPage> {
    const params = new URLSearchParams()
    if (query.status) params.set('status', query.status)
    const q = query.q?.trim()
    if (q) params.set('q', q)
    if (query.page != null && query.page > 0) params.set('page', String(query.page))
    if (query.size != null) params.set('size', String(query.size))
    const qs = params.toString()
    return apiFetch<AdminOrderPage>(`/admin/orders${qs ? `?${qs}` : ''}`, { signal })
  },

  get(id: number, signal?: AbortSignal): Promise<AdminOrder> {
    return apiFetch<AdminOrder>(`/admin/orders/${id}`, { signal })
  },

  updateStatus(id: number, status: OrderStatus, reason?: string | null): Promise<AdminOrder> {
    return apiFetch<AdminOrder>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason: reason ?? null }),
    })
  },
}
