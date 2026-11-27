import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { cartApi } from '../../lib/api/cartApi'
import { catalogApi } from '../../lib/api/catalogApi'
import { checkoutApi } from '../../lib/api/checkoutApi'
import type { CheckoutRequest, CheckoutResponse } from './checkoutTypes'
import {
  buildPreviewRequest,
  couponErrorMessage,
  couponRejectReason,
  normalizeCouponCode,
  orderDisplayTotal,
  type CouponItemsInput,
} from './couponPreview'
import styles from './CheckoutPage.module.css'
import cartStyles from '../cart/CartPage.module.css'

interface DisplayOrderItem {
  id: string
  cartItemId?: number
  productId: number
  name: string
  image: string
  priceVnd: number
  quantity: number
  sku: string
}

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function CheckoutPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  // Nguồn đặt hàng: CART hoặc BUY_NOW
  const sourceParam = searchParams.get('source')
  const productIdParam = searchParams.get('productId')
  const quantityParam = searchParams.get('quantity')
  const isBuyNow = sourceParam === 'BUY_NOW'

  // Items State
  const [items, setItems] = useState<DisplayOrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Form State
  const [email, setEmail] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('123 Nguyễn Huệ, Phường Bến Nghé')
  const [city, setCity] = useState('Hồ Chí Minh')
  const [branchId, setBranchId] = useState<number>(1)
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE_MOCK'>('COD')
  const [mockPaymentSuccess, setMockPaymentSuccess] = useState<boolean>(true)
  const [note, setNote] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Mã giảm giá (ADR-024): mã mang từ giỏ hàng được xem trước lại ở đây trước khi hiển thị
  const stateCoupon = normalizeCouponCode((location.state as { couponCode?: string } | null)?.couponCode)
  const [couponInput, setCouponInput] = useState(stateCoupon)
  const [pendingCoupon, setPendingCoupon] = useState(stateCoupon)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponMsg, setCouponMsg] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  // Điền thông tin người dùng từ tài khoản đăng nhập
  useEffect(() => {
    if (user) {
      setEmail(user.email || '')
      setPhone(user.phone || '')
      if (user.fullName) {
        const parts = user.fullName.trim().split(' ')
        if (parts.length > 1) {
          setLastName(parts[0])
          setFirstName(parts.slice(1).join(' '))
        } else {
          setLastName('')
          setFirstName(user.fullName)
        }
      }
    }
  }, [user])

  // Tải danh sách sản phẩm cần thanh toán
  useEffect(() => {
    let isMounted = true

    async function loadItems() {
      setLoadingItems(true)
      setLoadError(null)

      try {
        if (isBuyNow) {
          // Luồng Mua Ngay (BUY_NOW)
          const buyNowQty = quantityParam ? Math.max(1, parseInt(quantityParam, 10)) : 1

          // Nếu có thông tin sản phẩm truyền qua state
          const stateProduct = (location.state as { product?: { id: number | string; name: string; image?: string; priceVnd: number; sku?: string } })?.product
          if (stateProduct) {
            if (isMounted) {
              setItems([{
                id: String(stateProduct.id),
                productId: Number(stateProduct.id),
                name: stateProduct.name,
                image: stateProduct.image || '',
                priceVnd: stateProduct.priceVnd,
                quantity: buyNowQty,
                sku: stateProduct.sku || '',
              }])
            }
          } else if (productIdParam) {
            // Lấy danh sách sản phẩm từ catalog để tìm sản phẩm
            const catalogPage = await catalogApi.getProducts({
              keyword: '',
              category: '',
              brand: '',
              sort: 'default',
              page: 1,
            })
            const found = catalogPage.products.find(p => String(p.id) === String(productIdParam))
            if (found && isMounted) {
              setItems([{
                id: String(found.id),
                productId: Number(found.id),
                name: found.name,
                image: found.image || '',
                priceVnd: found.priceVnd,
                quantity: buyNowQty,
                sku: found.slug || '',
              }])
            } else if (isMounted) {
              setLoadError('Không tìm thấy thông tin sản phẩm để Mua Ngay.')
            }
          } else if (isMounted) {
            setLoadError('Thiếu thông tin sản phẩm Mua Ngay.')
          }
        } else {
          // Luồng Giỏ Hàng (CART)
          if (!isAuthenticated) {
            if (isMounted) setLoadingItems(false)
            return
          }
          const cartData = await cartApi.getCart()
          if (isMounted) {
            if (!cartData.items || cartData.items.length === 0) {
              setItems([])
            } else {
              setItems(cartData.items.map(item => ({
                id: String(item.id),
                cartItemId: item.id,
                productId: item.productId,
                name: item.productName,
                image: item.productImage || '',
                priceVnd: item.priceVnd,
                quantity: item.quantity,
                sku: item.productSku,
              })))
            }
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setLoadError((err as Error)?.message || 'Không thể tải danh sách sản phẩm thanh toán.')
        }
      } finally {
        if (isMounted) {
          setLoadingItems(false)
        }
      }
    }

    loadItems()

    return () => {
      isMounted = false
    }
  }, [isBuyNow, productIdParam, quantityParam, isAuthenticated, location.state])

  // Nguồn hàng gửi kèm khi xem trước mã: đúng source / dòng giỏ hoặc sản phẩm Mua ngay
  const couponItems = (): CouponItemsInput | null => {
    if (items.length === 0) return null
    if (isBuyNow) return { source: 'BUY_NOW', productId: items[0].productId, quantity: items[0].quantity }
    return { source: 'CART', cartItemIds: items.map(i => i.cartItemId!).filter(Boolean) }
  }

  // Mã mang sang từ giỏ hàng: xem trước lại sau khi tải xong danh sách hàng
  useEffect(() => {
    if (loadingItems || !pendingCoupon || items.length === 0) return
    let active = true
    const input: CouponItemsInput = isBuyNow
      ? { source: 'BUY_NOW', productId: items[0].productId, quantity: items[0].quantity }
      : { source: 'CART', cartItemIds: items.map(i => i.cartItemId!).filter(Boolean) }
    checkoutApi.previewCoupon(buildPreviewRequest(pendingCoupon, input))
      .then(res => {
        if (!active) return
        setAppliedCoupon({ code: res.couponCode, discount: res.discountAmount })
        setCouponMsg(`Đã áp dụng mã ${res.couponCode}: giảm ${currency.format(res.discountAmount)}.`)
      })
      .catch(err => {
        if (!active) return
        setAppliedCoupon(null)
        setCouponMsg(couponErrorMessage(err))
      })
      .finally(() => {
        if (active) setPendingCoupon('')
      })
    return () => {
      active = false
    }
  }, [loadingItems, items, pendingCoupon, isBuyNow])

  const handleApplyCoupon = async () => {
    const code = normalizeCouponCode(couponInput)
    const input = couponItems()
    if (!code) {
      setCouponMsg('Vui lòng nhập mã giảm giá.')
      return
    }
    if (!input) return
    setCouponLoading(true)
    try {
      const res = await checkoutApi.previewCoupon(buildPreviewRequest(code, input))
      setAppliedCoupon({ code: res.couponCode, discount: res.discountAmount })
      setCouponMsg(`Đã áp dụng mã ${res.couponCode}: giảm ${currency.format(res.discountAmount)}.`)
    } catch (err: unknown) {
      setAppliedCoupon(null)
      setCouponMsg(couponErrorMessage(err))
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCouponInput('')
    setCouponMsg('')
  }

  // Tính toán tiền hàng (số tiền giảm lấy từ server; đơn thật do server tính lại khi đặt)
  const subtotal = items.reduce((sum, item) => sum + item.priceVnd * item.quantity, 0)
  // Miễn phí vận chuyển cho mọi phương thức (kể cả Hỏa tốc) → tổng = đúng số server thu (ADR-024)
  const discount = appliedCoupon?.discount ?? 0
  const grandTotal = orderDisplayTotal(subtotal, discount)

  // Xử lý gửi đơn hàng
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout')
      return
    }

    if (items.length === 0) {
      setSubmitError('Không có sản phẩm nào trong đơn hàng để thanh toán.')
      return
    }

    setIsSubmitting(true)

    try {
      const recipientFullName = `${lastName} ${firstName}`.trim() || user?.fullName || 'Khách hàng'
      const fullShippingAddress = `${street}, ${city}`.trim()
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      const payload: CheckoutRequest = {
        source: isBuyNow ? 'BUY_NOW' : 'CART',
        selectedCartItemIds: isBuyNow ? undefined : items.map(i => i.cartItemId!).filter(Boolean),
        productId: isBuyNow ? items[0]?.productId : undefined,
        quantity: isBuyNow ? items[0]?.quantity : undefined,
        branchId: branchId,
        paymentMethod,
        mockPaymentSuccess: paymentMethod === 'ONLINE_MOCK' ? mockPaymentSuccess : undefined,
        couponCode: appliedCoupon?.code ?? null,
        recipientName: recipientFullName,
        recipientPhone: phone.trim(),
        shippingAddress: fullShippingAddress,
        notes: note.trim() || null,
        idempotencyKey,
      }

      const response: CheckoutResponse = await checkoutApi.checkout(payload)

      navigate('/checkout/success', {
        state: {
          orderCode: response.orderCode,
          customerName: response.recipientName,
          email,
          phone: response.recipientPhone,
          street,
          city,
          paymentMethod: response.paymentMethod,
          paymentStatus: response.paymentStatus,
          shippingMethod,
          grandTotal: response.finalAmount,
          items: response.items,
        },
      })
    } catch (err: unknown) {
      const message = (err as Error)?.message || 'Đã xảy ra lỗi khi tạo đơn hàng. Vui lòng thử lại.'
      if (couponRejectReason(err)) {
        // Mã không còn hợp lệ lúc đặt: đơn CHƯA được tạo; gỡ mã để khách thấy tổng chưa giảm rồi đặt lại
        setAppliedCoupon(null)
        setCouponMsg(message)
        setSubmitError(`Mã giảm giá không áp dụng được: ${message} Đơn hàng chưa được tạo — vui lòng kiểm tra lại tổng tiền rồi đặt hàng lại.`)
      } else {
        setSubmitError(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || loadingItems) {
    return (
      <div className={styles.checkoutPage}>
        <div style={{ padding: '60px 0', textAlign: 'center', color: '#666' }}>
          <p>Đang chuẩn bị thông tin thanh toán...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.emptyState}>
          <h2>Vui lòng đăng nhập</h2>
          <p>Bạn cần đăng nhập tài khoản Khách hàng để tiến hành đặt hàng và thanh toán.</p>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={() => navigate('/login?redirect=/checkout')}
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.emptyState}>
          <h2>Không thể tải đơn hàng</h2>
          <p>{loadError}</p>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={() => navigate('/products')}
          >
            Quay lại danh sách sản phẩm
          </button>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <div className={styles.emptyState}>
          <h2>Chưa có sản phẩm nào để thanh toán</h2>
          <p>Giỏ hàng của bạn đang trống hoặc bạn chưa chọn sản phẩm nào để đặt hàng.</p>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={() => navigate('/products')}
          >
            Khám phá sản phẩm ngay
          </button>
        </div>
      </div>
    )
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

      {submitError && (
        <div className={styles.errorBanner} role="alert">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{submitError}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className={styles.checkoutLayout}>
        {/* Left Form: Shipping & Payment */}
        <div className={styles.formSection}>
          {/* Step 1: Shipping Address & Branch Selection */}
          <section className={styles.stepBlock}>
            <div className={styles.stepHeader}>
              <span className={styles.stepBadge}>1</span>
              <h2>Địa chỉ nhận hàng & Chi nhánh phục vụ</h2>
            </div>

            <div className={styles.fieldGrid}>
              <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
                <label htmlFor="chk-branch">Chi nhánh xuất hàng và bảo hành <span className={styles.required}>*</span></label>
                <select
                  id="chk-branch"
                  value={branchId}
                  onChange={e => setBranchId(Number(e.target.value))}
                >
                  <option value={1}>Chi nhánh Quận 1 — Showroom 123 Lê Lợi, Quận 1, TP.HCM</option>
                  <option value={2}>Chi nhánh Quận 7 — Showroom 456 Nguyễn Thị Thập, Quận 7, TP.HCM</option>
                </select>
              </div>

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
                  <span>Giao trong 2-3 ngày làm việc • Miễn phí vận chuyển</span>
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
                  <span>Nhận hàng ngay trong ngày hoặc ngày hôm sau • Miễn phí vận chuyển</span>
                </div>
                <div className={styles.radioPrice}>Miễn phí</div>
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
                  <strong>Chuyển khoản Ngân hàng / Thẻ ATM, Visa (ONLINE_MOCK)</strong>
                  <span>Thanh toán trực tuyến giả lập tức thì qua cổng ngân hàng</span>
                </div>
              </label>

              {paymentMethod === 'ONLINE_MOCK' && (
                <div className={styles.mockOutcomeBox} role="group" aria-label="Kết quả thanh toán giả lập">
                  <p className={styles.mockOutcomeTitle}>Tùy chọn giả lập cổng thanh toán:</p>
                  <div className={styles.mockOutcomeOptions}>
                    <label className={styles.mockOutcomeOption}>
                      <input
                        type="radio"
                        name="mockPaymentSuccess"
                        checked={mockPaymentSuccess === true}
                        onChange={() => setMockPaymentSuccess(true)}
                      />
                      <span>Thanh toán thành công (Giả lập)</span>
                    </label>
                    <label className={styles.mockOutcomeOption}>
                      <input
                        type="radio"
                        name="mockPaymentSuccess"
                        checked={mockPaymentSuccess === false}
                        onChange={() => setMockPaymentSuccess(false)}
                      />
                      <span>Thanh toán thất bại (Giả lập)</span>
                    </label>
                  </div>
                </div>
              )}
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
                    <p className={styles.itemName} title={item.name}>{item.name}</p>
                    <div className={styles.itemMeta}>
                      <span>Số lượng: {item.quantity}</span>
                      <strong className={styles.itemPrice}>{currency.format(item.priceVnd)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.divider} />

            {/* Mã giảm giá — tái dùng style ô coupon của CartPage; không lồng <form> trong form đặt hàng */}
            <div className={cartStyles.couponForm}>
              <div className={cartStyles.couponInputGroup}>
                <input
                  type="text"
                  placeholder="Nhập mã giảm giá"
                  aria-label="Mã giảm giá"
                  value={couponInput}
                  onChange={e => setCouponInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleApplyCoupon()
                    }
                  }}
                  disabled={couponLoading || isSubmitting}
                />
                <button
                  type="button"
                  className={cartStyles.couponBtn}
                  onClick={() => void handleApplyCoupon()}
                  disabled={couponLoading || isSubmitting}
                >
                  {couponLoading ? 'Đang kiểm tra...' : 'Áp dụng'}
                </button>
              </div>
              {couponMsg && <p className={cartStyles.couponNotice} role="status">{couponMsg}</p>}
              {appliedCoupon && (
                <button type="button" className={cartStyles.couponBtn} onClick={handleRemoveCoupon} disabled={isSubmitting}>
                  Bỏ mã {appliedCoupon.code}
                </button>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Tạm tính</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
              {appliedCoupon && discount > 0 && (
                <div className={`${styles.summaryRow} ${cartStyles.discountRow}`}>
                  <span>Giảm giá (mã {appliedCoupon.code})</span>
                  <span>-{currency.format(discount)}</span>
                </div>
              )}
              <div className={styles.summaryRow}>
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
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
