import { apiFetch } from './apiClient'
import type {
  AdminProduct,
  AdminProductPayload,
  ProductStatus,
} from '../../features/admin/products/adminProductTypes'

/** Tạo body multipart: part `data` (JSON) + part `files` (ảnh mới, thứ tự = fileIndex). */
export function buildProductFormData(payload: AdminProductPayload, files: readonly Blob[] = []): FormData {
  const form = new FormData()
  form.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  files.forEach((file, index) => {
    const name = file instanceof File ? file.name : `image-${index}`
    form.append('files', file, name)
  })
  return form
}

/** UC11 — API quản trị sản phẩm (ROLE_STAFF, ADMIN kế thừa; ADR-019). Không có DELETE: dùng trạng thái. */
export const adminProductApi = {
  listProducts(signal?: AbortSignal): Promise<AdminProduct[]> {
    return apiFetch<AdminProduct[]>('/admin/products', { signal })
  },

  getProduct(id: number, signal?: AbortSignal): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`/admin/products/${id}`, { signal })
  },

  createProduct(payload: AdminProductPayload, files: readonly Blob[] = []): Promise<AdminProduct> {
    return apiFetch<AdminProduct>('/admin/products', {
      method: 'POST',
      body: buildProductFormData(payload, files),
    })
  },

  updateProduct(id: number, payload: AdminProductPayload, files: readonly Blob[] = []): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`/admin/products/${id}`, {
      method: 'PUT',
      body: buildProductFormData(payload, files),
    })
  },

  updateStatus(id: number, status: ProductStatus): Promise<AdminProduct> {
    return apiFetch<AdminProduct>(`/admin/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },
}
