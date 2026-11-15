import type { RouteObject } from 'react-router'
import ComponentDemo from './ComponentDemo'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ContentSlot } from '../components/layout/ContentSlot'

export const routes: RouteObject[] = [
  { path: '/', element: <CustomerLayout><ContentSlot /></CustomerLayout> },
  { path: '/admin', element: <AdminLayout><ContentSlot /></AdminLayout> },
  ...(import.meta.env.DEV ? [{ path: '/__dev/components', element: <ComponentDemo /> }] : []),
]
