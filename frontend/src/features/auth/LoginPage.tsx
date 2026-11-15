import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from './AuthContext'
import { ApiError } from '../../lib/api/apiClient'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import styles from './LoginPage.module.css'

interface LocationState {
  from?: {
    pathname: string
    search?: string
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setGeneralError(null)

    const errors: Record<string, string> = {}
    if (!identifier.trim()) {
      errors.identifier = 'Vui lòng nhập email hoặc số điện thoại'
    }
    if (!password) {
      errors.password = 'Vui lòng nhập mật khẩu'
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const response = await login({
        identifier: identifier.trim(),
        password,
      })

      // Determine redirect destination
      const searchParams = new URLSearchParams(location.search)
      const redirectParam = searchParams.get('redirect')
      const state = location.state as LocationState | null
      const fromPath = state?.from ? `${state.from.pathname}${state.from.search || ''}` : null

      const target = redirectParam || fromPath
      const roles = response.user.roles || []
      const isStaffOrAdmin = roles.includes('ROLE_ADMIN') || roles.includes('ROLE_STAFF')
      const isTargetAdmin = target ? target.startsWith('/admin') : false

      if (target && !target.startsWith('/login') && !(isTargetAdmin && !isStaffOrAdmin)) {
        navigate(target, { replace: true })
      } else {
        navigate(isStaffOrAdmin ? '/admin' : '/', { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setGeneralError('Thông tin đăng nhập không chính xác. Vui lòng kiểm tra lại tài khoản và mật khẩu.')
        } else if (err.status === 403) {
          setGeneralError(err.message || 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')
        } else if (err.status === 400 && err.errors) {
          setFieldErrors(err.errors)
        } else {
          setGeneralError(err.message || 'Đăng nhập không thành công. Vui lòng thử lại.')
        }
      } else {
        setGeneralError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fillDemoAccount = (demoId: string, demoPass: string) => {
    setIdentifier(demoId)
    setPassword(demoPass)
    setGeneralError(null)
    setFieldErrors({})
  }

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>Đăng nhập</h1>
          <p className={styles.subtitle}>Sử dụng tài khoản Tech Store của bạn để tiếp tục</p>
        </div>

        {generalError && (
          <div className={styles.alertError} role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            id="login-identifier"
            label="Email hoặc số điện thoại"
            type="text"
            name="identifier"
            autoComplete="username"
            value={identifier}
            onChange={e => {
              setIdentifier(e.target.value)
              if (fieldErrors.identifier) {
                setFieldErrors(prev => ({ ...prev, identifier: '' }))
              }
            }}
            error={fieldErrors.identifier}
            placeholder="ví dụ: customer@techstore.vn hoặc 0903456789"
            disabled={isSubmitting}
          />

          <Input
            id="login-password"
            label="Mật khẩu"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={e => {
              setPassword(e.target.value)
              if (fieldErrors.password) {
                setFieldErrors(prev => ({ ...prev, password: '' }))
              }
            }}
            error={fieldErrors.password}
            placeholder="Nhập mật khẩu của bạn"
            disabled={isSubmitting}
          />

          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            loadingLabel="Đang đăng nhập..."
            className={styles.submitBtn}
          >
            Đăng nhập
          </Button>
        </form>

        <div className={styles.demoBox}>
          <p className={styles.demoTitle}>Tài khoản Demo thử nghiệm:</p>
          <div className={styles.demoGrid}>
            <Button
              variant="outline"
              className={styles.demoBtn}
              onClick={() => fillDemoAccount('customer@techstore.vn', 'Customer@123')}
            >
              Khách hàng
            </Button>
            <Button
              variant="outline"
              className={styles.demoBtn}
              onClick={() => fillDemoAccount('staff@techstore.vn', 'Staff@123')}
            >
              Nhân viên
            </Button>
            <Button
              variant="outline"
              className={styles.demoBtn}
              onClick={() => fillDemoAccount('admin@techstore.vn', 'Admin@123')}
            >
              Quản trị viên
            </Button>
            <Button
              variant="outline"
              className={styles.demoBtn}
              onClick={() => fillDemoAccount('locked@techstore.vn', 'Customer@123')}
            >
              Bị khóa (403)
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
