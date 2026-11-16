import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { HomeData } from './homeData'
import styles from './HomePage.module.css'

interface ProductPreview {
  id: string
  name: string
  image: string
  price: string
  oldPrice?: string
  inStock: boolean
  reviews: number
  bannerLabel?: string
  bannerColor?: string
}

const newProductsList: ProductPreview[] = [
  {
    id: 'prod-1',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'prod-2',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: false, // check availability
    reviews: 4,
  },
  {
    id: 'prod-3',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'prod-4',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'prod-5',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'prod-6',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
  },
]

const customBuildsList: ProductPreview[] = [
  {
    id: 'cb-1',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
    bannerLabel: 'CHARLIE V6',
    bannerColor: '#c2410c',
  },
  {
    id: 'cb-2',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
    bannerLabel: 'BRAVO V6',
    bannerColor: '#b91c1c',
  },
  {
    id: 'cb-3',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
    bannerLabel: 'ALPHA V6',
    bannerColor: '#6d28d9',
  },
  {
    id: 'cb-4',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
    bannerLabel: 'ZULU V6',
    bannerColor: '#4f46e5',
  },
  {
    id: 'cb-5',
    name: 'EX DISPLAY : MSI Pro 16 Flex-036AU 15.6 MULTITOUCH All-In-One',
    image: 'https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=300&auto=format&fit=crop&q=80',
    price: '$499.00',
    oldPrice: '$499.00',
    inStock: true,
    reviews: 4,
    bannerLabel: 'DELTA V6',
    bannerColor: '#1d4ed8',
  },
]

const laptopSeriesList: ProductPreview[] = [
  {
    id: 'lp-1',
    name: 'EX DISPLAY : MSI GS66 Stealth 10SGS 15.6 300Hz Gaming Laptop',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=300&auto=format&fit=crop&q=80',
    price: '$3,299.00',
    oldPrice: '$3,799.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'lp-2',
    name: 'EX DISPLAY : MSI GE66 Raider 10SFS 15.6 OLED Gaming Laptop',
    image: 'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=300&auto=format&fit=crop&q=80',
    price: '$2,899.00',
    oldPrice: '$3,199.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'lp-3',
    name: 'EX DISPLAY : MSI GL65 Leopard 10SDK 144Hz Gaming Laptop',
    image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&auto=format&fit=crop&q=80',
    price: '$1,699.00',
    oldPrice: '$1,899.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'lp-4',
    name: 'EX DISPLAY : MSI Prestige 15 A10SC Professional Laptop',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
    price: '$1,999.00',
    oldPrice: '$2,199.00',
    inStock: true,
    reviews: 4,
  },
  {
    id: 'lp-5',
    name: 'EX DISPLAY : MSI Modern 14 A10M Ultra-Thin Laptop',
    image: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=300&auto=format&fit=crop&q=80',
    price: '$1,199.00',
    oldPrice: '$1,349.00',
    inStock: true,
    reviews: 4,
  },
]

