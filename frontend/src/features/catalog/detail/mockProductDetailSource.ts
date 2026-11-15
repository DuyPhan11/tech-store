import { productDetailsMap } from '../catalogData'
import type { ProductDetailSource } from '../list/catalogTypes'

export class ProductNotFoundError extends Error {
  constructor(slug: string) {
    super(`Không tìm thấy sản phẩm hoặc sản phẩm không khả dụng: ${slug}`)
    this.name = 'ProductNotFoundError'
  }
}

export const mockProductDetailSource: ProductDetailSource = async (slug, signal) => {
  signal?.throwIfAborted()

  const product = productDetailsMap.get(slug)
  if (!product || product.status !== 'ACTIVE') {
    throw new ProductNotFoundError(slug)
  }

  return product
}
