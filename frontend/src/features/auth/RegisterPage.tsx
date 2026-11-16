import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import styles from './RegisterPage.module.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.')
      return
    }

    setIsLoading(true)

    // Simulate registration
    setTimeout(() => {
      setIsLoading(false)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    }, 600)
  }

  return (
    <div className={styles.registerPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Tạo tài khoản mới</span>
      </nav>

      <h1 className={styles.pageTitle}>Tạo tài khoản khách hàng mới</h1>

      <div className={styles.registerContainer}>
        {success ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2>Đăng ký tài khoản thành công!</h2>
            <p>Hệ thống đang chuyển hướng bạn về trang Đăng nhập...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className={styles.registerForm}>
            {error && (
              <div role="alert" className={styles.errorAlert}>
                {error}
              </div>
            )}

            <fieldset className={styles.formSection}>
              <legend className={styles.sectionLegend}>Thông tin cá nhân</legend>

              <div className={styles.rowTwoCols}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-lastname">Họ & tên đệm <span className={styles.required}>*</span></label>
                  <input
                    id="reg-lastname"
                    type="text"
                    required
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Nguyễn"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-firstname">Tên <span className={styles.required}>*</span></label>
                  <input
                    id="reg-firstname"
                    type="text"
                    required
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Văn A"
                  />
                </div>
              </div>

              <div className={styles.rowTwoCols}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-email">Email <span className={styles.required}>*</span></label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-phone">Số điện thoại <span className={styles.required}>*</span></label>
                  <input
                    id="reg-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0901234567"
                  />
                </div>
              </div>

              <label className={styles.newsletterCheckbox}>
                <input
                  type="checkbox"
                  checked={subscribeNewsletter}
                  onChange={e => setSubscribeNewsletter(e.target.checked)}
                />
                <span>Đăng ký nhận bản tin khuyến mãi & công nghệ mới</span>
              </label>
            </fieldset>

            <fieldset className={styles.formSection}>
              <legend className={styles.sectionLegend}>Thông tin đăng nhập</legend>

              <div className={styles.rowTwoCols}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-password">Mật khẩu <span className={styles.required}>*</span></label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-confirm">Xác nhận mật khẩu <span className={styles.required}>*</span></label>
                  <input
                    id="reg-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                  />
                </div>
              </div>
            </fieldset>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.createAccountBtn}
              >
                {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
              </button>

              <div className={styles.alreadyHaveAccount}>
                <span>Đã có tài khoản?</span>
                <button
                  type="button"
                  className={styles.loginLinkBtn}
                  onClick={() => navigate('/login')}
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