export function HomePage({ data: _data }: { data?: HomeData }) {
  const navigate = useNavigate()
  const [activeSeriesTab, setActiveSeriesTab] = useState<'GS' | 'GT' | 'GL' | 'GE'>('GS')

  return (
    <div className={styles.techStoreHome}>
      {/* 1. MSI EOFY Deal Hero Banner (Matching Figma Group 56) */}
      <section className={styles.heroSection} aria-label="Khuyến mãi nổi bật">
        <div className={styles.heroBanner}>
          {/* Arrow Left */}
          <button type="button" className={styles.bannerArrowLeft} aria-label="Banner trước">
            ‹
          </button>

          {/* Left Content */}
          <div className={styles.heroLeft}>
            <div className={styles.msiLogoRow}>
              <span className={styles.msiText}>msi</span>
              <span className={styles.eofyBadge}>EOFY DEAL</span>
            </div>

            <h1 className={styles.heroTitle}>
              TẶNG NGAY MÀN HÌNH GAMING CAO CẤP
            </h1>

            <p className={styles.heroSubtitle}>
              KHI MUA MÁY TÍNH ĐỂ BÀN MSI GAMING ĐƯỢC CHỈ ĐỊNH
            </p>

            <button
              type="button"
              className={styles.shopNowBtn}
              onClick={() => navigate('/products')}
            >
              XEM NGAY
            </button>

            <p className={styles.validityNotice}>
              ÁP DỤNG ĐẾN HẾT NGÀY 07/09/2026 HOẶC ĐẾN KHI HẾT QUÀ TẶNG.
            </p>
          </div>

          {/* Right Product Imagery */}
          <div className={styles.heroRight}>
            <div className={styles.bonusBadge}>
              <span>TRỊ GIÁ LÊN ĐẾN</span>
              <strong>8.990.000₫</strong>
            </div>

            <div className={styles.techArtwork}>
              <img
                src="https://images.unsplash.com/photo-1547082299-de196ea013d6?w=600&auto=format&fit=crop&q=80"
                alt="MSI Gaming Monitor and PC"
                className={styles.monitorImg}
              />
              <img
                src="https://images.unsplash.com/photo-1587831990711-23ca6441447b?w=400&auto=format&fit=crop&q=80"
                alt="MSI Gaming Desktop Tower"
                className={styles.desktopImg}
              />
            </div>

            <div className={styles.intelBadge}>
              <span>intel</span>
              <strong>CORE i9</strong>
              <small>10TH GEN</small>
            </div>
          </div>

          {/* Arrow Right */}
          <button type="button" className={styles.bannerArrowRight} aria-label="Banner kế tiếp">
            ›
          </button>
        </div>

        {/* Dots */}
        <div className={styles.heroDots}>
          <span className={`${styles.dot} ${styles.activeDot}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </section>

      {/* 2. New Products Carousel (Matching Figma 50:9) */}
      <section className={styles.sectionWrap} id="san-pham-noi-bat">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionHeading}>
            Sản phẩm mới <span className={styles.subHeading}>(Sản phẩm nổi bật)</span>
          </h2>
          <a href="/products" className={styles.seeAllLink}>
            Xem tất cả sản phẩm
          </a>
        </div>

        <div className={styles.carouselContainer}>
          <button type="button" className={styles.carouselArrowLeft} aria-label="Xem sản phẩm trước">
            ‹
          </button>

          <div className={styles.productRowSix}>
            {newProductsList.map(prod => (
              <div
                key={prod.id}
                className={styles.productCard}
                onClick={() => navigate('/products/nova-14')}
                role="button"
                tabIndex={0}
              >
                {/* Stock status */}
                <div className={styles.stockStatus}>
                  {prod.inStock ? (
                    <span className={styles.inStock}>
                      <span className={styles.stockDot} /> Còn hàng
                    </span>
                  ) : (
                    <span className={styles.checkAvailability}>
                      <span className={styles.stockDotRed} /> Liên hệ cửa hàng
                    </span>
                  )}
                </div>

                {/* Floating Action Buttons (Wishlist & Compare) */}
                <div className={styles.topActions}>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="Thêm vào yêu thích"
                    aria-label="Yêu thích"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách yêu thích!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="So sánh sản phẩm"
                    aria-label="So sánh"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách so sánh!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </button>
                </div>

                {/* Thumb */}
                <div className={styles.thumbWrapper}>
                  <img src={prod.image} alt={prod.name} className={prod.id ? styles.productImg : ''} />
                </div>

                {/* Reviews */}
                <div className={styles.reviewsRow}>
                  <div className={styles.stars}>★★★★★</div>
                  <span className={styles.reviewCount}>({prod.reviews} đánh giá)</span>
                </div>

                {/* Name */}
                <h3 className={styles.productName}>{prod.name}</h3>

                {/* Prices */}
                <div className={styles.priceRow}>
                  {prod.oldPrice && <span className={styles.oldPrice}>{prod.oldPrice}</span>}
                  <strong className={styles.currentPrice}>{prod.price}</strong>
                </div>

                {/* Hover Add To Cart Button */}
                <div className={styles.hoverCartWrap}>
                  <button
                    type="button"
                    className={styles.addToCartPillBtn}
                    onClick={e => {
                      e.stopPropagation()
                      navigate('/cart')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className={styles.carouselArrowRight} aria-label="Xem thêm sản phẩm">
            ›
          </button>
        </div>
      </section>

      {/* 3. Zip Financing Promo Bar (Matching Figma Group 131) */}
      <section className={styles.zipBanner} id="zip-financing" aria-label="Ưu đãi trả góp Zip">
        <div className={styles.zipInner}>
          <div className={styles.zipBadgeCircle}>
            <span className={styles.zipLogoText}>zip</span>
          </div>
          <span className={styles.zipDivider}>|</span>
          <div className={styles.zipMessage}>
            <strong>Sở hữu ngay hôm nay, trả góp 0% lãi suất lên đến 6 tháng cùng Zip.</strong>
            <a href="#zip-learn-more" id="zip-learn-more" className={styles.learnMoreLink}>
              Tìm hiểu thêm
            </a>
          </div>
        </div>
      </section>

      {/* 4. Custome Builds Section (Matching Figma 50:225 Component 6) */}
      <section className={styles.sectionWrap} id="custom-builds" aria-label="Khám phá thêm sản phẩm">
        <div className={styles.customBuildsRow}>
          {/* Vertical Featured Card */}
          <div
            className={styles.verticalFeaturedCard}
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=500&auto=format&fit=crop&q=80)',
            }}
          >
            <div className={styles.verticalCardContent}>
              <h2 className={styles.verticalTitle}>Xây dựng cấu hình PC</h2>
              <span className={styles.verticalSubtitle}>Khám phá thêm sản phẩm</span>
            </div>
            <a href="/products?category=phu-kien" className={styles.verticalLink}>
              Xem tất cả sản phẩm
            </a>
          </div>

          {/* 5 Custom PC Cards */}
          <div className={styles.fiveCardsRow}>
            {customBuildsList.map(item => (
              <div
                key={item.id}
                className={styles.productCard}
                onClick={() => navigate('/products/nova-14')}
                role="button"
                tabIndex={0}
              >
                {/* Banner Label */}
                {item.bannerLabel && (
                  <div
                    className={styles.bannerHeaderLabel}
                    style={{ backgroundColor: item.bannerColor || '#c2410c' }}
                  >
                    {item.bannerLabel}
                  </div>
                )}

                <div className={styles.stockStatus}>
                  <span className={styles.inStock}>
                    <span className={styles.stockDot} /> Còn hàng
                  </span>
                </div>

                {/* Floating Action Buttons */}
                <div className={styles.topActions}>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="Thêm vào yêu thích"
                    aria-label="Yêu thích"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách yêu thích!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="So sánh sản phẩm"
                    aria-label="So sánh"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách so sánh!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </button>
                </div>

                <div className={styles.thumbWrapper}>
                  <img src={item.image} alt={item.name} className={styles.productImg} />
                </div>

                <div className={styles.reviewsRow}>
                  <div className={styles.stars}>★★★★★</div>
                  <span className={styles.reviewCount}>({item.reviews} đánh giá)</span>
                </div>

                <h3 className={styles.productName}>{item.name}</h3>

                <div className={styles.priceRow}>
                  {item.oldPrice && <span className={styles.oldPrice}>{item.oldPrice}</span>}
                  <strong className={styles.currentPrice}>{item.price}</strong>
                </div>

                <div className={styles.hoverCartWrap}>
                  <button
                    type="button"
                    className={styles.addToCartPillBtn}
                    onClick={e => {
                      e.stopPropagation()
                      navigate('/cart')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. MSI Laptop Series Tabs & Section (Matching Figma Group 68) */}
      <section className={styles.sectionWrap} id="msi-series">
        {/* Series Tabs */}
        <div className={styles.seriesTabs}>
          {(['GS', 'GT', 'GL', 'GE'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className={`${styles.seriesTabBtn} ${activeSeriesTab === tab ? styles.activeSeriesTab : ''}`}
              onClick={() => setActiveSeriesTab(tab)}
            >
              MSI {tab} Series
            </button>
          ))}
        </div>

        {/* Laptop Cards Row */}
        <div className={styles.customBuildsRow}>
          {/* Vertical Featured Card */}
          <div
            className={styles.verticalFeaturedCard}
            style={{
              backgroundImage: 'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&auto=format&fit=crop&q=80)',
            }}
          >
            <div className={styles.verticalCardContent}>
              <h2 className={styles.verticalTitle}>MSI {activeSeriesTab} Series</h2>
              <span className={styles.verticalSubtitle}>Laptop gaming cao cấp</span>
            </div>
            <a href="/products?category=laptop" className={styles.verticalLink}>
              Xem tất cả sản phẩm
            </a>
          </div>

          {/* 5 Laptops */}
          <div className={styles.fiveCardsRow}>
            {laptopSeriesList.map(item => (
              <div
                key={item.id}
                className={styles.productCard}
                onClick={() => navigate('/products/nova-14')}
                role="button"
                tabIndex={0}
              >
                <div className={styles.stockStatus}>
                  <span className={styles.inStock}>
                    <span className={styles.stockDot} /> Còn hàng
                  </span>
                </div>

                {/* Floating Action Buttons */}
                <div className={styles.topActions}>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="Thêm vào yêu thích"
                    aria-label="Yêu thích"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách yêu thích!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.actionCircleBtn}
                    title="So sánh sản phẩm"
                    aria-label="So sánh"
                    onClick={e => {
                      e.stopPropagation()
                      alert('Đã thêm vào danh sách so sánh!')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                  </button>
                </div>

                <div className={styles.thumbWrapper}>
                  <img src={item.image} alt={item.name} className={styles.productImg} />
                </div>

                <div className={styles.reviewsRow}>
                  <div className={styles.stars}>★★★★★</div>
                  <span className={styles.reviewCount}>({item.reviews} đánh giá)</span>
                </div>

                <h3 className={styles.productName}>{item.name}</h3>

                <div className={styles.priceRow}>
                  {item.oldPrice && <span className={styles.oldPrice}>{item.oldPrice}</span>}
                  <strong className={styles.currentPrice}>{item.price}</strong>
                </div>

                <div className={styles.hoverCartWrap}>
                  <button
                    type="button"
                    className={styles.addToCartPillBtn}
                    onClick={e => {
                      e.stopPropagation()
                      navigate('/cart')
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <span>Thêm vào giỏ</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.centerActions}>
          <button
            type="button"
            className={styles.pillActionBtn}
            onClick={() => navigate('/products')}
          >
            Xem thêm sản phẩm
          </button>
        </div>
      </section>

      {/* 6. Brand Logos Bar (Matching Figma Frame 22) */}
      <section className={styles.brandLogosBar} aria-label="Thương hiệu hợp tác">
        <div className={styles.brandLogosInner}>
          <span className={styles.brandNameLogo}>ROCCAT</span>
          <span className={styles.brandNameLogo}>msi</span>
          <span className={styles.brandNameLogo}>RAZER</span>
          <span className={styles.brandNameLogo}>thermaltake</span>
          <span className={styles.brandNameLogo}>ADATA</span>
          <span className={styles.brandNameLogo}>hp</span>
          <span className={styles.brandNameLogo}>GIGABYTE</span>
        </div>
      </section>

      {/* 7. Customer Testimonials (Matching Figma Group 62) */}
      <section className={styles.testimonialSection} aria-label="Đánh giá từ khách hàng">
        <div className={styles.testimonialBox}>
          <div className={styles.quoteMark}>“</div>
          <p className={styles.testimonialQuote}>
            Lần đầu mua sắm tại Tech Store và tôi thực sự ấn tượng với trải nghiệm tuyệt vời. Giao hàng nhanh chóng, đóng gói cẩn thận và hiệu năng dàn máy cực kỳ mạnh mẽ. Rất đáng trải nghiệm!
          </p>
          <div className={styles.testimonialAuthor}>Hoàng Long — Khách hàng thân thiết</div>
          <div className={styles.carouselDots}>
            <span className={styles.activeDot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </div>
        </div>
      </section>

      {/* 8. Service Pillars (Matching Figma Component 16) */}
      <section className={styles.pillarsSection}>
        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Hỗ trợ kỹ thuật 24/7</h3>
          <p>Bảo hành tận nơi lên đến 3 năm giúp bạn hoàn toàn an tâm sử dụng.</p>
        </div>

        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h3>Tài khoản thành viên ưu đãi</h3>
          <p>Nhận chiết khấu độc quyền, miễn phí giao hàng và chuyên viên chăm sóc riêng.</p>
        </div>

        <div className={styles.pillarItem}>
          <div className={styles.pillarIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <h3>Tiết kiệm vượt trội</h3>
          <p>Ưu đãi giảm giá lên đến 70%, cam kết mức giá cạnh tranh nhất thị trường.</p>
        </div>
      </section>

      {/* Sample Disclosure Note */}
      <footer className={styles.disclosureFooter}>
        <p className={styles.note}>Sản phẩm, hình ảnh và giá trên trang dùng để minh họa.</p>
      </footer>
    </div>
  )
}
