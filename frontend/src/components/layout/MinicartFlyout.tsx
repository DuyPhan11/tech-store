import styles from './Layouts.module.css'

interface MinicartFlyoutProps {
  isOpen: boolean
  onNavigate: (path: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function MinicartFlyout({
  isOpen,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: MinicartFlyoutProps) {
  if (!isOpen) return null

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
        <p className={styles.minicartCount}>2 sản phẩm trong giỏ</p>
        <button
          type="button"
          className={styles.minicartViewCartBtn}
          onClick={() => onNavigate('/cart')}
        >
          Xem &amp; Chỉnh sửa giỏ hàng
        </button>
      </div>

      <div className={styles.minicartDivider} />

      {/* Popover Items List */}
      <div className={styles.minicartItemsList}>
        {/* Item 1 */}
        <div className={styles.minicartItem}>
          <span className={styles.minicartQty}>1 x</span>
          <div className={styles.minicartThumb}>
            <img
              src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=120&auto=format&fit=crop&q=80"
              alt="MSI Pro 16"
              className={styles.minicartImg}
            />
          </div>
          <div className={styles.minicartItemInfo}>
            <p className={styles.minicartItemTitle}>
              EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-On...
            </p>
          </div>
          <div className={styles.minicartItemActions}>
            <button
              type="button"
              className={styles.minicartActionBtn}
              title="Xóa sản phẩm"
              aria-label="Xóa sản phẩm"
              onClick={e => {
                e.stopPropagation()
                alert('Đã xóa sản phẩm khỏi giỏ hàng rút gọn')
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

        <div className={styles.minicartItemDivider} />

        {/* Item 2 */}
        <div className={styles.minicartItem}>
          <span className={styles.minicartQty}>1 x</span>
          <div className={styles.minicartThumb}>
            <img
              src="https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=120&auto=format&fit=crop&q=80"
              alt="MSI Pro 16"
              className={styles.minicartImg}
            />
          </div>
          <div className={styles.minicartItemInfo}>
            <p className={styles.minicartItemTitle}>
              EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-On...
            </p>
          </div>
          <div className={styles.minicartItemActions}>
            <button
              type="button"
              className={styles.minicartActionBtn}
              title="Xóa sản phẩm"
              aria-label="Xóa sản phẩm"
              onClick={e => {
                e.stopPropagation()
                alert('Đã xóa sản phẩm khỏi giỏ hàng rút gọn')
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

      <div className={styles.minicartDivider} />

      {/* Popover Footer */}
      <div className={styles.minicartFooter}>
        <div className={styles.minicartSubtotal}>
          <span className={styles.subtotalText}>Tạm tính:</span>
          <span className={styles.subtotalValue}>11.990.000 ₫</span>
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
    </div>
  )
}
