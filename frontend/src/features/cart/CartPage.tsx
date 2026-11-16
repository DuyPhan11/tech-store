import { useState } from 'react'
import { useNavigate } from 'react-router'
import styles from './CartPage.module.css'

interface CartItem {
  id: string
  name: string
  image: string
  priceVnd: number
  quantity: number
  sku: string
}

const initialItems: CartItem[] = [
  {
    id: 'prod-1',
    name: 'MSI MEG Trident X 10SD-1012AU Intel i7 10700K, 2070 SUPER, 32GB RAM, 1TB SSD, Windows 10 Home, Gaming Keyboard and Mouse 3 Years Warranty',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=200&auto=format&fit=crop&q=60',
    priceVnd: 104376000,
    quantity: 1,
    sku: 'MSI-TRI-X',
  },
  {
    id: 'prod-2',
    name: 'MSI MEG Trident X 10SD-1012AU Intel i7 10700K, 2070 SUPER, 32GB RAM, 1TB SSD, Windows 10 Home, Gaming Keyboard and Mouse 3 Years Warranty',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200&auto=format&fit=crop&q=60',
    priceVnd: 104376000,
    quantity: 1,
    sku: 'MSI-TRI-X-2',
  },
]

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function CartPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<CartItem[]>(initialItems)
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [shippingOpen, setShippingOpen] = useState(true)
  const [couponOpen, setCouponOpen] = useState(true)

  const subtotal = items.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0)
  const shippingFee = items.length === 0 ? 0 : 504000 // $21.00 approx
  const tax = items.length === 0 ? 0 : 45840 // $1.91 approx
  const gst = items.length === 0 ? 0 : 45840 // GST 10%
  const grandTotal = Math.max(0, subtotal - discount + shippingFee + tax + gst)

  const handleQuantityChange = (id: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta)
          return { ...item, quantity: newQty }
        }
        return item
      })
    )
  }

  const handleRemove = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (couponCode.trim().toUpperCase() === 'TECHSTORE10') {
      const disc = Math.round(subtotal * 0.1)
      setDiscount(disc)
      setCouponMsg('Áp dụng mã giảm giá 10% thành công!')
    } else {
      setDiscount(0)
      setCouponMsg('Mã giảm giá không hợp lệ hoặc đã hết hạn.')
    }
  }

  return (
    <div className={styles.cartPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Giỏ hàng</span>
      </nav>

      <h1 className={styles.pageTitle}>Giỏ hàng của bạn</h1>

      {items.length === 0 ? (
        <div className={styles.emptyCartCard}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <h2>Giỏ hàng của bạn đang trống</h2>
          <p>Bạn chưa thêm sản phẩm công nghệ nào vào giỏ hàng.</p>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={() => navigate('/products')}
          >
            Khám phá sản phẩm ngay
          </button>
        </div>
      ) : (
        <div className={styles.cartLayout}>
          {/* Left Column: Items Table (Clean, borderless container matching Figma) */}
          <div className={styles.itemsSection}>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th className={styles.thItem}>Sản phẩm</th>
                  <th className={styles.thPrice}>Giá</th>
                  <th className={styles.thQty}>Số lượng</th>
                  <th className={styles.thSub}>Thành tiền</th>
                  <th className={styles.thAction}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className={styles.itemRow}>
                    <td className={styles.tdItem}>
                      <img src={item.image} alt={item.name} className={styles.thumb} />
                      <div className={styles.itemMeta}>
                        <strong className={styles.itemName}>{item.name}</strong>
                      </div>
                    </td>
                    <td className={styles.tdPrice}>
                      <strong>{currency.format(item.priceVnd)}</strong>
                    </td>
                    <td className={styles.tdQty}>
                      <div className={styles.qtyBox}>
                        <span className={styles.qtyValue}>{item.quantity}</span>
                        <div className={styles.qtyArrows}>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, 1)}
                            aria-label="Tăng số lượng"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1}
                            aria-label="Giảm số lượng"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdSub}>
                      <strong>{currency.format(item.priceVnd * item.quantity)}</strong>
                    </td>
                    <td className={styles.tdAction}>
                      <div className={styles.itemActionIcons}>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          className={styles.circleIconBtn}
                          aria-label="Xóa sản phẩm"
                          title="Xóa sản phẩm"
                        >
                          ×
                        </button>
                        <button
                          type="button"
                          onClick={() => alert('Chỉnh sửa cấu hình sản phẩm')}
                          className={styles.circleIconBtn}
                          aria-label="Chỉnh sửa sản phẩm"
                          title="Chỉnh sửa sản phẩm"
                        >
                          ✎
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Bottom 3 Pill Action Buttons matching Figma */}
            <div className={styles.tableFooterActions}>
              <div className={styles.footerLeftActions}>
                <button
                  type="button"
                  className={styles.continueShoppingBtn}
                  onClick={() => navigate('/products')}
                >
                  Tiếp tục mua hàng
                </button>
                <button
                  type="button"
                  className={styles.clearCartBtn}
                  onClick={() => setItems([])}
                >
                  Xóa giỏ hàng
                </button>
              </div>

              <button
                type="button"
                className={styles.updateCartBtn}
                onClick={() => alert('Đã cập nhật giỏ hàng thành công!')}
              >
                Cập nhật giỏ hàng
              </button>
            </div>
          </div>

          {/* Right Column: Summary Panel (Seamless #F5F7FF background, borderless matching Figma) */}
          <div className={styles.summarySection}>
            <h2 className={styles.summaryTitle}>Tóm tắt đơn hàng</h2>

            {/* Accordion 1: Estimate Shipping and Tax */}
            <div className={styles.accordionGroup}>
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => setShippingOpen(prev => !prev)}
              >
                <span>Ước tính phí vận chuyển & thuế</span>
                <span className={styles.chevronIcon}>{shippingOpen ? '▴' : '▾'}</span>
              </button>
              {shippingOpen && (
                <div className={styles.accordionBody}>
                  <p className={styles.estimateSubtext}>
                    Nhập địa chỉ giao hàng của bạn để nhận báo giá chi tiết.
                  </p>
                </div>
              )}
            </div>

            {/* Accordion 2: Apply Discount Code */}
            <div className={styles.accordionGroup}>
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => setCouponOpen(prev => !prev)}
              >
                <span>Áp dụng mã giảm giá</span>
                <span className={styles.chevronIcon}>{couponOpen ? '▴' : '▾'}</span>
              </button>
              {couponOpen && (
                <form onSubmit={handleApplyCoupon} className={styles.couponForm}>
                  <div className={styles.couponInputGroup}>
                    <input
                      type="text"
                      placeholder="Nhập mã (VD: TECHSTORE10)"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                    />
                    <button type="submit" className={styles.couponBtn}>
                      Áp dụng
                    </button>
                  </div>
                  {couponMsg && <p className={styles.couponNotice}>{couponMsg}</p>}
                </form>
              )}
            </div>

            <div className={styles.summaryDivider} />

            {/* Summary Price Breakdown */}
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>Tạm tính</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>

              {discount > 0 && (
                <div className={`${styles.summaryRow} ${styles.discountRow}`}>
                  <span>Giảm giá</span>
                  <span>-{currency.format(discount)}</span>
                </div>
              )}

              <div className={styles.summaryRowCol}>
                <div className={styles.summaryRow}>
                  <span>Phí vận chuyển</span>
                  <strong>{currency.format(shippingFee)}</strong>
                </div>
                <small className={styles.shippingNotice}>
                  (Cước tiêu chuẩn - Giá có thể thay đổi tùy khu vực giao nhận. Nhân viên Tech Store sẽ liên hệ xác nhận.)
                </small>
              </div>

              <div className={styles.summaryRow}>
                <span>Thuế</span>
                <strong>{currency.format(tax)}</strong>
              </div>

              <div className={styles.summaryRow}>
                <span>VAT (10%)</span>
                <strong>{currency.format(gst)}</strong>
              </div>

              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Tổng thanh toán</span>
                <strong className={styles.totalPrice}>{currency.format(grandTotal)}</strong>
              </div>
            </div>

            {/* 3 Call-To-Action Pill Buttons matching Figma */}
            <div className={styles.ctaButtonGroup}>
              {/* Primary Blue Button */}
              <button
                type="button"
                className={styles.proceedCheckoutBtn}
                onClick={() => navigate('/checkout')}
              >
                Tiến hành thanh toán
              </button>

              {/* PayPal Gold Button */}
              <button
                type="button"
                className={styles.paypalBtn}
                onClick={() => alert('Chuyển hướng đến cổng thanh toán PayPal...')}
              >
                <span>Thanh toán với</span>
                <span className={styles.paypalText}>
                  <em>Pay</em><strong>Pal</strong>
                </span>
              </button>

              {/* Multi-Address Gray Outline Button */}
              <button
                type="button"
                className={styles.multipleAddressesBtn}
                onClick={() => navigate('/checkout')}
              >
                Thanh toán với nhiều địa chỉ
              </button>
            </div>

            {/* Zip Financing Teaser matching Figma */}
            <div className={styles.zipBanner}>
              <span className={styles.zipTag}>zip</span>
              <span>Sở hữu ngay, trả góp 0% lãi suất tới 6 tháng</span>
              <a href="#zip" onClick={e => { e.preventDefault(); alert('Chính sách trả góp 0% lãi suất qua Zip / PayLater') }}>Tìm hiểu thêm</a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
