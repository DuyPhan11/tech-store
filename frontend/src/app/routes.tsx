import type { RouteObject } from 'react-router'
import ComponentDemo from './ComponentDemo'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ContentSlot } from '../components/layout/ContentSlot'
import { HomePage } from '../features/catalog/home/HomePage'
import { homeSample } from '../features/catalog/home/homeSample'
import { ProductListPage } from '../features/catalog/list/ProductListPage'
import { categories, brands } from '../features/catalog/list/catalogSample'
import { apiCatalogSource } from '../features/catalog/list/apiCatalogSource'
import { ProductDetailPage } from '../features/catalog/detail/ProductDetailPage'
import { apiProductDetailSource } from '../features/catalog/detail/apiProductDetailSource'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute, GuestRoute, ForbiddenPage } from '../features/auth/RouteGuard'

export const routes: RouteObject[] = [
  { path: '/', element: <CustomerLayout><HomePage data={homeSample} /></CustomerLayout> },
  { path: '/products', element: <CustomerLayout>
    <ProductListPage source={apiCatalogSource} categories={categories} brands={brands} />
  </CustomerLayout> },
  { path: '/products/:slug', element: <CustomerLayout>
    <ProductDetailPage source={apiProductDetailSource} categories={categories} brands={brands} />
  </CustomerLayout> },
  { path: '/login', element: <GuestRoute><CustomerLayout><LoginPage /></CustomerLayout></GuestRoute> },
  { path: '/forbidden', element: <CustomerLayout><ForbiddenPage /></CustomerLayout> },
  { path: '/admin', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
      <AdminLayout><ContentSlot /></AdminLayout>
    </ProtectedRoute>
  ) },
  ...(import.meta.env.DEV ? [{ path: '/__dev/components', element: <ComponentDemo /> }] : []),
]
