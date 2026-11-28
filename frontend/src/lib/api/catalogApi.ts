import { apiFetch } from './apiClient'
import type { CatalogPage, CatalogQuery, ProductDetail, PublicBrand, PublicCategory } from '../../features/catalog/list/catalogTypes'

export const catalogApi = {
  getProducts(query: CatalogQuery, signal?: AbortSignal): Promise<CatalogPage> {
    const params = new URLSearchParams()
    if (query.keyword) params.set('q', query.keyword.trim())
    if (query.category) params.set('category', query.category)
    if (query.brand) params.set('brand', query.brand)
    if (query.minPrice !== undefined && query.minPrice !== null) params.set('min', String(query.minPrice))
    if (query.maxPrice !== undefined && query.maxPrice !== null) params.set('max', String(query.maxPrice))
    if (query.sort && query.sort !== 'default') params.set('sort', query.sort)
    if (query.page && query.page > 1) params.set('page', String(query.page))
    if (query.size && query.size !== 8) params.set('size', String(query.size))

    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'
    return apiFetch<CatalogPage>(endpoint, { signal })
  },

  getProductBySlug(slug: string, signal?: AbortSignal): Promise<ProductDetail> {
    return apiFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { signal })
  },

  /** Danh mục ACTIVE (dạng phẳng, có parentSlug) cho bộ lọc catalog công khai. */
  getCategories(signal?: AbortSignal): Promise<PublicCategory[]> {
    return apiFetch<PublicCategory[]>('/categories', { signal })
  },

  /** Thương hiệu ACTIVE cho bộ lọc catalog công khai (ADR-018 A6). */
  getBrands(signal?: AbortSignal): Promise<PublicBrand[]> {
    return apiFetch<PublicBrand[]>('/brands', { signal })
  },
}
