/** UC18 — kiểu dữ liệu tồn kho / chuyển kho (ADR-021). */

export type BranchStatus = 'ACTIVE' | 'INACTIVE'
export type AdjustType = 'INBOUND' | 'OUTBOUND' | 'SET'
export type StockLevel = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

export interface InventoryItem {
  inventoryId: number
  productId: number
  productName: string
  sku: string
  branchId: number
  branchName: string
  branchStatus: BranchStatus
  quantity: number
  minStockAlert: number
  updatedAt: string
}

export interface InventoryBranchOption {
  id: number
  name: string
  status: BranchStatus
}

export interface InventoryAdjustPayload {
  productId: number
  branchId: number
  type: AdjustType
  quantity: number
  reason?: string | null
}

export interface InventoryTransferPayload {
  productId: number
  fromBranchId: number
  toBranchId: number
  quantity: number
  reason?: string | null
}

export interface InventoryTransferResult {
  from: InventoryItem
  to: InventoryItem
}

export interface InventoryListQuery {
  branchId?: number | null
  q?: string | null
}

/** Mức tồn hiển thị (ADR-021 mục 7): 0 → Hết hàng, ≤ ngưỡng → Sắp hết, còn lại → Còn hàng. */
export function stockLevel(quantity: number, minStockAlert: number): StockLevel {
  if (quantity <= 0) return 'OUT_OF_STOCK'
  if (quantity <= minStockAlert) return 'LOW_STOCK'
  return 'IN_STOCK'
}

export const ADJUST_TYPE_LABELS: Record<AdjustType, string> = {
  INBOUND: 'Nhập kho (INBOUND)',
  OUTBOUND: 'Xuất kho (OUTBOUND)',
  SET: 'Đặt lại số lượng (SET)',
}
