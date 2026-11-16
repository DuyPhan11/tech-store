import { useState } from 'react'
import styles from './Layouts.module.css'

interface MegaMenuFlyoutProps {
  isOpen: boolean
  onNavigate: (path: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

const SUBCATEGORIES = [
  { id: 'everyday', name: 'Laptop văn phòng & Học tập', hasChevron: true },
  { id: 'workstation', name: 'Dòng máy trạm MSI Workstation', hasChevron: true },
  { id: 'prestige', name: 'Dòng cao cấp MSI Prestige', hasChevron: false },
  { id: 'gaming', name: 'Laptop chơi game (Gaming)', hasChevron: false },
  { id: 'tablets', name: 'Máy tính bảng (Tablet)', hasChevron: false },
  { id: 'netbooks', name: 'Laptop mỏng nhẹ thời trang', hasChevron: false },
  { id: 'infinity', name: 'Laptop Gaming cấu hình cao', hasChevron: false },
]

const FEATURED_PRODUCTS = [
  {
    id: 1,
    title: 'MSI Pro 16 Flex-036AU 15.6 Cảm ứng đa điểm All-In-One',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
    oldPrice: '13.990.000 ₫',
    price: '11.990.000 ₫',
    reviews: 4,
  },
  {
    id: 2,
    title: 'Laptop Gaming MSI Thin GF63 15.6 FHD 144Hz Core i7',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80',
    oldPrice: '21.990.000 ₫',
    price: '18.990.000 ₫',
    reviews: 4,
  },
  {
    id: 3,
    title: 'PC Gaming Tech Store Custom White Edition RTX 4060',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
    oldPrice: '24.990.000 ₫',
    price: '22.490.000 ₫',
    reviews: 4,
  },
  {
    id: 4,
    title: 'Laptop MSI Prestige 14 Evo Mỏng nhẹ Đồ họa chuẩn màu',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&auto=format&fit=crop&q=80',
    oldPrice: '26.990.000 ₫',
    price: '23.990.000 ₫',
    reviews: 4,
  },
]

export function MegaMenuFlyout({
  isOpen,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuFlyoutProps) {
  const [activeSubcat, setActiveSubcat] = useState('everyday')

  if (!isOpen) return null

  return (
    <div
      className={styles.megaMenuFlyout}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="region"
      aria-label="Danh mục Laptops mở rộng"
    >
      <div className={styles.megaMenuInner}>
        {/* Top Section: Split between Subcategories Sidebar & Featured 4-card Grid */}
        <div className={styles.megaMenuMain}>
          {/* Subcategories Column */}
          <aside className={styles.megaSidebar}>
            <ul className={styles.megaSubcatList}>
              {SUBCATEGORIES.map(subcat => {
                const isActive = activeSubcat === subcat.id
                return (
                  <li key={subcat.id}>
                    <button
                      type="button"
                      className={`${styles.megaSubcatBtn} ${isActive ? styles.megaSubcatBtnActive : ''}`}
                      onMouseEnter={() => setActiveSubcat(subcat.id)}
                      onClick={() => onNavigate('/products?category=laptop')}
                    >
                      <span>{subcat.name}</span>
                      {subcat.hasChevron && (
                        <svg
                          width="7"
                          height="10"
                          viewBox="0 0 7 10"
                          fill="none"
                          className={styles.megaChevron}
                        >
                          <path
                            d="M1.5 1.5L5.5 5L1.5 8.5"
                            stroke="#000000"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Featured 4 Product Cards Grid */}
          <div className={styles.megaProductsGrid}>
            {FEATURED_PRODUCTS.map(product => (
              <div
                key={product.id}
                className={styles.megaCard}
                onClick={() => onNavigate('/products?category=laptop')}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter') onNavigate('/products?category=laptop')
                }}
              >
                {/* Stock status indicator */}
                <div className={styles.megaStockStatus}>
                  <span className={styles.megaStockDot} />
                  <span>Còn hàng</span>
                </div>

                {/* Product thumbnail */}
                <div className={styles.megaThumbWrapper}>
                  <img
                    src={product.image}
                    alt={product.title}
                    className={styles.megaThumbImg}
                  />
                </div>

                {/* Star rating and reviews */}
                <div className={styles.megaReviews}>
                  <span className={styles.megaStars}>★★★★★</span>
                  <span className={styles.megaReviewCount}>({product.reviews} đánh giá)</span>
                </div>

                {/* Product title */}
                <p className={styles.megaProductTitle}>{product.title}</p>

                {/* Pricing: struck-through old price and bold current price */}
                <div className={styles.megaPrices}>
                  <span className={styles.megaOldPrice}>{product.oldPrice}</span>
                  <span className={styles.megaPrice}>{product.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Brand Logos Bar */}
        <div className={styles.megaBrandsBar}>
          {/* ROCCAT */}
          <div className={styles.megaBrandLogo} title="ROCCAT">
            <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
              <path d="M4 14C4 9 8 5 13 5C17 5 21 8 21 14C21 20 17 23 13 23C8 23 4 19 4 14Z" stroke="#444" strokeWidth="2" />
              <path d="M12 9C10 11 10 17 14 19" stroke="#444" strokeWidth="2" strokeLinecap="round" />
              <text x="26" y="16" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.5">ROCCAT</text>
              <text x="26" y="24" fill="#666" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="6" letterSpacing="1">SET THE RULES</text>
            </svg>
          </div>

          {/* MSI */}
          <div className={styles.megaBrandLogo} title="MSI">
            <svg width="85" height="28" viewBox="0 0 85 28" fill="none">
              <rect x="2" y="3" width="22" height="22" rx="4" fill="#333" />
              <path d="M7 14L13 8L19 14L13 20Z" fill="#E60012" />
              <text x="29" y="21" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="18" fontStyle="italic" letterSpacing="-0.5">msi</text>
            </svg>
          </div>

          {/* RAZER */}
          <div className={styles.megaBrandLogo} title="RAZER">
            <svg width="90" height="28" viewBox="0 0 90 28" fill="none">
              <path d="M6 14C8 9 14 9 16 14C14 19 8 19 6 14Z" stroke="#00FF00" strokeWidth="1.5" />
              <circle cx="11" cy="14" r="2" fill="#00FF00" />
              <text x="22" y="19" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="12" letterSpacing="3">RAZER</text>
            </svg>
          </div>

          {/* Thermaltake */}
          <div className={styles.megaBrandLogo} title="Thermaltake">
            <svg width="105" height="28" viewBox="0 0 105 28" fill="none">
              <rect x="2" y="4" width="20" height="20" rx="3" fill="#000" />
              <text x="5" y="19" fill="#FFF" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="13">Tt</text>
              <text x="27" y="19" fill="#333" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="12" letterSpacing="-0.3">thermaltake</text>
            </svg>
          </div>

          {/* ADATA */}
          <div className={styles.megaBrandLogo} title="ADATA">
            <svg width="85" height="28" viewBox="0 0 85 28" fill="none">
              <path d="M5 8L14 14L5 20L9 14Z" fill="#333" />
              <text x="20" y="20" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="15" letterSpacing="0.5">ADATA</text>
            </svg>
          </div>

          {/* HP HEWLETT PACKARD */}
          <div className={styles.megaBrandLogo} title="HP Hewlett Packard">
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none">
              <circle cx="14" cy="14" r="11" fill="#0096D6" />
              <text x="8" y="19" fill="#FFF" fontFamily="Poppins, sans-serif" fontWeight="900" fontStyle="italic" fontSize="13">hp</text>
              <text x="32" y="14" fill="#333" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="9">HEWLETT</text>
              <text x="32" y="23" fill="#333" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="9">PACKARD</text>
            </svg>
          </div>

          {/* GIGABYTE */}
          <div className={styles.megaBrandLogo} title="GIGABYTE">
            <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
              <text x="2" y="20" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="16" letterSpacing="0.5">GIGABYTE</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
