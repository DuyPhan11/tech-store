import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '../../lib/api/apiClient'
import { authApi } from '../../lib/api/authApi'
import styles from './ForgotPasswordPage.module.css'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'EMAIL' | 'RESET' | 'SUCCESS'>('EMAIL')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
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

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      setError('Địa chỉ email không đúng định dạng.')
      return
    }

    setIsLoading(true)
    try {
      const res = await authApi.requestPasswordResetOtp({ email: trimmedEmail })
      setNotice(res.message || 'Nếu email tồn tại, mã OTP đã được gửi đến hộp thư (hiệu lực 15 phút).')
      setResendCooldown(res.resendCooldownSeconds || 60)
      setStep('RESET')
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError(null)
    setNotice(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.')
      return
    }

    setIsSendingOtp(true)
    try {
      const res = await authApi.requestPasswordResetOtp({ email: trimmedEmail })
      setNotice(res.message || 'Mã OTP mới đã được gửi đến email (hiệu lực 15 phút).')
      setResendCooldown(res.resendCooldownSeconds || 60)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Không thể gửi lại mã OTP. Vui lòng thử lại.')
      }
    } finally {
      setIsSendingOtp(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmedOtp = otp.trim()
    if (!trimmedOtp || trimmedOtp.length !== 6) {
      setError('Vui lòng nhập đầy đủ mã OTP 6 chữ số.')
      return
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp. Vui lòng kiểm tra lại.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.resetPassword({
        email: email.trim(),
        otp: trimmedOtp,
        newPassword,
      })

      setStep('SUCCESS')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Đặt lại mật khẩu thất bại. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
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

      <h1 className={styles.pageTitle}>Khôi phục mật khẩu</h1>

      <div className={styles.container}>
        {step === 'SUCCESS' ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✓</div>
            <h2>Đặt lại mật khẩu thành công!</h2>
            <p>
              Mật khẩu tài khoản của bạn đã được cập nhật thành công.<br />
              Đang chuyển hướng bạn về trang Đăng nhập...
            </p>
            <button
              type="button"
              className={styles.submitBtn}
              onClick={() => navigate('/login')}
            >
              Đăng nhập ngay
            </button>
          </div>
        ) : step === 'EMAIL' ? (
          <form onSubmit={handleRequestOtp} className={styles.formCard}>
            <p className={styles.instruction}>
              Vui lòng nhập địa chỉ email liên kết với tài khoản Tech Store của bạn. Hệ thống sẽ gửi mã OTP xác thực (hiệu lực 15 phút) để bạn thiết lập mật khẩu mới.
            </p>

            {error && (
              <div role="alert" className={styles.errorAlert}>
                {error}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="forgot-email">Địa chỉ Email <span className={styles.required}>*</span></label>
              <input
                id="forgot-email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitBtn}
              >
                {isLoading ? 'Đang gửi mã OTP...' : 'Gửi mã xác thực OTP'}
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
        ) : (
          <form onSubmit={handleResetPassword} className={styles.formCard}>
            <p className={styles.instruction}>
              Mã xác thực OTP đã được gửi đến email <strong>{email}</strong> (hiệu lực 15 phút, tối đa 5 lần thử). Vui lòng nhập mã OTP và mật khẩu mới bên dưới.
            </p>

            {notice && (
              <div className={styles.noticeAlert}>
                {notice}
              </div>
            )}

            {error && (
              <div role="alert" className={styles.errorAlert}>
                {error}
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="reset-otp">Mã xác thực OTP (6 chữ số) <span className={styles.required}>*</span></label>
              <div className={styles.otpInputGroup}>
                <input
                  id="reset-otp"
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
                  disabled={isSendingOtp || resendCooldown > 0}
                  onClick={handleResendOtp}
                >
                  {isSendingOtp
                    ? 'Đang gửi...'
                    : resendCooldown > 0
                      ? `Gửi lại (${resendCooldown}s)`
                      : 'Gửi lại mã OTP'}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="reset-new-password">Mật khẩu mới <span className={styles.required}>*</span></label>
              <input
                id="reset-new-password"
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự"
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="reset-confirm-password">Xác nhận mật khẩu mới <span className={styles.required}>*</span></label>
              <input
                id="reset-confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitBtn}
              >
                {isLoading ? 'Đang đặt lại mật khẩu...' : 'Xác nhận đặt lại mật khẩu'}
              </button>

              <button
                type="button"
                className={styles.cancelLink}
                onClick={() => {
                  setStep('EMAIL')
                  setError(null)
                  setNotice(null)
                }}
              >
                ← Nhập lại email khác
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
