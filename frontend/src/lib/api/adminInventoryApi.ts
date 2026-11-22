import { apiFetch } from './apiClient'
import type {
  InventoryAdjustPayload,
  InventoryBranchOption,
  InventoryItem,
  InventoryListQuery,
  InventoryTransferPayload,
  InventoryTransferResult,
} from '../../features/admin/inventory/adminInventoryTypes'

/** UC18 — API tồn kho / chuyển kho (ROLE_STAFF, ADMIN kế thừa; ADR-021). */
export const adminInventoryApi = {
  listInventories(query: InventoryListQuery = {}, signal?: AbortSignal): Promise<InventoryItem[]> {
    const params = new URLSearchParams()
    if (query.branchId != null) params.set('branchId', String(query.branchId))
    const q = query.q?.trim()
    if (q) params.set('q', q)
    const qs = params.toString()
    return apiFetch<InventoryItem[]>(`/admin/inventories${qs ? `?${qs}` : ''}`, { signal })
  },

  listBranches(signal?: AbortSignal): Promise<InventoryBranchOption[]> {
    return apiFetch<InventoryBranchOption[]>('/admin/inventories/branches', { signal })
  },

  adjust(payload: InventoryAdjustPayload): Promise<InventoryItem> {
    return apiFetch<InventoryItem>('/admin/inventories/adjust', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  transfer(payload: InventoryTransferPayload): Promise<InventoryTransferResult> {
    return apiFetch<InventoryTransferResult>('/admin/inventories/transfer', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
