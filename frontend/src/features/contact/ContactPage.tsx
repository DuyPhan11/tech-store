import { useState } from 'react'
import styles from './ContactPage.module.css'

export function ContactPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <div className={styles.contactPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Liên hệ</span>
      </nav>

      <h1 className={styles.pageTitle}>Liên hệ với chúng tôi</h1>
      <p className={styles.pageDesc}>
        Chúng tôi luôn lắng nghe và sẵn sàng hỗ trợ quý khách hàng. Vui lòng gửi thắc mắc hoặc yêu cầu tư vấn, đội ngũ Tech Store sẽ phản hồi trong thời gian sớm nhất.
      </p>

      <div className={styles.contactLayout}>
        {/* Left Form */}
        <div className={styles.formSection}>
          {submitted ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✓</div>
              <h2>Cảm ơn bạn đã liên hệ!</h2>
              <p>Tin nhắn của bạn đã được gửi thành công. Chuyên viên chăm sóc khách hàng của Tech Store sẽ liên hệ lại qua email <strong>{email}</strong> trong vòng 24 giờ làm việc.</p>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={() => {
                  setSubmitted(false)
                  setMessage('')
                }}
              >
                Gửi thêm tin nhắn khác
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.contactForm}>
              <div className={styles.fieldRow}>
                <div className={styles.fieldGroup}>
                  <label htmlFor="ct-name">Họ và tên của bạn <span className={styles.required}>*</span></label>
                  <input
                    id="ct-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div className={styles.fieldGroup}>
                  <label htmlFor="ct-email">Địa chỉ Email <span className={styles.required}>*</span></label>
                  <input
                    id="ct-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="ct-phone">Số điện thoại liên hệ</label>
                <input
                  id="ct-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0901234567"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="ct-message">Nội dung câu hỏi / Góp ý <span className={styles.required}>*</span></label>
                <textarea
                  id="ct-message"
                  required
                  rows={6}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Nhập nội dung bạn cần hỗ trợ về sản phẩm, dịch vụ hoặc bảo hành..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitBtn}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
              </button>
            </form>
          )}
        </div>

        {/* Right Info Box */}
        <aside className={styles.infoAside}>
          <div className={styles.infoCard}>
            <div className={styles.infoItem}>
              <div className={styles.itemIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.itemText}>
                <strong>Địa chỉ showroom:</strong>
                <p>123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.itemIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className={styles.itemText}>
                <strong>Hotline tư vấn & hỗ trợ:</strong>
                <p>(028) 3822 6789 - 1800 6868</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.itemIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className={styles.itemText}>
                <strong>Thời gian mở cửa:</strong>
                <p>Thứ 2 - Thứ 6: 08:30 - 20:30</p>
                <p>Thứ 7 - Chủ Nhật: 09:00 - 18:00</p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <div className={styles.itemIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className={styles.itemText}>
                <strong>Email hỗ trợ:</strong>
                <p>support@techstore.vn</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
