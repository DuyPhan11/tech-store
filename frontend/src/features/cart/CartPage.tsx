import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { cartApi } from '../../lib/api/cartApi'
import type { CartResponse } from './cartTypes'
import styles from './CartPage.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponMsg, setCouponMsg] = useState('')
  const [shippingOpen, setShippingOpen] = useState(true)
  const [couponOpen, setCouponOpen] = useState(true)

  const loadCart = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await cartApi.getCart()
      setCart(data)
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
        setError('UNAUTHORIZED')
      } else {
        setError((err as Error)?.message || 'Không thể tải giỏ hàng từ máy chủ.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const items = cart?.items ?? []
  const subtotal = cart?.totalPriceVnd ?? 0
  const shippingFee = items.length === 0 ? 0 : 504000
  const tax = items.length === 0 ? 0 : 45840
  const gst = items.length === 0 ? 0 : 45840
  const grandTotal = Math.max(0, subtotal - discount + shippingFee + tax + gst)

  const handleQuantityChange = async (itemId: number, delta: number) => {
    const currentItem = items.find(i => i.id === itemId)
    if (!currentItem || actionLoading) return
    const newQty = currentItem.quantity + delta
    if (newQty < 1) return

    try {
      setActionLoading(true)
      const updated = await cartApi.updateQuantity(itemId, newQty)
      setCart(updated)
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Lỗi khi cập nhật số lượng sản phẩm')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemove = async (itemId: number) => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const updated = await cartApi.removeItem(itemId)
      setCart(updated)
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Lỗi khi xóa sản phẩm khỏi giỏ hàng')
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearCart = async () => {
    if (actionLoading) return
    try {
      setActionLoading(true)
      const updated = await cartApi.clearCart()
      setCart(updated)
    } catch (err: unknown) {
      alert((err as Error)?.message || 'Lỗi khi xóa toàn bộ giỏ hàng')
    } finally {
      setActionLoading(false)
    }
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

      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#666' }}>
          <p>Đang tải dữ liệu giỏ hàng...</p>
        </div>
      ) : error === 'UNAUTHORIZED' ? (
        <div className={styles.emptyCartCard}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập tài khoản Khách hàng để xem và quản lý giỏ hàng của mình.</p>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={() => navigate('/login?redirect=/cart')}
          >
            Đăng nhập ngay
          </button>
        </div>
      ) : error ? (
        <div className={styles.emptyCartCard}>
          <h2>Không thể tải giỏ hàng</h2>
          <p>{error}</p>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={() => loadCart()}
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
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
                      <img
                        src={item.productImage || 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=200&auto=format&fit=crop&q=60'}
                        alt={item.productName}
                        className={styles.thumb}
                      />
                      <div className={styles.itemMeta}>
                        <a
                          href={item.productSlug ? `/products/${item.productSlug}` : '/products'}
                          className={styles.itemName}
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {item.productName}
                        </a>
                        {item.productSku && (
                          <small style={{ color: '#888', display: 'block', marginTop: '4px' }}>
                            SKU: {item.productSku}
                          </small>
                        )}
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
                            disabled={actionLoading}
                            aria-label="Tăng số lượng"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={item.quantity <= 1 || actionLoading}
                            aria-label="Giảm số lượng"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className={styles.tdSub}>
                      <strong>{currency.format(item.subtotalVnd)}</strong>
                    </td>
                    <td className={styles.tdAction}>
                      <div className={styles.itemActionIcons}>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={actionLoading}
                          className={styles.circleIconBtn}
                          aria-label="Xóa sản phẩm"
                          title="Xóa sản phẩm"
                        >
                          ×
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
                  onClick={handleClearCart}
                  disabled={actionLoading}
                >
                  Xóa giỏ hàng
                </button>
              </div>

              <button
                type="button"
                className={styles.updateCartBtn}
                onClick={loadCart}
                disabled={actionLoading}
              >
                Cập nhật giỏ hàng
              </button>
            </div>
          </div>

          {/* Right Column: Summary Panel */}
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

            {/* Call-To-Action Pill Buttons */}
            <div className={styles.ctaButtonGroup}>
              <button
                type="button"
                className={styles.proceedCheckoutBtn}
                onClick={() => navigate('/checkout')}
              >
                Tiến hành thanh toán
              </button>

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

              <button
                type="button"
                className={styles.multipleAddressesBtn}
                onClick={() => navigate('/checkout')}
              >
                Thanh toán với nhiều địa chỉ
              </button>
            </div>

            {/* Zip Financing Teaser */}
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
