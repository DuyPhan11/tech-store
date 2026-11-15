import type { ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth, useHasAuthProvider } from './AuthContext'
import { Button } from '../../components/ui/Button'
import styles from './RouteGuard.module.css'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <div className={styles.forbidden} role="region" aria-label="Lỗi quyền truy cập">
      <h1 className={styles.forbiddenTitle}>403 — Không có quyền truy cập</h1>
      <p className={styles.forbiddenDesc}>
        Bạn không có quyền truy cập vào trang này với vai trò hiện tại. Vui lòng đăng nhập với tài khoản có thẩm quyền hoặc quay lại trang chủ.
      </p>
      <div className={styles.forbiddenActions}>
        <Button variant="primary" onClick={() => navigate('/')}>
          Quay lại trang chủ
        </Button>
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = '/login' }: ProtectedRouteProps) {
  const hasProvider = useHasAuthProvider()
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (!hasProvider) {
    return <>{children}</>
  }

  if (isLoading) {
    return <div>Đang xác thực thông tin...</div>
  }

  if (!isAuthenticated) {
    const redirectParam = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${redirectTo}?redirect=${redirectParam}`} replace state={{ from: location }} />
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user?.roles ?? []
    // ROLE_ADMIN has Staff management capability
    const hasSufficientRole = allowedRoles.some(role => {
      if (userRoles.includes(role)) return true
      if (role === 'ROLE_STAFF' && userRoles.includes('ROLE_ADMIN')) return true
      return false
    })

    if (!hasSufficientRole) {
      return <ForbiddenPage />
    }
  }

  return <>{children}</>
}

interface GuestRouteProps {
  children: ReactNode
}

export function GuestRoute({ children }: GuestRouteProps) {
  const hasProvider = useHasAuthProvider()
  const { isAuthenticated, isStaff, isAdmin } = useAuth()
  const location = useLocation()

  if (!hasProvider) {
    return <>{children}</>
  }

  if (isAuthenticated) {
    const searchParams = new URLSearchParams(location.search)
    const redirectParam = searchParams.get('redirect')
    const isTargetAdmin = redirectParam ? redirectParam.startsWith('/admin') : false

    if (redirectParam && !redirectParam.startsWith('/login') && !(isTargetAdmin && !(isAdmin || isStaff))) {
      return <Navigate to={redirectParam} replace />
    }
    const destination = (isAdmin || isStaff) ? '/admin' : '/'
    return <Navigate to={destination} replace />
  }

  return <>{children}</>
}
