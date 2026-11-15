import type { PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Input } from '../ui/Input'
import { LayoutIcon } from './LayoutIcon'
import styles from './Layouts.module.css'

export function CustomerLayout({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
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
        <span className={styles.account}>Tài khoản</span>
        <span className={styles.cart} aria-label="Giỏ hàng" role="img">
          <LayoutIcon name="cart" /><span>Giỏ hàng</span>
        </span>
      </header>
      <nav className={styles.categories} aria-label="Danh mục sản phẩm">
        <span>Danh mục<span className={styles.desktopOnly}> sản phẩm</span></span>
        <span>Laptop</span><span>Điện thoại</span>
        <span className={styles.desktopOnly}>Màn hình</span><span className={styles.desktopOnly}>Âm thanh</span>
        <span>Phụ kiện</span>
      </nav>
      <main className={styles.content}>{children}</main>
      <footer className={styles.footer}>
        <strong>Tech Store</strong>
        <nav aria-label="Chân trang"><span>Sản phẩm</span><span>Đơn hàng</span><span>Tài khoản</span></nav>
      </footer>
    </div>
  )
}
