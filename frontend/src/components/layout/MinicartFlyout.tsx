import type { CartResponse } from '../../features/cart/cartTypes'
import styles from './Layouts.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

interface MinicartFlyoutProps {
  isOpen: boolean
  isAuthenticated: boolean
  cart: CartResponse | null
  onNavigate: (path: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onRemoveItem?: (itemId: number) => void
}

export function MinicartFlyout({
  isOpen,
  isAuthenticated,
  cart,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
  onRemoveItem,
}: MinicartFlyoutProps) {
  // Không hiển thị popover nếu chưa mở hoặc chưa đăng nhập
  if (!isOpen || !isAuthenticated) return null

  const items = cart?.items ?? []
  const totalItems = cart?.totalItems ?? 0
  const totalPriceVnd = cart?.totalPriceVnd ?? 0

  return (
    <div
      className={styles.minicartFlyout}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="region"
      aria-label="Giỏ hàng rút gọn"
    >
      {/* Upward pointing triangle caret positioned under the cart icon */}
      <div className={styles.minicartCaret} aria-hidden="true" />

      {/* Popover Header */}
      <div className={styles.minicartHeader}>
        <h3 className={styles.minicartTitle}>Giỏ hàng của tôi</h3>
        <p className={styles.minicartCount}>{totalItems} sản phẩm trong giỏ</p>
        <button
          type="button"
          className={styles.minicartViewCartBtn}
          onClick={() => onNavigate('/cart')}
        >
          Xem &amp; Chỉnh sửa giỏ hàng
        </button>
      </div>

      <div className={styles.minicartDivider} />

      {items.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', color: '#666' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>Giỏ hàng của bạn đang trống</p>
          <button
            type="button"
            className={styles.minicartViewCartBtn}
            onClick={() => onNavigate('/products')}
          >
            Khám phá sản phẩm ngay
          </button>
        </div>
      ) : (
        <>
          {/* Popover Items List */}
          <div className={styles.minicartItemsList}>
            {items.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <div className={styles.minicartItemDivider} />}
                <div className={styles.minicartItem}>
                  <span className={styles.minicartQty}>{item.quantity} x</span>
                  <div className={styles.minicartThumb}>
                    <img
                      src={item.productImage || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=200&auto=format&fit=crop&q=60'}
                      alt={item.productName}
                      className={styles.minicartImg}
                    />
                  </div>
                  <div className={styles.minicartItemInfo}>
                    <p
                      className={styles.minicartItemTitle}
                      title={item.productName}
                      onClick={() => onNavigate(item.productSlug ? `/products/${item.productSlug}` : '/cart')}
                      style={{ cursor: 'pointer' }}
                    >
                      {item.productName}
                    </p>
                    <small style={{ color: '#0156FF', fontWeight: 600 }}>{currency.format(item.priceVnd)}</small>
                  </div>
                  <div className={styles.minicartItemActions}>
                    <button
                      type="button"
                      className={styles.minicartActionBtn}
                      title="Xóa sản phẩm"
                      aria-label="Xóa sản phẩm"
                      onClick={e => {
                        e.stopPropagation()
                        onRemoveItem?.(item.id)
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" stroke="#A2A6B0" strokeWidth="1.2" />
                        <path d="M7 7L13 13M13 7L7 13" stroke="#A2A6B0" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className={styles.minicartActionBtn}
                      title="Chỉnh sửa sản phẩm"
                      aria-label="Chỉnh sửa sản phẩm"
                      onClick={e => {
                        e.stopPropagation()
                        onNavigate('/cart')
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="9" stroke="#A2A6B0" strokeWidth="1.2" />
                        <path d="M6.5 13.5L8 13L13.5 7.5L12 6L6.5 11.5V13.5Z" stroke="#A2A6B0" strokeWidth="1.2" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.minicartDivider} />

          {/* Popover Footer */}
          <div className={styles.minicartFooter}>
            <div className={styles.minicartSubtotal}>
              <span className={styles.subtotalText}>Tạm tính:</span>
              <span className={styles.subtotalValue}>{currency.format(totalPriceVnd)}</span>
            </div>

            <button
              type="button"
              className={styles.minicartCheckoutBtn}
              onClick={() => onNavigate('/checkout')}
            >
              Tiến hành đặt hàng
            </button>

            <button
              type="button"
              className={styles.minicartPaypalBtn}
              onClick={() => alert('Thanh toán nhanh qua PayPal (Mock)')}
            >
              Thanh toán nhanh với <span className={styles.paypalLogoText}><i>Pay</i><i>Pal</i></span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
