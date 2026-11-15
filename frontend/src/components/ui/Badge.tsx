import styles from './ui.module.css'

const order = {
  PENDING: ['Chờ xác nhận', 'warning'],
  CONFIRMED: ['Đã xác nhận', 'primary'],
  SHIPPING: ['Đang giao', 'primary'],
  COMPLETED: ['Hoàn tất', 'success'],
  CANCELLED: ['Đã hủy', 'danger'],
} as const

const payment = {
  UNPAID: ['Chưa thanh toán', 'warning'],
  PAID: ['Đã thanh toán', 'success'],
  CANCELLED: ['Đã hủy thanh toán', 'danger'],
  REFUNDED: ['Đã hoàn tiền', 'muted'],
} as const

type BadgeProps =
  | { type: 'order'; status: keyof typeof order }
  | { type: 'payment'; status: keyof typeof payment }

export function Badge(props: BadgeProps) {
  const [label, tone] = props.type === 'order' ? order[props.status] : payment[props.status]
  return <span className={styles.badge} data-tone={tone}>{label}</span>
}
