import { useState } from 'react'
import styles from './FaqPage.module.css'

interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
}

const faqList: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'warranty',
    question: 'Chính sách bảo hành sản phẩm tại Tech Store như thế nào?',
    answer: 'Tất cả các sản phẩm máy tính để bàn, laptop, linh kiện chính hãng đều được bảo hành theo đúng tiêu chuẩn của nhà sản xuất (từ 12 đến 36 tháng). Tech Store hỗ trợ 1 đổi 1 trong vòng 30 ngày đầu tiên nếu phát sinh lỗi phần cứng do nhà sản xuất.',
  },
  {
    id: 'faq-2',
    category: 'warranty',
    question: 'Quy trình gửi hàng bảo hành từ xa có mất phí không?',
    answer: 'Đối với khách hàng ở ngoài khu vực Hà Nội và TP.HCM, Tech Store hỗ trợ 100% cước phí vận chuyển 2 chiều đối với sản phẩm trong thời gian bảo hành hợp lệ.',
  },
  {
    id: 'faq-3',
    category: 'shipping',
    question: 'Thời gian giao hàng mất bao lâu?',
    answer: 'Nội thành TP.HCM và Hà Nội: Giao hỏa tốc trong 2-4 giờ hoặc trong ngày. Các tỉnh thành khác: Thời gian giao hàng tiêu chuẩn từ 2 - 3 ngày làm việc qua đối tác vận chuyển chuyên nghiệp.',
  },
  {
    id: 'faq-4',
    category: 'shipping',
    question: 'Đơn hàng giá trị bao nhiêu thì được miễn phí vận chuyển?',
    answer: 'Tech Store áp dụng chính sách Miễn phí vận chuyển toàn quốc (Freeship) cho tất cả các đơn hàng có giá trị từ 15.000.000đ trở lên.',
  },
  {
    id: 'faq-5',
    category: 'payment',
    question: 'Tôi có thể thanh toán khi nhận hàng (COD) không?',
    answer: 'Có! Tech Store hỗ trợ hình thức thanh toán COD (tiền mặt khi nhận hàng) trên toàn quốc. Khách hàng được phép đồng kiểm tra ngoại quan gói hàng trước khi thanh toán cho shipper.',
  },
  {
    id: 'faq-6',
    category: 'payment',
    question: 'Cửa hàng có hỗ trợ trả góp 0% lãi suất không?',
    answer: 'Tech Store liên kết với các ngân hàng lớn và đối tác tài chính (Zip, Home Credit, thẻ tín dụng) để cung cấp chương trình trả góp 0% lãi suất với kỳ hạn linh hoạt từ 3 đến 12 tháng.',
  },
  {
    id: 'faq-7',
    category: 'orders',
    question: 'Làm thế nào để tôi theo dõi tiến trình đơn hàng?',
    answer: 'Bạn có thể đăng nhập vào tài khoản và truy cập mục "Đơn hàng của tôi" để xem trạng thái đơn hàng (PENDING, CONFIRMED, SHIPPING, COMPLETED). Ngoài ra hệ thống sẽ gửi SMS và email cập nhật mã vận đơn khi hàng được xuất kho.',
  },
]

export function FaqPage() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-3': true,
    'faq-5': true,
  })

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className={styles.faqPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Hỏi đáp &amp; Điều khoản</span>
      </nav>

      <h1 className={styles.pageTitle}>Câu hỏi thường gặp & Điều khoản dịch vụ</h1>

      <div className={styles.faqLayout}>
        {/* Main FAQ list */}
        <div className={styles.faqList}>
          <section className={styles.sectionGroup}>
            <h2 className={styles.sectionTitle}>1. Chính sách bảo hành & Đổi trả</h2>
            <div className={styles.accordionContainer}>
              {faqList.filter(f => f.category === 'warranty').map(item => (
                <div key={item.id} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={Boolean(openItems[item.id])}
                  >
                    <span>{item.question}</span>
                    <span className={styles.toggleIcon}>{openItems[item.id] ? '−' : '+'}</span>
                  </button>
                  {openItems[item.id] && (
                    <div className={styles.accordionBody}>
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionGroup}>
            <h2 className={styles.sectionTitle}>2. Vận chuyển & Giao nhận hàng</h2>
            <div className={styles.accordionContainer}>
              {faqList.filter(f => f.category === 'shipping').map(item => (
                <div key={item.id} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={Boolean(openItems[item.id])}
                  >
                    <span>{item.question}</span>
                    <span className={styles.toggleIcon}>{openItems[item.id] ? '−' : '+'}</span>
                  </button>
                  {openItems[item.id] && (
                    <div className={styles.accordionBody}>
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.sectionGroup}>
            <h2 className={styles.sectionTitle}>3. Phương thức thanh toán & Đơn hàng</h2>
            <div className={styles.accordionContainer}>
              {faqList.filter(f => f.category === 'payment' || f.category === 'orders').map(item => (
                <div key={item.id} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionHeader}
                    onClick={() => toggleItem(item.id)}
                    aria-expanded={Boolean(openItems[item.id])}
                  >
                    <span>{item.question}</span>
                    <span className={styles.toggleIcon}>{openItems[item.id] ? '−' : '+'}</span>
                  </button>
                  {openItems[item.id] && (
                    <div className={styles.accordionBody}>
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Nav */}
        <aside className={styles.quickNavAside}>
          <div className={styles.quickNavCard}>
            <h3 className={styles.quickNavTitle}>Mục lục tra cứu</h3>
            <ul className={styles.quickNavList}>
              <li><a href="#warranty">Chính sách bảo hành & đổi trả</a></li>
              <li><a href="#shipping">Thời gian & chi phí giao hàng</a></li>
              <li><a href="#payment">Hình thức thanh toán & COD</a></li>
              <li><a href="#installment">Trả góp 0% lãi suất</a></li>
              <li><a href="#security">Bảo mật thông tin khách hàng</a></li>
              <li><a href="/contact">Chưa tìm thấy câu trả lời? Liên hệ ngay</a></li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}
