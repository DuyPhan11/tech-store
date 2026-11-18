import { apiFetch } from './apiClient'
import type {
  AdminBrand,
  AdminBrandPayload,
  AdminCategory,
  AdminCategoryPayload,
  CatalogStatus,
} from '../../features/admin/catalog/adminCatalogTypes'

/** UC12 — API quản trị danh mục / thương hiệu (ROLE_ADMIN, ADR-018). Không có DELETE: dùng trạng thái. */
export const adminCatalogApi = {
  listCategories(signal?: AbortSignal): Promise<AdminCategory[]> {
    return apiFetch<AdminCategory[]>('/admin/categories', { signal })
  },

  createCategory(payload: AdminCategoryPayload): Promise<AdminCategory> {
    return apiFetch<AdminCategory>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateCategory(id: number, payload: AdminCategoryPayload): Promise<AdminCategory> {
    return apiFetch<AdminCategory>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  updateCategoryStatus(id: number, status: CatalogStatus): Promise<AdminCategory> {
    return apiFetch<AdminCategory>(`/admin/categories/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  listBrands(signal?: AbortSignal): Promise<AdminBrand[]> {
    return apiFetch<AdminBrand[]>('/admin/brands', { signal })
  },

  createBrand(payload: AdminBrandPayload): Promise<AdminBrand> {
    return apiFetch<AdminBrand>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  updateBrand(id: number, payload: AdminBrandPayload): Promise<AdminBrand> {
    return apiFetch<AdminBrand>(`/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  updateBrandStatus(id: number, status: CatalogStatus): Promise<AdminBrand> {
    return apiFetch<AdminBrand>(`/admin/brands/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
