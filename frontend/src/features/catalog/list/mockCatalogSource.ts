import { products } from './catalogSample'
import { pageSize, type CatalogSource } from './catalogTypes'

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd')
}

export const mockCatalogSource: CatalogSource = async (query, signal) => {
  signal.throwIfAborted()
  const keyword = normalize(query.keyword)
  const matches = products.filter(product =>
    normalize(product.name).includes(keyword) &&
    (!query.category || product.categoryId === query.category) &&
    (!query.brand || product.brandId === query.brand) &&
    (query.minPrice === undefined || product.priceVnd >= query.minPrice) &&
    (query.maxPrice === undefined || product.priceVnd <= query.maxPrice))

  if (query.sort === 'price-asc') matches.sort((a, b) => a.priceVnd - b.priceVnd)
  if (query.sort === 'price-desc') matches.sort((a, b) => b.priceVnd - a.priceVnd)

  const limit = query.size && query.size > 0 ? query.size : pageSize
  const page = Math.min(query.page, Math.max(1, Math.ceil(matches.length / limit)))
  const start = (page - 1) * limit
  return { products: matches.slice(start, start + limit), total: matches.length, page }
}
