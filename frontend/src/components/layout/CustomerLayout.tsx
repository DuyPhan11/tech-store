import type { PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Input } from '../ui/Input'
import { LayoutIcon } from './LayoutIcon'
import { useAuth } from '../../features/auth/AuthContext'
import styles from './Layouts.module.css'

export function CustomerLayout({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const currentSearch = new URLSearchParams(location.search).get('q') ?? ''

  return (
    <div className={styles.customer}>
      <header className={styles.customerHeader}>
        <a href="/" className={styles.brand}>Tech Store</a>
        <form key={location.key} role="search" action="/products" className={styles.search} onSubmit={event => {
          event.preventDefault()
          const text = String(new FormData(event.currentTarget).get('q') ?? '').trim()
          const params = new URLSearchParams(location.pathname === '/products' ? location.search : '')
          params.delete('page')
          if (text) params.set('q', text)
          else params.delete('q')
          navigate({ pathname: '/products', search: params.toString() })
        }}>
          <LayoutIcon name="search" />
          <Input type="search" name="q" defaultValue={currentSearch} label="Tìm kiếm" placeholder="Tìm sản phẩm" />
        </form>
        {isAuthenticated && user ? (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--ts-space-8)' }}>
            <span
              className={styles.account}
              role="button"
              tabIndex={0}
              onClick={() => {
                const isStaffOrAdmin = user?.roles.includes('ROLE_ADMIN') || user?.roles.includes('ROLE_STAFF')
                navigate(isStaffOrAdmin ? '/admin' : '/profile')
              }}
              style={{ cursor: 'pointer' }}
            >
              {user.fullName}
            </span>
            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/login')
              }}
              style={{
                background: 'transparent',
                border: '1px solid var(--ts-color-border-control)',
                borderRadius: 'var(--ts-radius-8)',
                padding: 'var(--ts-space-8) var(--ts-space-12)',
                color: 'var(--ts-color-danger)',
                cursor: 'pointer',
                font: 'var(--ts-font-label-default)',
              }}
              title="Đăng xuất khỏi hệ thống"
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <span
            className={styles.account}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/login')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate('/login')
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            Tài khoản
          </span>
        )}
        <button
          type="button"
          className={styles.cart}
          aria-label="Giỏ hàng"
          onClick={() => navigate('/cart')}
        >
          <LayoutIcon name="cart" /><span>Giỏ hàng</span>
        </button>
      </header>
      <nav className={styles.categories} aria-label="Danh mục sản phẩm">
        <span>Danh mục<span className={styles.desktopOnly}> sản phẩm</span></span>
        <a href="/products?category=laptop">Laptop</a>
        <a href="/products?category=dien-thoai">Điện thoại</a>
        <a href="/products?category=man-hinh" className={styles.desktopOnly}>Màn hình</a>
        <a href="/products?category=am-thanh" className={styles.desktopOnly}>Âm thanh</a>
        <a href="/products?category=phu-kien">Phụ kiện</a>
      </nav>
      <main className={styles.content}>{children}</main>
      <footer className={styles.footer}>
        <strong>Tech Store</strong>
        <nav aria-label="Chân trang">
          <a href="/products" className={styles.footerLink}>Sản phẩm</a>
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => navigate('/orders')}
          >
            Đơn hàng
          </button>
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => navigate(isAuthenticated ? '/profile' : '/login')}
          >
            Tài khoản
          </button>
        </nav>
      </footer>
    </div>
  )
}
