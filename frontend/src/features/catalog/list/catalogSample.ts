import { categories as dataCategories, brands as dataBrands, catalogProducts } from '../catalogData'
import type { CatalogOption, CatalogProduct } from './catalogTypes'

export const categories: readonly CatalogOption[] = dataCategories
export const brands: readonly CatalogOption[] = dataBrands
export const products: CatalogProduct[] = catalogProducts
