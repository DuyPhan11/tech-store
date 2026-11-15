import type { RouteObject } from 'react-router'
import ComponentDemo from './ComponentDemo'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ContentSlot } from '../components/layout/ContentSlot'
import { HomePage } from '../features/catalog/home/HomePage'
import { homeSample } from '../features/catalog/home/homeSample'
import { ProductListPage } from '../features/catalog/list/ProductListPage'
import { categories, brands } from '../features/catalog/list/catalogSample'
import { mockCatalogSource } from '../features/catalog/list/mockCatalogSource'
import { ProductDetailPage } from '../features/catalog/detail/ProductDetailPage'
import { mockProductDetailSource } from '../features/catalog/detail/mockProductDetailSource'

export const routes: RouteObject[] = [
  { path: '/', element: <CustomerLayout><HomePage data={homeSample} /></CustomerLayout> },
  { path: '/products', element: <CustomerLayout>
    <ProductListPage source={mockCatalogSource} categories={categories} brands={brands} />
  </CustomerLayout> },
  { path: '/products/:slug', element: <CustomerLayout>
    <ProductDetailPage source={mockProductDetailSource} categories={categories} brands={brands} />
  </CustomerLayout> },
  { path: '/admin', element: <AdminLayout><ContentSlot /></AdminLayout> },
  ...(import.meta.env.DEV ? [{ path: '/__dev/components', element: <ComponentDemo /> }] : []),
]
