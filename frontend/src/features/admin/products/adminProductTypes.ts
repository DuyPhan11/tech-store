/** UC11 — kiểu dữ liệu quản trị sản phẩm (ADR-019). */

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export interface AdminProductSpec {
  label: string
  value: string
}

export interface AdminProductImage {
  id: number
  url: string
  primary: boolean
  displayOrder: number
}

export interface AdminProduct {
  id: number
  name: string
  slug: string
  sku: string
  categoryId: number
  categoryName: string
  brandId: number
  brandName: string
  price: number
  costPrice: number
  description: string | null
  specifications: AdminProductSpec[]
  status: ProductStatus
  /** Tổng tồn ở chi nhánh ACTIVE — chỉ đọc (điều chỉnh kho thuộc UC18). */
  totalStock: number
  primaryImageUrl: string | null
  images: AdminProductImage[]
  createdAt: string
  updatedAt: string
}

/** Một vị trí ảnh: ảnh cũ giữ lại (`imageId`) hoặc ảnh mới (`fileIndex` trong `files`). */
export type AdminProductImageRef =
  | { imageId: number; primary: boolean }
  | { fileIndex: number; primary: boolean }

/** Part `data` của request multipart tạo/sửa sản phẩm. */
export interface AdminProductPayload {
  name: string
  slug: string
  sku: string
  categoryId: number
  brandId: number
  price: number
  costPrice: number
  description?: string | null
  specifications?: AdminProductSpec[]
  images: AdminProductImageRef[]
}

/** Trùng với `AdminProductRequest.SKU_PATTERN` ở backend. */
export const SKU_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/

export const MAX_PRODUCT_IMAGES = 8
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp']

/** Gợi ý SKU: bỏ dấu, chữ in hoa, chỉ giữ A-Z 0-9 và gạch ngang giữa các cụm. */
export function normalizeSku(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50)
    .replace(/-+$/g, '')
}

/** Kiểm tra phía client trước khi gửi (backend vẫn kiểm tra lại định dạng thật + dung lượng). */
export function validateImageFile(file: { name: string; type: string; size: number }): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Ảnh ${file.name} phải là JPEG, PNG hoặc WebP`
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `Ảnh ${file.name} vượt quá 5MB`
  }
  if (file.size === 0) {
    return `Tệp ${file.name} rỗng`
  }
  return null
}
