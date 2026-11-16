import { useLocation, useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import styles from './CheckoutSuccessPage.module.css'

interface LocationState {
  orderCode?: string
  customerName?: string
  email?: string
  phone?: string
  street?: string
  city?: string
  paymentMethod?: string
  grandTotal?: number
}

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function CheckoutSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as LocationState) || {}

  const orderCode = state.orderCode || 'TS-100245'
  const customerName = state.customerName || 'Quý khách hàng'
  const email = state.email || 'customer@example.com'
  const paymentMethodText = state.paymentMethod === 'ONLINE_MOCK'
    ? 'Chuyển khoản Ngân hàng / Thẻ (Online Mock)'
    : 'Thanh toán tiền mặt khi nhận hàng (COD)'

  return (
    <div className={styles.successPage}>
      <div className={styles.successCard}>
        <div className={styles.iconCircle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className={styles.title}>Đặt hàng thành công!</h1>
        <p className={styles.subtitle}>
          Cảm ơn bạn, <strong>{customerName}</strong>! Đơn hàng của bạn đã được ghi nhận vào hệ thống Tech Store.
        </p>

        <div className={styles.orderCodeBadge}>
          <span>Mã đơn hàng:</span>
          <strong>#{orderCode}</strong>
        </div>

        <div className={styles.infoBox}>
          <div className={styles.infoRow}>
            <span>Email nhận thông báo:</span>
            <strong>{email}</strong>
          </div>
          <div className={styles.infoRow}>
            <span>Phương thức thanh toán:</span>
            <strong>{paymentMethodText}</strong>
          </div>
          {state.grandTotal && (
            <div className={styles.infoRow}>
              <span>Tổng thanh toán:</span>
              <strong className={styles.totalPrice}>{currency.format(state.grandTotal)}</strong>
            </div>
          )}
          {state.street && state.city && (
            <div className={styles.infoRow}>
              <span>Địa chỉ nhận hàng:</span>
              <span>{state.street}, {state.city}</span>
            </div>
          )}
        </div>

        <p className={styles.statusNotice}>
          Trạng thái đơn hàng hiện tại là <strong>PENDING (Chờ xác nhận)</strong>. Đội ngũ nhân viên Tech Store sẽ liên hệ xác thực và chuẩn bị hàng trong thời gian sớm nhất.
        </p>

        <div className={styles.actionButtons}>
          <Button
            variant="primary"
            className={styles.pillPrimaryBtn}
            onClick={() => navigate('/products')}
          >
            Tiếp tục mua hàng
          </Button>
          <Button
            variant="outline"
            className={styles.pillOutlineBtn}
            onClick={() => navigate('/account')}
          >
            Quản lý đơn hàng của tôi
          </Button>
        </div>
      </div>
    </div>
  )
}
