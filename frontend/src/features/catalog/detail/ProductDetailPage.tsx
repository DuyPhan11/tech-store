import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { Button } from '../../../components/ui/Button'
import { ProductCard } from '../ProductCard'
import { ProductGallery } from './ProductGallery'
import { mockProductDetailSource } from './mockProductDetailSource'
import { categories as defaultCategories, brands as defaultBrands, catalogProducts } from '../catalogData'
import type { CatalogOption, ProductDetail, ProductDetailSource } from '../list/catalogTypes'
import styles from './ProductDetailPage.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export interface ProductDetailPageProps {
  source?: ProductDetailSource
  categories?: readonly CatalogOption[]
  brands?: readonly CatalogOption[]
  onAddToCart?: (productId: string, quantity: number) => void
  onBuyNow?: (payload: { source: 'BUY_NOW'; productId: string; quantity: number }) => void
}

type DetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: ProductDetail }

export function ProductDetailPage({
  source = mockProductDetailSource,
  categories = defaultCategories,
  brands = defaultBrands,
  onAddToCart,
  onBuyNow,
}: ProductDetailPageProps) {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    const controller = new AbortController()

    if (!slug) {
      Promise.resolve().then(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
      return () => controller.abort()
    }

    source(slug, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) {
          setState({ status: 'ready', data })
          setQuantity(1)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error' })
        }
      })

    return () => controller.abort()
  }, [slug, source])

  if (state.status === 'loading') {
    return <p role="status" className={styles.message}>Đang tải thông tin sản phẩm…</p>
  }

  if (state.status === 'error') {
    return (
      <div className={styles.message} role="alert">
        <h2>Không tìm thấy sản phẩm</h2>
        <p>Sản phẩm không tồn tại hoặc đã ngừng kinh doanh.</p>
        <Button variant="primary" onClick={() => navigate('/products')}>
          Quay lại danh sách sản phẩm
        </Button>
      </div>
    )
  }

  const product = state.data
  const brand = brands.find(b => b.id === product.brandId)
  const category = categories.find(c => c.id === product.categoryId)

  // Sản phẩm liên quan cùng danh mục (tối đa 4 sản phẩm, không gồm sản phẩm hiện tại)
  const relatedProducts = catalogProducts
    .filter(p => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4)

  const handleDecrease = () => {
    setQuantity(prev => Math.max(1, prev - 1))
  }

  const handleIncrease = () => {
    setQuantity(prev => Math.min(product.maxBranchQuantity, prev + 1))
  }

  const handleQuantityChange = (val: string) => {
    const num = parseInt(val, 10)
    if (isNaN(num) || num < 1) {
      setQuantity(1)
    } else {
      setQuantity(Math.min(product.maxBranchQuantity, num))
    }
  }

  return (
    <div className={styles.detailContainer}>
      {/* 1. Breadcrumb điều hướng */}
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
        <a href="/products">Sản phẩm</a>
        {category && (
          <>
            <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
            <a href={`/products?category=${category.id}`}>{category.name}</a>
          </>
        )}
        <span className={styles.breadcrumbSeparator} aria-hidden="true">/</span>
        <span aria-current="page" className={styles.breadcrumbCurrent}>{product.name}</span>
      </nav>

      {/* 2. Khối chính: Thư viện ảnh + Thông tin & Mua sắm */}
      <div className={styles.productMain}>
        <ProductGallery images={product.images} productName={product.name} />

        <div className={styles.productInfo}>
          <div className={styles.headerMeta}>
            {brand && <span className={styles.brand}>{brand.name}</span>}
            <span className={styles.sku}>SKU: {product.sku}</span>
          </div>

          <h1 className={styles.productTitle}>{product.name}</h1>

          <div className={styles.priceWrapper}>
            <span className={styles.price}>{currency.format(product.priceVnd)}</span>
          </div>

          {/* Trạng thái tồn kho theo chi nhánh ACTIVE */}
          <div className={styles.stockStatus}>
            <span
              className={`${styles.stockBadge} ${product.inStock ? styles.stockIn : styles.stockOut}`}
              role="status"
            >
              {product.inStock ? 'Còn hàng' : 'Hết hàng'}
            </span>
            {product.inStock && product.maxBranchQuantity > 0 && (
              <span className={styles.stockNote}>
                (Khả dụng tối đa {product.maxBranchQuantity} tại một chi nhánh)
              </span>
            )}
          </div>

          {/* Chọn số lượng & Thao tác giỏ hàng / Mua ngay */}
          <div className={styles.purchaseSection}>
            <div className={styles.quantityGroup}>
              <span className={styles.quantityLabel}>Số lượng:</span>
              <div className={styles.quantityControls}>
                <button
                  type="button"
                  aria-label="Giảm số lượng"
                  className={styles.quantityBtn}
                  onClick={handleDecrease}
                  disabled={!product.inStock || quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  aria-label="Số lượng sản phẩm"
                  className={styles.quantityInput}
                  value={product.inStock ? quantity : 0}
                  min={product.inStock ? 1 : 0}
                  max={product.inStock ? product.maxBranchQuantity : 0}
                  disabled={!product.inStock}
                  onChange={e => handleQuantityChange(e.target.value)}
                />
                <button
                  type="button"
                  aria-label="Tăng số lượng"
                  className={styles.quantityBtn}
                  onClick={handleIncrease}
                  disabled={!product.inStock || quantity >= product.maxBranchQuantity}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <Button
                variant="outline"
                disabled={!product.inStock}
                onClick={() => onAddToCart?.(product.id, quantity)}
              >
                Thêm vào giỏ hàng
              </Button>
              <Button
                variant="primary"
                disabled={!product.inStock}
                onClick={() => onBuyNow?.({ source: 'BUY_NOW', productId: product.id, quantity })}
              >
                Mua ngay
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Mô tả chi tiết */}
      <section aria-labelledby="desc-heading" className={styles.sectionGroup}>
        <h2 id="desc-heading" className={styles.sectionTitle}>Mô tả sản phẩm</h2>
        <p className={styles.descriptionText}>
          {product.description || 'Đang cập nhật mô tả cho sản phẩm này.'}
        </p>
      </section>

      {/* 4. Bảng thông số kỹ thuật */}
      {product.specifications.length > 0 && (
        <section aria-labelledby="specs-heading" className={styles.sectionGroup}>
          <h2 id="specs-heading" className={styles.sectionTitle}>Thông số kỹ thuật</h2>
          <table className={styles.specTable}>
            <tbody>
              {product.specifications.map((spec, index) => (
                <tr key={index} className={styles.specRow}>
                  <th scope="row" className={styles.specLabel}>{spec.label}</th>
                  <td className={styles.specValue}>{spec.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* 5. Khu vực Đánh giá (Empty state theo quy định) */}
      <section aria-labelledby="reviews-heading" className={styles.sectionGroup}>
        <h2 id="reviews-heading" className={styles.sectionTitle}>Đánh giá từ khách hàng</h2>
        <p className={styles.emptyReviews}>Chưa có đánh giá nào cho sản phẩm này.</p>
      </section>

      {/* 6. Sản phẩm liên quan (Tái sử dụng ProductCard) */}
      {relatedProducts.length > 0 && (
        <section aria-labelledby="related-heading" className={styles.relatedSection}>
          <h2 id="related-heading" className={styles.relatedTitle}>Sản phẩm liên quan</h2>
          <div className={styles.relatedGrid}>
            {relatedProducts.map(rel => (
              <ProductCard
                key={rel.id}
                product={rel}
                brandName={brands.find(b => b.id === rel.brandId)?.name}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
