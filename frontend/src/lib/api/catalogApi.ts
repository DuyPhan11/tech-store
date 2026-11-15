import { apiFetch } from './apiClient'
import type { CatalogPage, CatalogQuery, ProductDetail } from '../../features/catalog/list/catalogTypes'

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

    const queryString = params.toString()
    const endpoint = queryString ? `/products?${queryString}` : '/products'
    return apiFetch<CatalogPage>(endpoint, { signal })
  },

  getProductBySlug(slug: string, signal?: AbortSignal): Promise<ProductDetail> {
    return apiFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`, { signal })
  },
}
