import { useEffect, useRef, type PropsWithChildren } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../ui/Button'
import { LayoutIcon } from './LayoutIcon'
import { useAuth } from '../../features/auth/AuthContext'
import styles from './Layouts.module.css'

function AdminNavigation() {
  return (
    <nav aria-label="Điều hướng quản trị" className={styles.adminNav}>
      <a href="/admin" aria-current="page"><LayoutIcon name="overview" />Tổng quan</a>
      <span><LayoutIcon name="products" />Sản phẩm</span>
      <span><LayoutIcon name="orders" />Đơn hàng</span>
      <span><LayoutIcon name="inventory" />Kho hàng</span>
      {['Danh mục và thương hiệu', 'Khuyến mãi', 'Người dùng', 'Nhân viên', 'Chi nhánh', 'Kiểm duyệt đánh giá'].map(label =>
        <span key={label} className={styles.subItem}>{label}</span>)}
    </nav>
  )
}

export function AdminLayout({ children }: PropsWithChildren) {
  const menu = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => { if (desktop.matches) menu.current?.close() }
    desktop.addEventListener('change', closeOnDesktop)
    return () => desktop.removeEventListener('change', closeOnDesktop)
  }, [])

  const displayName = user?.fullName || 'Minh Anh'
  const roleLabel = user?.roles.includes('ROLE_ADMIN')
    ? 'Quản trị viên'
    : user?.roles.includes('ROLE_STAFF')
      ? 'Nhân viên'
      : 'Quản trị viên'

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() || 'MA'

  return (
    <div className={styles.admin}>
      <aside className={styles.sidebar}><strong>Tech Store</strong><AdminNavigation /></aside>
      <div className={styles.workspace}>
        <header className={styles.adminHeader}>
          <Button variant="secondary" className={styles.mobileMenu} aria-haspopup="dialog"
            aria-controls="admin-menu" onClick={() => menu.current?.showModal()}>Menu</Button>
          <h1><span className={styles.desktopOnly}>Không gian quản trị</span>
            <span className={styles.mobileOnly}>Quản trị</span></h1>
          <span aria-hidden="true" className={styles.avatar}>{initials}</span>
          <div className={styles.identity}><strong>{displayName}</strong><small>{roleLabel}</small></div>
          <Button
            variant="outline"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            style={{ marginLeft: 'auto' }}
          >
            Đăng xuất
          </Button>
        </header>
        <main className={styles.content}>
          <nav aria-label="Đường dẫn" className={styles.crumb}>Quản trị <span aria-hidden="true">/</span> <span aria-current="page">Tổng quan</span></nav>
          {children}
        </main>
      </div>
      <dialog id="admin-menu" ref={menu} className={styles.drawer} aria-labelledby="menu-title">
        <header><h2 id="menu-title">Quản trị</h2>
          <Button variant="secondary" onClick={() => menu.current?.close()}>Đóng</Button>
        </header>
        <AdminNavigation />
      </dialog>
    </div>
  )
}
