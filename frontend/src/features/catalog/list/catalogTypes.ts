export interface CatalogOption {
  id: string
  name: string
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

