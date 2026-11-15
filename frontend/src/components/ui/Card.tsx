import type { ComponentProps, ReactNode } from 'react'
import styles from './ui.module.css'

type CardProps = ComponentProps<'article'> & { media?: ReactNode }

export function Card({ media, children, className = '', ...props }: CardProps) {
  return (
    <article {...props} className={`${styles.card} ${className}`}>
      {media && <div className={styles.media}>{media}</div>}
      <div className={styles.cardBody}>{children}</div>
    </article>
  )
}
