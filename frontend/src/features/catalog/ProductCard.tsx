import { useState } from 'react'
import { Card } from '../../components/ui/Card'
import { cartApi } from '../../lib/api/cartApi'
import styles from './ProductCard.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export interface ProductCardData {
  id: string
  name: string
  slug?: string
  priceVnd: number
  image: string
  specification?: string
  brandId?: string
  inStock?: boolean
  averageRating?: number
  reviewCount?: number
}

export interface ProductCardProps {
  product: ProductCardData
  brandName?: string
  href?: string
  className?: string
  layout?: 'grid' | 'list'
}

export function ProductCard({ product, brandName, href, className = '', layout = 'grid' }: ProductCardProps) {
  const targetHref = href ?? (product.slug ? `/products/${product.slug}` : undefined)
  const isInStock = product.inStock !== false
  const [cartStatus, setCartStatus] = useState<'idle' | 'adding' | 'added'>('idle')

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const numId = Number(product.id)
    if (!isNaN(numId) && numId > 0) {
      try {
        setCartStatus('adding')
        const updatedCart = await cartApi.addItem(numId, 1)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('techstore:cart-updated', { detail: updatedCart }))
        }
        setCartStatus('added')
        window.setTimeout(() => setCartStatus('idle'), 2000)
      } catch (err: unknown) {
        setCartStatus('idle')
        if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
          if (typeof window !== 'undefined') {
            window.location.assign('/login?redirect=' + encodeURIComponent(window.location.pathname))
          }
        } else {
          const message = (err as { message?: string })?.message || 'Không thể thêm sản phẩm vào giỏ hàng'
          if (typeof window !== 'undefined') {
            window.alert(message)
          }
        }
      }
    }
  }

  return (
    <Card
      className={`${styles.productCard} ${layout === 'list' ? styles.productCardList : ''} ${className}`}
      media={
        <div className={styles.mediaContainer}>
          <div className={styles.stockStatus}>
            {isInStock ? (
              <span className={styles.inStock}>
                <span className={styles.stockDot} /> Còn hàng
              </span>
            ) : (
              <span className={styles.checkAvailability}>
                <span className={styles.stockDotRed} /> Liên hệ cửa hàng
              </span>
            )}
          </div>

          {/* Floating Action Buttons (Wishlist & Compare) */}
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.actionCircleBtn}
              title="Thêm vào yêu thích"
              aria-label="Yêu thích"
              onClick={e => {
                e.stopPropagation()
                alert('Đã thêm vào danh sách yêu thích!')
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.actionCircleBtn}
              title="So sánh sản phẩm"
              aria-label="So sánh"
              onClick={e => {
                e.stopPropagation()
                alert('Đã thêm vào danh sách so sánh!')
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </button>
          </div>

          {targetHref ? (
            <a href={targetHref} tabIndex={-1} aria-hidden="true" className={styles.imageLink}>
              <img src={product.image} alt={product.name} loading="lazy" className={styles.image} />
            </a>
          ) : (
            <img src={product.image} alt={product.name} loading="lazy" className={styles.image} />
          )}
        </div>
      }
    >
      <div className={styles.reviewsRow}>
        {(() => {
          const count = product.reviewCount ?? 0
          const filled = count > 0 ? Math.min(5, Math.max(1, Math.round(product.averageRating ?? 5))) : 0
          return (
            <>
              <span className={styles.stars} style={count === 0 ? { color: '#cbd5e1' } : undefined}>
                {'★'.repeat(filled) + '☆'.repeat(5 - filled)}
              </span>
              <span className={styles.reviewCount}>
                {count > 0 ? `(${count} đánh giá)` : 'Chưa có đánh giá'}
              </span>
            </>
          )
        })()}
      </div>
      {brandName && <small className={styles.brand}>{brandName}</small>}
      <h3 className={styles.title}>
        {targetHref ? (
          <a href={targetHref} className={styles.titleLink}>
            {product.name}
          </a>
        ) : (
          product.name
        )}
      </h3>
      {product.specification && <p className={styles.specs}>{product.specification}</p>}
      <div className={styles.priceRow}>
        <span className={styles.oldPrice}>{currency.format(Math.round(product.priceVnd * 1.15))}</span>
        <strong className={styles.price}>{currency.format(product.priceVnd)}</strong>
      </div>

      {/* Hover Add To Cart Button */}
      <div className={styles.hoverCartWrap}>
        <button
          type="button"
          className={styles.addToCartPillBtn}
          disabled={cartStatus === 'adding'}
          onClick={handleAddToCart}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          <span>
            {cartStatus === 'adding' ? 'Đang thêm...' : cartStatus === 'added' ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
          </span>
        </button>
      </div>
    </Card>
  )
}
