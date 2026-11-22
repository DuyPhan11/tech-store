import { apiFetch } from './apiClient'
import type { AdminCoupon, CouponListQuery, CouponPayload } from '../../features/admin/coupons/adminCouponTypes'

/** UC13 — API quản trị coupon (ROLE_STAFF, ADMIN kế thừa; ADR-022). Không có DELETE. */
export const adminCouponApi = {
  list(query: CouponListQuery = {}, signal?: AbortSignal): Promise<AdminCoupon[]> {
    const params = new URLSearchParams()
    const q = query.q?.trim()
    if (q) params.set('q', q)
    if (query.status) params.set('status', query.status)
    const qs = params.toString()
    return apiFetch<AdminCoupon[]>(`/admin/coupons${qs ? `?${qs}` : ''}`, { signal })
  },

  get(id: number, signal?: AbortSignal): Promise<AdminCoupon> {
    return apiFetch<AdminCoupon>(`/admin/coupons/${id}`, { signal })
  },

  create(payload: CouponPayload): Promise<AdminCoupon> {
    return apiFetch<AdminCoupon>('/admin/coupons', { method: 'POST', body: JSON.stringify(payload) })
  },

  update(id: number, payload: CouponPayload): Promise<AdminCoupon> {
    return apiFetch<AdminCoupon>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
  },

  setActive(id: number, active: boolean): Promise<AdminCoupon> {
    return apiFetch<AdminCoupon>(`/admin/coupons/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    })
  },
}
