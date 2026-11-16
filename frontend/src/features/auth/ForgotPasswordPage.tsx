import { useState } from 'react'
import { useNavigate } from 'react-router'
import styles from './ForgotPasswordPage.module.css'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setSubmitted(true)
    }, 500)
  }

  return (
    <div className={styles.forgotPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <a href="/login">Đăng nhập</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Quên mật khẩu</span>
      </nav>

      <h1 className={styles.pageTitle}>Quên mật khẩu</h1>

      <div className={styles.container}>
        {submitted ? (
          <div className={styles.successCard}>
            <div className={styles.iconCircle}>✓</div>
            <h2>Đã gửi liên kết khôi phục!</h2>
            <p>
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email <strong>{email}</strong>. Vui lòng kiểm tra hộp thư của bạn.
            </p>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => navigate('/login')}
            >
              Quay lại đăng nhập
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.formCard}>
            <p className={styles.instruction}>
              Vui lòng nhập địa chỉ email liên kết với tài khoản Tech Store của bạn. Chúng tôi sẽ gửi cho bạn đường dẫn để đặt lại mật khẩu mới.
            </p>

            <div className={styles.fieldGroup}>
              <label htmlFor="forgot-email">Địa chỉ Email <span className={styles.required}>*</span></label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitBtn}
              >
                {isLoading ? 'Đang gửi yêu cầu...' : 'Đặt lại mật khẩu'}
              </button>

              <button
                type="button"
                className={styles.cancelLink}
                onClick={() => navigate('/login')}
              >
                Hủy bỏ và quay lại
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
