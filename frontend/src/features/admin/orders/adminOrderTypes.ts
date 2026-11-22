/** UC14 — kiểu dữ liệu quản trị đơn hàng (ADR-023). */
import type { OrderResponse, OrderStatus, PaymentMethod, PaymentStatus } from '../../orders/orderTypes'

export type { OrderStatus, PaymentMethod, PaymentStatus }

export interface AdminOrderCustomer {
  id: number
  fullName: string
  email: string
  phone: string | null
}

export interface AdminOrderPayment {
  method: PaymentMethod
  status: PaymentStatus
  transactionCode: string | null
  amount: number
  paidAt: string | null
  refundedAt: string | null
}

export interface AdminOrder extends OrderResponse {
  customer: AdminOrderCustomer | null
  payment: AdminOrderPayment | null
}

export type StatusCounts = Record<'ALL' | OrderStatus, number>

export interface AdminOrderPage {
  items: AdminOrder[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  counts: StatusCounts
}

export interface AdminOrderListQuery {
  status?: OrderStatus | null
  q?: string | null
  page?: number
  size?: number
}

export const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED']

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao hàng',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  CANCELLED: 'Đã hủy thanh toán',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thanh toán lỗi',
}

/** Bước tiếp theo hợp lệ (ADR-023 mục 2): bước tiến và có cho hủy hay không. */
export function nextActions(status: OrderStatus): { next: OrderStatus | null; canCancel: boolean } {
  switch (status) {
    case 'PENDING':
      return { next: 'CONFIRMED', canCancel: true }
    case 'CONFIRMED':
      return { next: 'SHIPPING', canCancel: true }
    case 'SHIPPING':
      return { next: 'COMPLETED', canCancel: false }
    default:
      return { next: null, canCancel: false }
  }
}

/** ISO → "22/11/2026 14:05" (giờ server, không đổi múi giờ). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : iso
}

export const CANCEL_REASON_MAX = 500
export const DEFAULT_PAGE_SIZE = 20
