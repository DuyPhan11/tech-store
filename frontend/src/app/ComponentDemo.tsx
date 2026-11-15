import { useState } from 'react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import styles from './ComponentDemo.module.css'

export default function ComponentDemo() {
  const [open, setOpen] = useState(false)
  return (
    <main className={styles.demo}>
      <h1>Thư viện component</h1>
      <section>
        <h2>Button</h2>
        {(['primary', 'secondary', 'outline'] as const).map(variant => (
          <div className={styles.row} key={variant}>
            <Button variant={variant}>{variant}</Button>
            <Button variant={variant} disabled>Đã khóa</Button>
            <Button variant={variant} loading>Tiếp tục</Button>
          </div>
        ))}
      </section>
      <section>
        <h2>Input</h2>
        <div className={styles.fields}>
          <Input label="Email" placeholder="Nhập email" type="email" />
          <Input label="Email có lỗi" defaultValue="minh@" error="Nhập địa chỉ email hợp lệ." />
          <Input label="Email đã khóa" placeholder="Nhập email" disabled />
        </div>
      </section>
      <section>
        <h2>Card</h2>
        <Card>
          <small>LAPTOP</small>
          <h3>Laptop Nova 14</h3>
          <small>16 GB · 512 GB SSD</small>
          <strong>18.990.000 ₫</strong>
          <Button onClick={() => setOpen(true)}>Xem mẫu Modal</Button>
        </Card>
      </section>
      <section>
        <h2>Badge</h2>
        <h3>Đơn hàng</h3>
        <div className={styles.row}>
          {(['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'] as const).map(status =>
            <Badge key={status} type="order" status={status} />)}
        </div>
        <h3>Thanh toán</h3>
        <div className={styles.row}>
          {(['UNPAID', 'PAID', 'CANCELLED', 'REFUNDED'] as const).map(status =>
            <Badge key={status} type="payment" status={status} />)}
        </div>
      </section>
      <section>
        <h2>Modal</h2>
        <Button onClick={() => setOpen(true)}>Mở hộp thoại</Button>
        <Modal open={open} title="Hủy đơn hàng?" onClose={() => setOpen(false)}
          actions={<><Button variant="outline" onClick={() => setOpen(false)}>Giữ đơn</Button>
            <Button onClick={() => setOpen(false)}>Xác nhận hủy</Button></>}>
          Đơn hàng sẽ được hủy. Bạn có muốn tiếp tục?
        </Modal>
      </section>
    </main>
  )
}
