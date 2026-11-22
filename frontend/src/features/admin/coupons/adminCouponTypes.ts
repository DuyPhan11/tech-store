/** UC13 — kiểu dữ liệu quản trị coupon (ADR-022). */

export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT'
export type CouponDisplayStatus = 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'EXHAUSTED' | 'DISABLED'

export interface AdminCoupon {
  id: number
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount: number
  maxDiscountAmount: number | null
  usageLimit: number
  usedCount: number
  startDate: string
  endDate: string
  active: boolean
  displayStatus: CouponDisplayStatus
  createdAt: string
  updatedAt: string
}

export interface CouponPayload {
  code: string
  discountType: DiscountType
  discountValue: number
  minOrderAmount?: number | null
  maxDiscountAmount?: number | null
  usageLimit: number
  startDate: string
  endDate: string
}

export interface CouponListQuery {
  q?: string | null
  status?: CouponDisplayStatus | null
}

export const DISPLAY_STATUS_LABELS: Record<CouponDisplayStatus, string> = {
  ACTIVE: 'Đang hiệu lực',
  SCHEDULED: 'Chưa bắt đầu',
  EXHAUSTED: 'Hết lượt dùng',
  EXPIRED: 'Đã hết hạn',
  DISABLED: 'Đã dừng',
}

export const DISPLAY_STATUSES: CouponDisplayStatus[] = ['ACTIVE', 'SCHEDULED', 'EXHAUSTED', 'EXPIRED', 'DISABLED']

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function formatVnd(amount: number): string {
  return currency.format(amount)
}

/** "Giảm 10% (tối đa 2.000.000 ₫)" hoặc "Giảm 500.000 ₫". */
export function formatDiscount(coupon: Pick<AdminCoupon, 'discountType' | 'discountValue' | 'maxDiscountAmount'>): string {
  if (coupon.discountType === 'PERCENTAGE') {
    const pct = `Giảm ${Number(coupon.discountValue)}%`
    return coupon.maxDiscountAmount != null ? `${pct} (tối đa ${formatVnd(coupon.maxDiscountAmount)})` : pct
  }
  return `Giảm ${formatVnd(coupon.discountValue)}`
}

const pad = (n: number) => String(n).padStart(2, '0')

/** ISO từ server ("2026-12-31T23:59:00") → giá trị cho input datetime-local ("2026-12-31T23:59"). */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso)
  return m ? `${m[1]}T${m[2]}` : ''
}

/** Giá trị datetime-local → ISO gửi server (thêm giây): "2026-12-31T23:59" → "2026-12-31T23:59:00". */
export function localInputToIso(value: string): string {
  if (!value) return ''
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? `${value}:00` : value
}

/** ISO → "31/12/2026 23:59" (giờ server, không đổi múi giờ). */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}` : iso
}

/** Giá trị mặc định cho form tạo mới: bắt đầu ngay, kết thúc sau 30 ngày (giờ máy người dùng). */
export function defaultDateRange(now: Date = new Date()): { startDate: string; endDate: string } {
  const toInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  end.setHours(23, 59, 0, 0)
  return { startDate: toInput(now), endDate: toInput(end) }
}
