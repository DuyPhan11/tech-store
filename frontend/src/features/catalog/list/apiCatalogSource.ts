import { catalogApi } from '../../../lib/api/catalogApi'
import type { CatalogSource } from './catalogTypes'

export const apiCatalogSource: CatalogSource = (query, signal) => {
  return catalogApi.getProducts(query, signal)
}
