import { useNavigate } from 'react-router'
import { Button } from '../../components/ui/Button'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.aboutPage}>
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Về chúng tôi</span>
      </nav>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <span className={styles.tagline}>Hệ thống dành riêng cho bạn</span>
          <h1 className={styles.heroTitle}>Hệ Thống Phân Phối Thiết Bị Công Nghệ Hàng Đầu</h1>
          <p className={styles.heroDesc}>
            Tech Store tự hào là đơn vị tiên phong cung cấp các giải pháp máy tính, laptop gaming, linh kiện PC và thiết bị công nghệ chính hãng chất lượng cao tại Việt Nam. Trải nghiệm dịch vụ chuyên nghiệp, hậu mãi tận tâm và giá thành tốt nhất thị trường.
          </p>
          <div className={styles.heroActions}>
            <Button
              variant="primary"
              className={styles.pillPrimaryBtn}
              onClick={() => navigate('/products')}
            >
              Khám phá sản phẩm
            </Button>
            <Button
              variant="outline"
              className={styles.pillOutlineBtn}
              onClick={() => navigate('/contact')}
            >
              Liên hệ chúng tôi
            </Button>
          </div>
        </div>
        <div className={styles.heroImageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&auto=format&fit=crop&q=80"
            alt="Tech Store showroom"
            className={styles.heroImage}
          />
        </div>
      </section>

      {/* Feature Block 1: In Safe Hands */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <div className={styles.iconBox}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className={styles.blockTitle}>Bạn Luôn Được Đồng Hành Bởi Chuyên Gia</h2>
          <p className={styles.blockDesc}>
            Trải nghiệm hiệu năng vượt trội với những dòng vi xử lý và card đồ họa thế hệ mới nhất. Các cấu hình máy tính tại Tech Store được đội ngũ kỹ sư giàu kinh nghiệm kiểm tra tương thích kỹ lưỡng, tối ưu tản nhiệt và ép xung an toàn nhằm mang lại trải nghiệm làm việc và chơi game đỉnh cao.
          </p>
        </div>
        <div className={styles.featureImageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=600&auto=format&fit=crop&q=80"
            alt="PC Gaming setup"
            className={styles.blockImage}
          />
        </div>
      </section>

      {/* Feature Block 2: Highest Quality (Reversed) */}
      <section className={`${styles.featureBlock} ${styles.reversed}`}>
        <div className={styles.featureText}>
          <div className={styles.iconBox}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className={styles.blockTitle}>Cam Kết 100% Sản Phẩm Chính Hãng</h2>
          <p className={styles.blockDesc}>
            Chúng tôi cam kết sản phẩm phân phối đến tay khách hàng luôn là hàng chính hãng từ các thương hiệu hàng đầu thế giới như MSI, ASUS, Intel, AMD, Corsair. Từng sản phẩm đều có hóa đơn VAT đầy đủ, tem bảo hành chính hãng và hỗ trợ 1 đổi 1 trong vòng 30 ngày nếu phát sinh lỗi từ nhà sản xuất.
          </p>
        </div>
        <div className={styles.featureImageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600&auto=format&fit=crop&q=80"
            alt="Quality products"
            className={styles.blockImage}
          />
        </div>
      </section>

      {/* Feature Block 3: Nationwide Delivery */}
      <section className={styles.featureBlock}>
        <div className={styles.featureText}>
          <div className={styles.iconBox}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <h2 className={styles.blockTitle}>Giao Hàng Nhanh Chóng Toàn Quốc</h2>
          <p className={styles.blockDesc}>
            Tech Store hợp tác cùng các đơn vị vận chuyển hàng đầu để đưa sản phẩm đến tay khách hàng tại tất cả 63 tỉnh thành một cách an toàn và nhanh chóng nhất. Hàng hóa được đóng gói cẩn thận 3 lớp chống sốc chuyên dụng cho linh kiện điện tử.
          </p>
        </div>
        <div className={styles.featureImageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1580927752452-89d86da3fa0a?w=600&auto=format&fit=crop&q=80"
            alt="Packaging and shipping"
            className={styles.blockImage}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonialsSection}>
        <div className={styles.testimonialCard}>
          <p className={styles.quoteText}>
            “Dịch vụ build PC tại Tech Store vượt xa mong đợi của tôi. Máy chạy cực kỳ êm ái, cáp gọn gàng và nhân viên tư vấn rất nhiệt tình. Chắc chắn tôi sẽ tiếp tục ủng hộ!”
          </p>
          <div className={styles.authorInfo}>
            <strong>Trần Quốc Bảo</strong>
            <span>Nhà sáng tạo nội dung & Kỹ sư phần mềm</span>
          </div>
        </div>
      </section>

      {/* Bottom Service Pillars */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>🎧</div>
          <h3>Product Support</h3>
          <p>Hỗ trợ kỹ thuật 24/7 từ chuyên viên nhiều năm kinh nghiệm</p>
        </div>
        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>👤</div>
          <h3>Personal Account</h3>
          <p>Dễ dàng theo dõi đơn hàng, tích điểm đổi quà và quản lý bảo hành</p>
        </div>
        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>🏷️</div>
          <h3>Amazing Savings</h3>
          <p>Chương trình khuyến mãi và ưu đãi trả góp 0% lãi suất diễn ra hàng tuần</p>
        </div>
      </section>
    </div>
  )
}
