import { useEffect, useState } from 'react'
import { catalogApi } from '../../lib/api/catalogApi'
import type { CatalogProduct, PublicBrand, PublicCategory } from '../../features/catalog/list/catalogTypes'
import styles from './Layouts.module.css'

interface MegaMenuFlyoutProps {
  isOpen: boolean
  parentSlug: string
  onNavigate: (path: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

function formatPriceVnd(price: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(price)} ₫`
}

export function MegaMenuFlyout({
  isOpen,
  parentSlug,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuFlyoutProps) {
  const [allCategories, setAllCategories] = useState<PublicCategory[]>([])
  const [brands, setBrands] = useState<PublicBrand[]>([])
  const [activeSubcat, setActiveSubcat] = useState<string>('')
  const [productsBySubcat, setProductsBySubcat] = useState<Record<string, CatalogProduct[]>>({})
  const [loadingSubcats, setLoadingSubcats] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)

  // Tải danh mục và danh sách thương hiệu thật từ database
  useEffect(() => {
    const controller = new AbortController()
    setLoadingSubcats(true)

    Promise.all([
      catalogApi.getCategories(controller.signal),
      catalogApi.getBrands(controller.signal),
    ])
      .then(([cats, brandList]) => {
        setAllCategories(cats)
        setBrands(brandList)
      })
      .catch(() => {
        // Bỏ qua khi abort hoặc offline
      })
      .finally(() => {
        setLoadingSubcats(false)
      })

    return () => controller.abort()
  }, [])

  const subcategories = allCategories.filter(c => c.parentSlug === parentSlug)

  useEffect(() => {
    const children = allCategories.filter(c => c.parentSlug === parentSlug)
    if (children.length > 0) {
      setActiveSubcat(prev => (prev && children.some(c => c.slug === prev) ? prev : children[0].slug))
    } else {
      setActiveSubcat('')
    }
  }, [allCategories, parentSlug])

  // Tải tối đa 4 sản phẩm thật theo danh mục con đang chọn khi MegaMenu mở
  useEffect(() => {
    if (!isOpen || !activeSubcat) return
    if (productsBySubcat[activeSubcat]) return

    const controller = new AbortController()
    setLoadingProducts(true)

    catalogApi
      .getProducts({ keyword: '', category: activeSubcat, brand: '', sort: 'default', page: 1, size: 4 }, controller.signal)
      .then(res => {
        setProductsBySubcat(prev => ({
          ...prev,
          [activeSubcat]: res.products.slice(0, 4),
        }))
      })
      .catch(() => {
        // Bỏ qua khi abort hoặc lỗi mạng
      })
      .finally(() => {
        setLoadingProducts(false)
      })

    return () => controller.abort()
  }, [isOpen, activeSubcat, productsBySubcat])

  if (!isOpen) return null

  const currentProducts = productsBySubcat[activeSubcat] ?? []

  return (
    <div
      className={styles.megaMenuFlyout}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="region"
      aria-label="Danh mục Laptop mở rộng"
    >
      <div className={styles.megaMenuInner}>
        {/* Top Section: Subcategories Sidebar & 4-card Grid from DB */}
        <div className={styles.megaMenuMain}>
          <aside className={styles.megaSidebar}>
            <ul className={styles.megaSubcatList}>
              {loadingSubcats && subcategories.length === 0 ? (
                <li className={styles.megaEmptyHint}>Đang tải danh mục...</li>
              ) : subcategories.length === 0 ? (
                <li className={styles.megaEmptyHint}>Chưa có danh mục con</li>
              ) : (
                subcategories.map(subcat => {
                  const isActive = activeSubcat === subcat.slug
                  return (
                    <li key={subcat.slug}>
                      <button
                        type="button"
                        className={`${styles.megaSubcatBtn} ${isActive ? styles.megaSubcatBtnActive : ''}`}
                        onMouseEnter={() => setActiveSubcat(subcat.slug)}
                        onClick={() => onNavigate(`/products?category=${subcat.slug}`)}
                      >
                        <span>{subcat.name}</span>
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
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </aside>

          {/* Featured 4 Product Cards Grid (Dữ liệu thật từ /api/products) */}
          <div className={styles.megaProductsGrid}>
            {loadingProducts && currentProducts.length === 0 ? (
              <div className={styles.megaEmptyState}>Đang tải sản phẩm...</div>
            ) : currentProducts.length === 0 ? (
              <div className={styles.megaEmptyState}>Chưa có sản phẩm trong danh mục này.</div>
            ) : (
              currentProducts.map(product => (
                <div
                  key={product.id}
                  className={styles.megaCard}
                  onClick={() => onNavigate(`/products/${product.slug}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter') onNavigate(`/products/${product.slug}`)
                  }}
                >
                  <div className={styles.megaStockStatus}>
                    <span className={styles.megaStockDot} />
                    <span>{product.status === 'ACTIVE' ? 'Còn hàng' : 'Tạm hết hàng'}</span>
                  </div>

                  <div className={styles.megaThumbWrapper}>
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className={styles.megaThumbImg}
                      />
                    ) : (
                      <span className={styles.megaThumbFallback}>{product.brandName ?? product.brandId}</span>
                    )}
                  </div>

                  <div className={styles.megaMetaRow}>
                    <span className={styles.megaBrandTag}>{product.brandName ?? product.brandId}</span>
                    {product.specification && (
                      <span className={styles.megaSpecText}>{product.specification}</span>
                    )}
                  </div>

                  <p className={styles.megaProductTitle}>{product.name}</p>

                  <div className={styles.megaPrices}>
                    <span className={styles.megaPrice}>{formatPriceVnd(product.priceVnd)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bottom Brand Logos Bar (Thương hiệu thật từ /api/brands) */}
        {brands.length > 0 && (
          <div className={styles.megaBrandsBar} aria-label="Thương hiệu nổi bật">
            {brands.map(brand => (
              <button
                key={brand.slug}
                type="button"
                className={styles.megaBrandBtn}
                title={`Xem sản phẩm ${brand.name}`}
                onClick={() => onNavigate(`/products?brand=${brand.slug}`)}
              >
                {brand.logoUrl ? (
                  <img src={brand.logoUrl} alt={brand.name} className={styles.megaBrandImg} />
                ) : (
                  <span className={styles.megaBrandName}>{brand.name}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
