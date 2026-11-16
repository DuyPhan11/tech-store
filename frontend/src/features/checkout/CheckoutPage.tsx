import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import styles from './CheckoutPage.module.css'

interface OrderItem {
  id: string
  name: string
  image: string
  priceVnd: number
  quantity: number
  sku: string
}

const defaultItems: OrderItem[] = [
  {
    id: 'prod-1',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=200&auto=format&fit=crop&q=60',
    priceVnd: 12490000,
    quantity: 1,
    sku: 'MSI-PRO-16',
  },
  {
    id: 'prod-2',
    name: 'MSI MPG Trident AS 10SC-1208AU Gaming Desktop PC',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=200&auto=format&fit=crop&q=60',
    priceVnd: 28990000,
    quantity: 1,
    sku: 'MSI-TRI-AS',
  },
]

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function CheckoutPage() {
  const navigate = useNavigate()

  // Form State
  const [email, setEmail] = useState('khachhang1@techstore.vn')
  const [firstName, setFirstName] = useState('Duy')
  const [lastName, setLastName] = useState('Nguyễn')
  const [phone, setPhone] = useState('0901234567')
  const [street, setStreet] = useState('123 Nguyễn Huệ, Phường Bến Nghé')
  const [city, setCity] = useState('Hồ Chí Minh')
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_MOCK'>('COD')
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const items = defaultItems
  const subtotal = items.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0)
  const shippingFee = shippingMethod === 'standard' ? 0 : 150000
  const grandTotal = subtotal + shippingFee

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate placing order
    setTimeout(() => {
      setIsSubmitting(false)
      const orderCode = `TS-${Math.floor(100000 + Math.random() * 900000)}`
      navigate('/checkout/success', {
        state: {
          orderCode,
          customerName: `${lastName} ${firstName}`,
          email,
          phone,
          street,
          city,
          paymentMethod,
          shippingMethod,
          grandTotal,
          items,
        },
      })
    }, 600)
  }

  return (
    <div className={styles.checkoutPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <a href="/cart">Giỏ hàng</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Thanh toán</span>
      </nav>

      <h1 className={styles.pageTitle}>Thanh toán đơn hàng</h1>

      <form onSubmit={handleSubmitOrder} className={styles.checkoutLayout}>
        {/* Left Form: Shipping & Payment */}
        <div className={styles.formSection}>
          {/* Step 1: Shipping Address */}
          <section className={styles.stepBlock}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>1</span>
              <h2>Địa chỉ nhận hàng</h2>
            </div>

            <div className={styles.fieldGrid}>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label htmlFor="chk-email">Địa chỉ Email <span className={styles.required}>*</span></label>
                <input
                  id="chk-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="chk-lastname">Họ & tên đệm <span className={styles.required}>*</span></label>
                <input
                  id="chk-lastname"
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Nguyễn"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="chk-firstname">Tên <span className={styles.required}>*</span></label>
                <input
                  id="chk-firstname"
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Văn A"
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label htmlFor="chk-phone">Số điện thoại liên hệ <span className={styles.required}>*</span></label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0901234567"
                />
              </div>

              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label htmlFor="chk-street">Địa chỉ chi tiết (Số nhà, tên đường, phường/xã) <span className={styles.required}>*</span></label>
                <input
                  id="chk-street"
                  type="text"
                  required
                  value={street}
                  onChange={e => setStreet(e.target.value)}
                  placeholder="123 Đường Lê Lợi, Phường Bến Nghé"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="chk-city">Tỉnh / Thành phố <span className={styles.required}>*</span></label>
                <select id="chk-city" value={city} onChange={e => setCity(e.target.value)}>
                  <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Hải Phòng">Hải Phòng</option>
                  <option value="Khác">Tỉnh thành khác</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="chk-note">Ghi chú giao hàng (Tùy chọn)</label>
                <input
                  id="chk-note"
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Giao giờ hành chính, gọi trước khi đến..."
                />
              </div>
            </div>
          </section>

          {/* Step 2: Shipping Methods */}
          <section className={styles.stepBlock}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>2</span>
              <h2>Phương thức vận chuyển</h2>
            </div>

            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${shippingMethod === 'standard' ? styles.activeRadio : ''}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === 'standard'}
                  onChange={() => setShippingMethod('standard')}
                />
                <div className={styles.radioLabel}>
                  <strong>Giao hàng Tiêu chuẩn</strong>
                  <span>Giao trong 2-3 ngày làm việc • Miễn phí vận chuyển cho đơn hàng lớn</span>
                </div>
                <div className={styles.radioPrice}>Miễn phí</div>
              </label>

              <label className={`${styles.radioCard} ${shippingMethod === 'express' ? styles.activeRadio : ''}`}>
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === 'express'}
                  onChange={() => setShippingMethod('express')}
                />
                <div className={styles.radioLabel}>
                  <strong>Giao hàng Hỏa tốc 24H</strong>
                  <span>Nhận hàng ngay trong ngày hoặc ngày hôm sau</span>
                </div>
                <div className={styles.radioPrice}>{currency.format(150000)}</div>
              </label>
            </div>
          </section>

          {/* Step 3: Payment Method */}
          <section className={styles.stepBlock}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>3</span>
              <h2>Phương thức thanh toán</h2>
            </div>

            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${paymentMethod === 'COD' ? styles.activeRadio : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="COD"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                />
                <div className={styles.radioLabel}>
                  <strong>Thanh toán tiền mặt khi nhận hàng (COD)</strong>
                  <span>Thanh toán trực tiếp cho nhân viên giao vận khi kiểm tra và nhận hàng</span>
                </div>
              </label>

              <label className={`${styles.radioCard} ${paymentMethod === 'ONLINE_MOCK' ? styles.activeRadio : ''}`}>
                <input
                  type="radio"
                  name="payment"
                  value="ONLINE_MOCK"
                  checked={paymentMethod === 'ONLINE_MOCK'}
                  onChange={() => setPaymentMethod('ONLINE_MOCK')}
                />
                <div className={styles.radioLabel}>
                  <strong>Chuyển khoản Ngân hàng / Thẻ ATM, Visa</strong>
                  <span>Hệ thống chuyển khoản tức thì qua cổng ngân hàng hoặc quét mã VietQR</span>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right Summary Section */}
        <aside className={styles.summarySection}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Đơn hàng ({items.length} sản phẩm)</h2>

            <div className={styles.itemList}>
              {items.map(item => (
                <div key={item.id} className={styles.itemRow}>
                  <img src={item.image} alt={item.name} className={styles.itemThumb} />
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <div className={styles.itemMeta}>
                      <span>Số lượng: {item.quantity}</span>
                      <strong className={styles.itemPrice}>{currency.format(item.priceVnd)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.divider} />

            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Tạm tính</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Phí vận chuyển</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : currency.format(shippingFee)}</span>
              </div>
              <div className={styles.divider} />
              <div className={`${styles.summaryRow} ${styles.grandTotalRow}`}>
                <span>Tổng cộng thanh toán</span>
                <strong className={styles.grandPrice}>{currency.format(grandTotal)}</strong>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.placeOrderBtn}
            >
              {isSubmitting ? 'Đang xử lý đơn hàng...' : 'Đặt hàng ngay'}
            </button>

            <p className={styles.securityNotice}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Giao dịch được bảo mật tuyệt đối với chứng chỉ SSL 256-bit
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}
