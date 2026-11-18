import type { RouteObject } from 'react-router'
import ComponentDemo from './ComponentDemo'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ContentSlot } from '../components/layout/ContentSlot'
import { HomePage } from '../features/catalog/home/HomePage'
import { homeSample } from '../features/catalog/home/homeSample'
import { PublicProductListRoute, PublicProductDetailRoute } from '../features/catalog/list/PublicCatalogRoutes'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { ProtectedRoute, GuestRoute, ForbiddenPage } from '../features/auth/RouteGuard'
import { CartPage } from '../features/cart/CartPage'
import { CheckoutPage } from '../features/checkout/CheckoutPage'
import { CheckoutSuccessPage } from '../features/checkout/CheckoutSuccessPage'
import { UserAccountPage } from '../features/account/UserAccountPage'
import { AboutPage } from '../features/about/AboutPage'
import { ContactPage } from '../features/contact/ContactPage'
import { FaqPage } from '../features/faq/FaqPage'
import { AdminDashboard } from '../features/admin/dashboard/AdminDashboard'
import { AdminProductsPage } from '../features/admin/products/AdminProductsPage'
import { AdminOrdersPage } from '../features/admin/orders/AdminOrdersPage'
import { AdminInventoryPage } from '../features/admin/inventory/AdminInventoryPage'
import { AdminCatalogPage } from '../features/admin/catalog/AdminCatalogPage'
import { AdminCouponsPage } from '../features/admin/coupons/AdminCouponsPage'
import { AdminUsersPage } from '../features/admin/users/AdminUsersPage'
import { AdminStaffPage } from '../features/admin/staff/AdminStaffPage'
import { AdminBranchesPage } from '../features/admin/branches/AdminBranchesPage'
import { AdminReviewsPage } from '../features/admin/reviews/AdminReviewsPage'

export const routes: RouteObject[] = [
  // 1. Customer & Public Pages
  { path: '/', element: <CustomerLayout><HomePage data={homeSample} /></CustomerLayout> },
  { path: '/products', element: <CustomerLayout>
    <PublicProductListRoute />
  </CustomerLayout> },
  { path: '/products/:slug', element: <CustomerLayout>
    <PublicProductDetailRoute />
  </CustomerLayout> },

  // Cart & Checkout
  { path: '/cart', element: <CustomerLayout><CartPage /></CustomerLayout> },
  { path: '/checkout', element: <CustomerLayout><CheckoutPage /></CustomerLayout> },
  { path: '/checkout/success', element: <CustomerLayout><CheckoutSuccessPage /></CustomerLayout> },

  // User Account & Profile
  { path: '/account', element: <CustomerLayout><UserAccountPage /></CustomerLayout> },
  { path: '/profile', element: <CustomerLayout><UserAccountPage /></CustomerLayout> },
  { path: '/orders', element: <CustomerLayout><UserAccountPage /></CustomerLayout> },

  // Auth & Account Recovery
  { path: '/login', element: <GuestRoute><CustomerLayout><LoginPage /></CustomerLayout></GuestRoute> },
  { path: '/register', element: <GuestRoute><CustomerLayout><RegisterPage /></CustomerLayout></GuestRoute> },
  { path: '/forgot-password', element: <GuestRoute><CustomerLayout><ForgotPasswordPage /></CustomerLayout></GuestRoute> },

  // Informational Pages
  { path: '/about', element: <CustomerLayout><AboutPage /></CustomerLayout> },
  { path: '/contact', element: <CustomerLayout><ContactPage /></CustomerLayout> },
  { path: '/faq', element: <CustomerLayout><FaqPage /></CustomerLayout> },
  { path: '/faqs', element: <CustomerLayout><FaqPage /></CustomerLayout> },
  { path: '/terms', element: <CustomerLayout><FaqPage /></CustomerLayout> },

  // Error & Admin
  { path: '/forbidden', element: <CustomerLayout><ForbiddenPage /></CustomerLayout> },
  { path: '/admin', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
      <AdminLayout><AdminDashboard /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/products', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
      <AdminLayout><AdminProductsPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/orders', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
      <AdminLayout><AdminOrdersPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/inventory', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
      <AdminLayout><AdminInventoryPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/catalog', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <AdminLayout><AdminCatalogPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/coupons', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_STAFF']}>
      <AdminLayout><AdminCouponsPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/users', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <AdminLayout><AdminUsersPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/staff', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <AdminLayout><AdminStaffPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/branches', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <AdminLayout><AdminBranchesPage /></AdminLayout>
    </ProtectedRoute>
  ) },
  { path: '/admin/reviews', element: (
    <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
      <AdminLayout><AdminReviewsPage /></AdminLayout>
    </ProtectedRoute>
  ) },

  ...(import.meta.env.DEV ? [{ path: '/__dev/components', element: <ComponentDemo /> }] : []),
]
