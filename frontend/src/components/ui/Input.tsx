import { useId, type ComponentProps } from 'react'
import styles from './ui.module.css'

type InputProps = ComponentProps<'input'> & { label: string; error?: string }

export function Input({ id, label, error, className = '', 'aria-describedby': description, ...props }: InputProps) {
  const generated = useId()
  const inputId = id ?? generated
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={styles.field}>
      <label htmlFor={inputId}>{label}</label>
      <input {...props} id={inputId} className={`${styles.input} ${className}`}
        aria-invalid={error ? true : props['aria-invalid']}
        aria-describedby={[description, errorId].filter(Boolean).join(' ') || undefined} />
      {error && <span id={errorId} className={styles.error} role="alert">{error}</span>}
    </div>
  )
}
