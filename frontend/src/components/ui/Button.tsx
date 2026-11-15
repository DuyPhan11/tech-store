import type { ComponentProps } from 'react'
import styles from './ui.module.css'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'secondary' | 'outline'
  loading?: boolean
  loadingLabel?: string
}

export function Button({ variant = 'primary', loading = false, loadingLabel = 'Đang xử lý',
  type = 'button', disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button {...props} type={type} disabled={disabled || loading} aria-busy={loading || undefined}
      className={`${styles.button} ${styles[variant]} ${className}`}>
      {loading && <span aria-hidden="true" className={styles.spinner} />}
      {loading ? loadingLabel : children}
    </button>
  )
}
