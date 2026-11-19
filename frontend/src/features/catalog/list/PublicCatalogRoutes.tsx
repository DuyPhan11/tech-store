import { ProductListPage } from './ProductListPage'
import { apiCatalogSource } from './apiCatalogSource'
import { useCatalogOptions } from './useCatalogOptions'
import { ProductDetailPage } from '../detail/ProductDetailPage'
import { apiProductDetailSource } from '../detail/apiProductDetailSource'

/** /products: bộ lọc danh mục/thương hiệu lấy từ GET /api/categories và GET /api/brands. */
export function PublicProductListRoute() {
  const { categories, brands } = useCatalogOptions()
  return <ProductListPage source={apiCatalogSource} categories={categories} brands={brands} />
}

/** /products/:slug: tên danh mục/thương hiệu lấy từ API (fallback categoryName/brandName trong DTO). */
export function PublicProductDetailRoute() {
  const { categories, brands } = useCatalogOptions()
  return <ProductDetailPage source={apiProductDetailSource} categories={categories} brands={brands} />
}
