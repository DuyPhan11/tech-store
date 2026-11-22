import { apiFetch } from './apiClient'
import type {
  AdminBranch,
  AdminBranchPayload,
  BranchStatus,
} from '../../features/admin/branches/adminBranchTypes'

/** UC19 — API quản trị chi nhánh (ROLE_ADMIN, ADR-020). Không có DELETE: dùng trạng thái. */
export const adminBranchApi = {
  listBranches(signal?: AbortSignal): Promise<AdminBranch[]> {
    return apiFetch<AdminBranch[]>('/admin/branches', { signal })
  },

  createBranch(payload: AdminBranchPayload): Promise<AdminBranch> {
    return apiFetch<AdminBranch>('/admin/branches', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateBranch(id: number, payload: AdminBranchPayload): Promise<AdminBranch> {
    return apiFetch<AdminBranch>(`/admin/branches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  updateStatus(id: number, status: BranchStatus): Promise<AdminBranch> {
    return apiFetch<AdminBranch>(`/admin/branches/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
