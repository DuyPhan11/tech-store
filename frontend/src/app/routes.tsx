import type { RouteObject } from 'react-router'
import ComponentDemo from './ComponentDemo'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { AdminLayout } from '../components/layout/AdminLayout'
import { ContentSlot } from '../components/layout/ContentSlot'
import { HomePage } from '../features/catalog/home/HomePage'
import { homeSample } from '../features/catalog/home/homeSample'

export const routes: RouteObject[] = [
  { path: '/', element: <CustomerLayout><HomePage data={homeSample} /></CustomerLayout> },
  { path: '/admin', element: <AdminLayout><ContentSlot /></AdminLayout> },
  ...(import.meta.env.DEV ? [{ path: '/__dev/components', element: <ComponentDemo /> }] : []),
]
