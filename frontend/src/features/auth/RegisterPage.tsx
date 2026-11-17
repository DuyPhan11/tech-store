import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../lib/api/apiClient'
import { authApi } from '../../lib/api/authApi'
import styles from './RegisterPage.module.css'

export function RegisterPage() {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [otpNotice, setOtpNotice] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Countdown timer for resend OTP cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  const handleSendOtp = async () => {
    setError(null)
    setOtpNotice(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email trước khi yêu cầu mã OTP.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Địa chỉ email không đúng định dạng.')
      return
    }

    setIsSendingOtp(true)
    try {
      const res = await authApi.requestRegisterOtp({ email: trimmedEmail })
      setOtpNotice(res.message || 'Mã OTP đã được gửi đến email (hiệu lực 5 phút).')
      setResendCooldown(res.resendCooldownSeconds || 60)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể gửi mã OTP. Vui lòng thử lại.')
      }
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setOtpNotice(null)

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự.')
      return
    }

    const trimmedOtp = otp.trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã xác thực OTP 6 chữ số.')
      return
    }

    const fullName = `${lastName.trim()} ${firstName.trim()}`.trim()
    if (!fullName) {
      setError('Vui lòng nhập họ và tên.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.register({
        email: email.trim(),
        otp: trimmedOtp,
        fullName,
        phone: phone.trim(),
        password,
      })

      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Đăng ký không thành công. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
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

              <div className={styles.rowTwoCols}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="reg-otp">Mã xác thực OTP (6 chữ số) <span className={styles.required}>*</span></label>
                  <div className={styles.otpInputGroup}>
                    <input
                      id="reg-otp"
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Ví dụ: 123456"
                    />
                    <button
                      type="button"
                      className={styles.sendOtpBtn}
                      disabled={isSendingOtp || resendCooldown > 0 || !email}
                      onClick={handleSendOtp}
                    >
                      {isSendingOtp
                        ? 'Đang gửi...'
                        : resendCooldown > 0
                          ? `Gửi lại (${resendCooldown}s)`
                          : 'Gửi mã OTP'}
                    </button>
                  </div>
                  {otpNotice && <span className={styles.otpNotice}>{otpNotice}</span>}
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
