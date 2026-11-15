import type { PropsWithChildren } from 'react'
import { Input } from '../ui/Input'
import { LayoutIcon } from './LayoutIcon'
import styles from './Layouts.module.css'

export function CustomerLayout({ children }: PropsWithChildren) {
  return (
    <div className={styles.customer}>
      <header className={styles.customerHeader}>
        <a href="/" className={styles.brand}>Tech Store</a>
        <div role="search" className={styles.search}>
          <LayoutIcon name="search" />
          <Input type="search" label="Tìm kiếm" placeholder="Tìm sản phẩm" />
        </div>
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
