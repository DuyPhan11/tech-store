import { catalogApi } from '../../../lib/api/catalogApi'
import type { ProductDetailSource } from '../list/catalogTypes'

export const apiProductDetailSource: ProductDetailSource = (slug, signal) => {
  return catalogApi.getProductBySlug(slug, signal)
}
