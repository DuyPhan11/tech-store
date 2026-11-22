/** UC19 — kiểu dữ liệu quản trị chi nhánh (ADR-020). */

export type BranchStatus = 'ACTIVE' | 'INACTIVE'

export interface AdminBranch {
  id: number
  name: string
  phone: string | null
  address: string
  status: BranchStatus
  createdAt: string
  updatedAt: string
}

export interface AdminBranchPayload {
  name: string
  phone?: string | null
  address: string
}

/** Trùng với `AdminBranchRequest.PHONE_PATTERN` ở backend. */
export const PHONE_PATTERN = /^[0-9+() .-]{8,20}$/

/**
 * "Tỉnh / Thành phố" hiển thị trên bảng: phần sau dấu phẩy cuối của địa chỉ (ADR-020 mục 1).
 * Không có dấu phẩy hoặc phần đó rỗng → "—". DB/API không có cột riêng.
 */
export function extractCity(address: string | null | undefined): string {
  if (!address) return '—'
  const index = address.lastIndexOf(',')
  if (index < 0) return '—'
  const city = address.slice(index + 1).trim()
  return city || '—'
}
