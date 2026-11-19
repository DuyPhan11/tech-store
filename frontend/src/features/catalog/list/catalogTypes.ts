export interface CatalogOption {
  id: string
  name: string
  parentId?: string
}

export interface CatalogProduct {
  id: string
  name: string
  slug?: string
  categoryId: string
  categoryName?: string
  brandId: string
  brandName?: string
  priceVnd: number
  image: string
  specification: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export const pageSize = 8
export type CatalogSort = 'default' | 'price-asc' | 'price-desc'

export interface CatalogQuery {
  keyword: string
  category: string
  brand: string
  minPrice?: number
  maxPrice?: number
  sort: CatalogSort
  page: number
}

export interface CatalogPage {
  products: CatalogProduct[]
  total: number
  page: number
}

export type CatalogSource = (query: CatalogQuery, signal: AbortSignal) => Promise<CatalogPage>

export function readQuery(params: URLSearchParams): CatalogQuery {
  const page = Number(params.get('page'))
  const sort = params.get('sort')
  function price(key: string) {
    const raw = params.get(key)
    if (!raw || !/^\d+$/.test(raw)) return undefined
    const value = Number(raw)
    return Number.isSafeInteger(value) ? value : undefined
  }
  return {
    keyword: params.get('q')?.trim() ?? '',
    category: params.get('category') ?? '',
    brand: params.get('brand') ?? '',
    minPrice: price('min'), maxPrice: price('max'),
    sort: sort === 'price-asc' || sort === 'price-desc' ? sort : 'default',
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  }
}

export interface ProductImage {
  id?: string | number
  url: string
  alt: string
  isPrimary?: boolean
  displayOrder?: number
}

export interface ProductDetailSpec {
  label: string
  value: string
}

export interface ProductBranchInventory {
  branchId: number | string
  branchName: string
  branchActive: boolean
  quantity: number
}

export interface ProductDetail {
  id: string
  slug: string
  sku: string
  name: string
  categoryId: string
  categoryName?: string
  brandId: string
  brandName?: string
  priceVnd: number
  status: 'ACTIVE' | 'INACTIVE'
  image: string
  images: ProductImage[]
  specification: string
  specifications: ProductDetailSpec[]
  description: string
  inStock: boolean
  maxBranchQuantity: number
}

export type ProductDetailSource = (slug: string, signal?: AbortSignal) => Promise<ProductDetail>


/** Phản hồi GET /api/categories (danh mục ACTIVE, danh mục tổ tiên cũng ACTIVE). */
export interface PublicCategory {
  id: number
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
  parentId?: number | null
  parentSlug?: string | null
}

/** Phản hồi GET /api/brands (thương hiệu ACTIVE, ADR-018 A6). */
export interface PublicBrand {
  id: number
  name: string
  slug: string
  logoUrl?: string | null
}

/** Chuyển dữ liệu API sang tùy chọn bộ lọc; id = slug vì /api/products lọc theo slug. */
export function toCategoryOptions(list: readonly PublicCategory[]): CatalogOption[] {
  return list.map(c => (c.parentSlug ? { id: c.slug, name: c.name, parentId: c.parentSlug } : { id: c.slug, name: c.name }))
}

export function toBrandOptions(list: readonly PublicBrand[]): CatalogOption[] {
  return list.map(b => ({ id: b.slug, name: b.name }))
}
