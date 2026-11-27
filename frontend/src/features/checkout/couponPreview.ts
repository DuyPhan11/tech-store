import { ApiError } from '../../lib/api/apiClient'
import type { CouponPreviewRequest, CouponRejectReason } from './checkoutTypes'

/** Nguồn hàng để xem trước mã (ADR-024): toàn bộ dòng giỏ (CART) hoặc một sản phẩm Mua ngay. */
export type CouponItemsInput =
  | { source: 'CART'; cartItemIds: number[] }
  | { source: 'BUY_NOW'; productId: number; quantity: number }

const REASONS: CouponRejectReason[] = [
  'NOT_FOUND', 'DISABLED', 'NOT_STARTED', 'EXPIRED', 'EXHAUSTED', 'MIN_ORDER_NOT_MET', 'ALREADY_USED',
]

/**
 * Tổng thanh toán hiển thị = đúng số server thu (final_amount = tạm tính − giảm giá).
 * Tech Store miễn phí vận chuyển mọi đơn; thuế/VAT đã nằm trong giá bán (ADR-024).
 */
export function orderDisplayTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - Math.max(0, discount))
}

/** Chuẩn hóa như server: trim + UPPERCASE; chuỗi rỗng = không dùng mã. */
export function normalizeCouponCode(raw: string | null | undefined): string {
  return (raw ?? '').trim().toUpperCase()
}

export function buildPreviewRequest(code: string, input: CouponItemsInput): CouponPreviewRequest {
  const couponCode = normalizeCouponCode(code)
  if (input.source === 'CART') {
    return { couponCode, source: 'CART', selectedCartItemIds: input.cartItemIds }
  }
  return { couponCode, source: 'BUY_NOW', productId: input.productId, quantity: input.quantity }
}

/** Lý do mã bị từ chối (errors.reason của 400), null nếu lỗi không phải do mã. */
export function couponRejectReason(err: unknown): CouponRejectReason | null {
  if (!(err instanceof ApiError) || err.status !== 400) return null
  const reason = err.errors?.reason as CouponRejectReason | undefined
  return reason && REASONS.includes(reason) ? reason : null
}

/** Thông báo hiển thị: dùng thông điệp tiếng Việt của server, fallback chung khi lỗi mạng. */
export function couponErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.message) return err.message
  return 'Không thể kiểm tra mã giảm giá. Vui lòng thử lại.'
}
