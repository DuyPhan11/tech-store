import { useEffect, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { LayoutIcon } from './LayoutIcon'
import { MinicartFlyout } from './MinicartFlyout'
import { MegaMenuFlyout } from './MegaMenuFlyout'
import { useAuth } from '../../features/auth/AuthContext'
import { cartApi } from '../../lib/api/cartApi'
import type { CartResponse } from '../../features/cart/cartTypes'
import styles from './Layouts.module.css'

export function CustomerLayout({ children }: PropsWithChildren) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()
  const currentSearch = new URLSearchParams(location.search).get('q') ?? ''

  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cart, setCart] = useState<CartResponse | null>(null)
  const megaTimeoutRef = useRef<number | null>(null)
  const cartTimeoutRef = useRef<number | null>(null)

  // Cập nhật giỏ hàng khi đăng nhập hoặc chuyển trang
  useEffect(() => {
    if (isAuthenticated) {
      cartApi.getCart()
        .then(res => setCart(res))
        .catch(() => setCart(null))
    } else {
      setCart(null)
      setIsCartOpen(false)
    }
  }, [isAuthenticated, location.pathname])

  const handleMinicartRemove = async (itemId: number) => {
    try {
      const updated = await cartApi.removeItem(itemId)
      setCart(updated)
    } catch {
      // ignore
    }
  }

  // Tự động đóng MegaMenu và MiniCart mỗi khi chuyển route / URL thay đổi
  useEffect(() => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current)
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current)
    setIsMegaMenuOpen(false)
    setIsCartOpen(false)
  }, [location.pathname, location.search])

  const handleMegaNavigate = (path: string) => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current)
    setIsMegaMenuOpen(false)
    navigate(path)
  }

  const handleCartNavigate = (path: string) => {
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current)
    setIsCartOpen(false)
    navigate(path)
  }

  const handleMegaEnter = () => {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current)
    setIsMegaMenuOpen(true)
  }

  const handleMegaLeave = () => {
    megaTimeoutRef.current = window.setTimeout(() => {
      setIsMegaMenuOpen(false)
    }, 150)
  }

  const handleCartEnter = () => {
    if (!isAuthenticated) return
    if (cartTimeoutRef.current) clearTimeout(cartTimeoutRef.current)
    setIsCartOpen(true)
  }

  const handleCartLeave = () => {
    cartTimeoutRef.current = window.setTimeout(() => {
      setIsCartOpen(false)
    }, 150)
  }

  return (
    <div className={styles.customer}>
      {/* 1. Tech Store Top Bar (Deep Black #020202) */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <div className={styles.topBarLeft}>
            <span className={styles.topBarSchedule}>
              <strong>Thứ 2 - Thứ 5:</strong> 9:00 - 17:30
            </span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={styles.topBarChevron}>
              <path d="M1 1L5 5L9 1" stroke="#A2A6B0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className={styles.topBarCenter}>
            <span>Ghé thăm showroom tại 1234 Đường Nguyễn Huệ, TP. HCM</span>
            <a href="/contact" className={styles.topBarContactLink}>Liên hệ ngay</a>
          </div>

          <div className={styles.topBarRight}>
            <span className={styles.topBarPhone}>Hotline: (028) 1234 5678</span>
            <span className={styles.topBarSocial}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Tech Store Main Header & Navigation (White #FFFFFF) */}
      <header className={styles.customerHeader}>
        <div className={styles.headerInner}>
          {/* Logo (Figma: Just the blue cube icon) */}
          <a href="/" className={styles.brand} aria-label="Tech Store Trang chủ">
            <span className={styles.brandLogoIcon}>
              <svg width="34" height="34" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L2 8.5L14 15L26 8.5L14 2Z" fill="#0156FF" />
                <path d="M2 13.5L14 20L26 13.5" stroke="#0156FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 18.5L14 25L26 18.5" stroke="#0156FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </a>

          {/* Main Navigation Menu (Single row on Desktop) */}
          <nav className={styles.categories} aria-label="Danh mục sản phẩm">
            <div
              className={styles.navCategoryItem}
              onMouseEnter={handleMegaEnter}
              onMouseLeave={handleMegaLeave}
            >
              <a
                href="/products?category=laptop"
                className={`${styles.navLink} ${isMegaMenuOpen ? styles.navLinkActive : ''}`}
                onClick={e => {
                  e.preventDefault()
                  handleMegaNavigate('/products?category=laptop')
                }}
              >
                Laptop
              </a>
            </div>
            <a href="/products?category=dien-thoai">Máy tính để bàn</a>
            <a href="/products?category=man-hinh">Thiết bị mạng</a>
            <a href="/products?category=am-thanh">Máy in &amp; Máy quét</a>
            <a href="/products?category=phu-kien">Linh kiện PC</a>
            <a href="/products">Tất cả sản phẩm</a>
            <a href="/products">Dịch vụ sửa chữa</a>
            <a href="/products" className={styles.dealsPillBtn}>Ưu đãi sốc</a>
          </nav>

          {/* Header Action Icons: Search, Cart, Avatar */}
          <div className={styles.headerActions}>
            <form
              key={location.key}
              role="search"
              action="/products"
              className={styles.searchForm}
              onSubmit={event => {
                event.preventDefault()
                const text = String(new FormData(event.currentTarget).get('q') ?? '').trim()
                const params = new URLSearchParams(location.pathname === '/products' ? location.search : '')
                params.delete('page')
                if (text) params.set('q', text)
                else params.delete('q')
                navigate({ pathname: '/products', search: params.toString() })
              }}
            >
              <input
                type="search"
                name="q"
                defaultValue={currentSearch}
                aria-label="Tìm kiếm sản phẩm"
                placeholder="Tìm kiếm sản phẩm..."
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchIconBtn} aria-label="Tìm kiếm">
                <LayoutIcon name="search" />
              </button>
            </form>

            {/* Cart Icon with blue badge and Mini-Cart Dropdown */}
            <div
              className={styles.cartDropdownWrapper}
              onMouseEnter={handleCartEnter}
              onMouseLeave={handleCartLeave}
            >
              <button
                type="button"
                className={styles.cartIconBtn}
                aria-label="Giỏ hàng"
                onClick={() => navigate('/cart')}
              >
                <LayoutIcon name="cart" />
                {cart && cart.totalItems > 0 && <span className={styles.cartBadge}>{cart.totalItems}</span>}
              </button>

              <MinicartFlyout
                isOpen={isCartOpen}
                isAuthenticated={isAuthenticated}
                cart={cart}
                onNavigate={handleCartNavigate}
                onMouseEnter={handleCartEnter}
                onMouseLeave={handleCartLeave}
                onRemoveItem={handleMinicartRemove}
              />
            </div>

            {/* User Profile Avatar */}
            {isAuthenticated && user ? (
              <div className={styles.userSection}>
                <button
                  type="button"
                  className={styles.avatarBtn}
                  onClick={() => {
                    const isStaffOrAdmin = user?.roles.includes('ROLE_ADMIN') || user?.roles.includes('ROLE_STAFF')
                    navigate(isStaffOrAdmin ? '/admin' : '/profile')
                  }}
                  title={user.fullName || 'Tài khoản của tôi'}
                >
                  <span className={styles.userAvatar}>
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className={styles.logoutBtn}
                  title="Đăng xuất"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.avatarBtn}
                onClick={() => navigate('/login')}
                title="Đăng nhập tài khoản"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mega Menu Dropdown Flyout */}
        <MegaMenuFlyout
          isOpen={isMegaMenuOpen}
          onNavigate={handleMegaNavigate}
          onMouseEnter={handleMegaEnter}
          onMouseLeave={handleMegaLeave}
        />
      </header>

      {/* Main Content Area */}
      <main className={styles.content}>{children}</main>

      {/* 3. Tech Store Footer (Deep Black #020203 - Group 35) */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          {/* Newsletter Box */}
          <div className={styles.newsletterBox}>
            <div className={styles.newsletterText}>
              <h2>Đăng ký nhận bản tin khuyến mãi.</h2>
              <p>Cập nhật sớm nhất các ưu đãi công nghệ hấp dẫn và flash sale.</p>
            </div>
            <form
              className={styles.newsletterForm}
              onSubmit={e => {
                e.preventDefault()
                alert('Cảm ơn bạn đã đăng ký nhận bản tin khuyến mãi từ Tech Store!')
              }}
            >
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                aria-label="Địa chỉ email nhận khuyến mãi"
                required
                className={styles.newsletterInput}
              />
              <button type="submit" className={styles.subscribeBtn}>
                Đăng ký
              </button>
            </form>
          </div>

          {/* Footer Navigation Columns */}
          <div className={styles.footerColumns}>
            <div className={styles.footerCol}>
              <h3>Thông tin cửa hàng</h3>
              <nav aria-label="Chân trang" className={styles.footerNav}>
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
                <a href="/about" className={styles.footerLink}>Về chúng tôi</a>
                <a href="/contact" className={styles.footerLink}>Liên hệ</a>
                <a href="/faqs" className={styles.footerLink}>Hỏi đáp (FAQ)</a>
              </nav>
            </div>

            <div className={styles.footerCol}>
              <h3>Linh kiện PC</h3>
              <a href="/products?category=phu-kien" className={styles.footerLink}>Bộ vi xử lý (CPU)</a>
              <a href="/products?category=phu-kien" className={styles.footerLink}>Bo mạch chủ (Mainboard)</a>
              <a href="/products?category=phu-kien" className={styles.footerLink}>Card màn hình (VGA)</a>
              <a href="/products?category=phu-kien" className={styles.footerLink}>Bộ nhớ trong (RAM)</a>
              <a href="/products?category=phu-kien" className={styles.footerLink}>Nguồn máy tính (PSU)</a>
            </div>

            <div className={styles.footerCol}>
              <h3>Laptop & Máy tính</h3>
              <a href="/products?category=laptop" className={styles.footerLink}>Laptop văn phòng &amp; học tập</a>
              <a href="/products?category=laptop" className={styles.footerLink}>Dòng máy trạm MSI Workstation</a>
              <a href="/products?category=laptop" className={styles.footerLink}>Dòng cao cấp MSI Prestige</a>
              <a href="/products?category=laptop" className={styles.footerLink}>Laptop Gaming hiệu năng cao</a>
            </div>

            <div className={styles.footerCol}>
              <h3>Địa chỉ showroom</h3>
              <p className={styles.addressText}>Địa chỉ: 1234 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh</p>
              <p className={styles.addressText}>Hotline: (028) 1234 5678</p>
              <p className={styles.addressText}>Mở cửa: Thứ 2 - Thứ 5: 9:00 - 17:30</p>
              <p className={styles.addressText}>Email: shop@techstore.vn</p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Copyright */}
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomInner}>
            <p>Bản quyền © 2026 Tech Store. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
