/** UC12 — kiểu dữ liệu quản trị danh mục / thương hiệu (ADR-018). */

export type CatalogStatus = 'ACTIVE' | 'INACTIVE'

export interface AdminCategory {
  id: number
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  parentId: number | null
  parentName: string | null
  status: CatalogStatus
  productCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminCategoryPayload {
  name: string
  slug: string
  description?: string | null
  parentId?: number | null
}

export interface AdminBrand {
  id: number
  name: string
  slug: string
  country: string | null
  description: string | null
  logoUrl: string | null
  status: CatalogStatus
  productCount: number
  createdAt: string
  updatedAt: string
}

export interface AdminBrandPayload {
  name: string
  slug: string
  country?: string | null
  description?: string | null
}

/** Trùng với regex backend `CatalogSlug.PATTERN`. */
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Gợi ý slug từ tên tiếng Việt: bỏ dấu, đ → d, chữ thường, nối bằng dấu gạch ngang. */
export function toSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
    .replace(/-+$/g, '')
}
