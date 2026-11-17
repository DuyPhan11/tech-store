import { useState } from 'react'
import styles from './Layouts.module.css'

interface MegaMenuFlyoutProps {
  isOpen: boolean
  onNavigate: (path: string) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

interface MegaProduct {
  id: string
  slug: string
  title: string
  image: string
  price: string
  oldPrice: string
  reviews: number
}

const SUBCATEGORIES = [
  { id: 'laptop-van-phong', name: 'Laptop văn phòng & Học tập', hasChevron: true },
  { id: 'laptop-gaming', name: 'Laptop chơi game (Gaming)', hasChevron: true },
  { id: 'laptop-mong-nhe', name: 'Laptop mỏng nhẹ thời trang', hasChevron: true },
  { id: 'laptop-workstation', name: 'Dòng máy trạm MSI Workstation', hasChevron: true },
]

const PRODUCTS_BY_CATEGORY: Record<string, MegaProduct[]> = {
  'laptop-van-phong': [
    {
      id: '260301642',
      slug: 'laptop-asus-vivobook-go-14-e1404fa-eb935w-ryzen-5-40-16gb-512gb-windows-11-home',
      title: 'Laptop Asus Vivobook Go 14 E1404FA R5 40 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/qexCUvh-ASrliTTw6635imfDBmjxIDsGC7gVBepCo11oO3JMEk3c7KsRtbr_TfzA5iciTFPwqga-hl3AdYyYE5W9OVUQdVY=w230-rw',
      price: '20.990.000 ₫',
      oldPrice: '28.490.000 ₫',
      reviews: 5,
    },
    {
      id: '260302495',
      slug: 'laptop-asus-vivobook-go-15-e1504fa-bq340w-ryzen-5-40-16gb-512gb-win-11-home',
      title: 'Laptop Asus Vivobook Go 15 E1504FA R5 40 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/_sL3w-ZtnaRAfND1YV_R0r1U072FFAZigghF4ETZGuEeLfOjdK0ryf18KTRF79SP18h0lmQKkTQDI_GMuMbxI48zvw7a1os=w230-rw',
      price: '21.590.000 ₫',
      oldPrice: '28.490.000 ₫',
      reviews: 5,
    },
    {
      id: '260507148',
      slug: 'laptop-asus-vivobook-14-x1404ma-eb219w-core-5-320-8gb-512gb-windows-11-home',
      title: 'Laptop Asus Vivobook 14 X1404MA Core 5 320 8GB/512GB',
      image: 'https://lh3.googleusercontent.com/g9E60KEgoAT_FaVvJoBz1-qmBrNsE845-_ndcjKZdyewpBrCKdbcw--Vz-JQNrHdbTNqBfK2ljBVuVJjLf0_KRAA27n27C3-=w230-rw',
      price: '20.490.000 ₫',
      oldPrice: '26.990.000 ₫',
      reviews: 4,
    },
    {
      id: '260902421',
      slug: 'laptop-lenovo-ideapad-slim-3-14ahp10-83k9004qvn-ryzen-5-125-8gb-512gb-windows-11-office-microsoft',
      title: 'Laptop Lenovo IdeaPad Slim 3 14AHP10 R5 125 8GB/512GB',
      image: 'https://lh3.googleusercontent.com/3eqhAIqi2zIL_xdvpgmq_a63Z3R-Riw1FodSc5aZCSDJyz_a1EXhCLfqSMqMJ0z6-ruTiDJ7AItayq2if9AORiEy-VvZpwOn=w230-rw',
      price: '19.790.000 ₫',
      oldPrice: '25.990.000 ₫',
      reviews: 5,
    },
  ],
  'laptop-gaming': [
    {
      id: '261001309',
      slug: 'laptop-lenovo-loq-15irh11e---83y9003vvn-core-5-205h-geforce-rtx-3050-8gb-512gb-windows-11-home-sl',
      title: 'Laptop Gaming Lenovo LOQ 15IRH11E RTX 3050 8GB/512GB',
      image: 'https://lh3.googleusercontent.com/_PM-PnsTUlTl_r4iqpYJvTnADzLN-M5iZ00gSqjqEG1elMFA725DzTl7gFHenFAPmU1qxk2yE5ZQyt-3L1kZ0TpnohR_gPk=w230-rw',
      price: '25.990.000 ₫',
      oldPrice: '36.990.000 ₫',
      reviews: 5,
    },
    {
      id: '260805394',
      slug: 'laptop-acer-gaming-aspire-7-a715-59g-59rd-core-5-210h-geforce-rtx-3050-16gb-512gb-windows-11-home-sl',
      title: 'Laptop Acer Gaming Aspire 7 Core 5 210H RTX 3050 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/XocPrkhBjIbz91p7_hrFO_sbjVN9vKv5k5KAms6hRjpWoKgINeayDeI9JAJBzll3RYDC3UesGhcew8Hv8ZESPTksGRRyA9Fk=w230-rw',
      price: '25.990.000 ₫',
      oldPrice: '35.990.000 ₫',
      reviews: 5,
    },
    {
      id: '260407198',
      slug: 'laptop-asus-tuf-gaming-a15-fa506ncg-hn329w-ryzen-7-8845hs-geforce-rtx-3050-16gb-512gb-win-11-home',
      title: 'Laptop Asus TUF Gaming A15 R7 8845HS RTX 3050 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/JVbjYz4WEYUOgot9lQ2vt9y-BPdlvzaxR5A9MtzEnfddsdjkaYX2q6-rt7Gwuqv3Y6L5awdsDjqQXQ3WiN-IWJWOEaLFwjIDBA=w230-rw',
      price: '27.990.000 ₫',
      oldPrice: '37.490.000 ₫',
      reviews: 5,
    },
    {
      id: '261001943',
      slug: 'laptop-acer-nitro-propanel-anv16-i12-53vh-core-5-205h-geforce-rtx-3050-16gb-512gb-windows-11-home',
      title: 'Laptop Acer Nitro ProPanel Core 5 205H RTX 3050 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/pzhCCNum6HOe9zEXHJbr3lG5OIS6IDN5YFVi-4FAuFzASxx3Ol_gQg-UVpNYY50GfMx7sUkDwdEi1sHDlGfUFRejNQL4xW0=w230-rw',
      price: '28.990.000 ₫',
      oldPrice: '36.990.000 ₫',
      reviews: 5,
    },
  ],
  'laptop-mong-nhe': [
    {
      id: '260302512',
      slug: 'laptop-asus-vivobook-s14-s3407ca-sf913w-ultra-5-225h-16gb-512gb-win-11-home',
      title: 'Laptop Asus Vivobook S14 S3407CA Ultra 5 OLED 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/fh3QAE_n_Y_-PrJNaJbHhURaBpqBQGu_XfE3pzvEtWVgzbnXFPE1aILkHf6Rm0k54YMEYz3zerwv34SkhvlhELSnR1t2w7jZww=w230-rw',
      price: '27.490.000 ₫',
      oldPrice: '35.990.000 ₫',
      reviews: 5,
    },
    {
      id: '260303867',
      slug: 'laptop-hp-probook-4-g1i---bq5c7pt-ultra-7-255u-16gb-512gb-win-11-home-sl',
      title: 'Laptop HP ProBook 4 G1i Ultra 7-255U 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/WjSd894vIGO-EaYozFdQMK3VFU-w7Rw0qfCt0iqxBGeMP54VWD7A5VmtwxQHXF_ZpQMrVmEUghLJDGJJbMv3vBx8Upi1GyU=w230-rw',
      price: '32.490.000 ₫',
      oldPrice: '41.990.000 ₫',
      reviews: 5,
    },
    {
      id: '260801536',
      slug: 'laptop-acer-swift-air-14-sfa14-i31-52bv-core-5-320-12gb-512gb-windows-11-home',
      title: 'Laptop Acer Swift Air 14 Core 5 320 12GB/512GB Siêu nhẹ 1.1kg',
      image: 'https://lh3.googleusercontent.com/KghMvRNKo3CqbgEH5A1L0jbbMYNY0ByLZam2ABkHansFvIfu25qla_84sQ3W2VTc1aZxfA37FqIaPQNk0pF-coIsMMJAkj0=w230-rw',
      price: '24.990.000 ₫',
      oldPrice: '31.990.000 ₫',
      reviews: 4,
    },
    {
      id: '260603062',
      slug: 'laptop-lenovo-thinkbook-14-g9-irl---21uy008tvn-core-i5-13420h-16gb-512gb-windows-11-home-sl',
      title: 'Laptop Lenovo ThinkBook 14 G9 i5-13420H 16GB/512GB',
      image: 'https://lh3.googleusercontent.com/60T5Wb3tR6ddyp_XyZsC2oMMUoDtTjyKdmHUBTksR1CRwdpHGIWvnX0_B-VZ1-blkQ57PYEx_uw6HGRIcfcK2xFk0Rvw0-Dn=w230-rw',
      price: '26.290.000 ₫',
      oldPrice: '32.990.000 ₫',
      reviews: 5,
    },
  ],
  'laptop-workstation': [
    {
      id: '260303605',
      slug: 'laptop-msi-prestige-14-ai-d3mg-022vn-ultra-7-355-32gb-1tb-windows-11-home',
      title: 'Laptop MSI Prestige 14 AI+ D3MG Ultra 7-355 32GB/1TB OLED',
      image: 'https://lh3.googleusercontent.com/tJdbWXqIBRbW-KlFl5CYIYYOKYMKfiRqVnHaLgvLICEpiSvrurbOOsRQv6PKwAojYT848Qn2v71z3dKbUPY9p7qO9isGyJQ=w230-rw',
      price: '44.490.000 ₫',
      oldPrice: '49.990.000 ₫',
      reviews: 5,
    },
    {
      id: '260805116',
      slug: 'laptop-msi-prestige-14-flip-ai-vincent-van-gogh-edition-14t235-259vn-ultra-x9-378h-32gb-1tb-windows-11-home',
      title: 'Laptop MSI Prestige 14 Flip AI+ Vincent van Gogh Ultra X9 32GB/1TB',
      image: 'https://lh3.googleusercontent.com/bvm27CeviO9nTuVDmlLiIYdqHZCOQ1dYGmsj_CsLq6M5t2pH1UF_A7wQx-jXwNiSpEYiSNE0ECvrdZLVdQxFzhOmRk2MbF6p=w230-rw',
      price: '58.590.000 ₫',
      oldPrice: '60.990.000 ₫',
      reviews: 5,
    },
    {
      id: '261000940',
      slug: 'laptop-msi-prestige-n16-flip-ai-c1xmt-017vn-rtx-spark-n1x-64gb-2tb-windows-11-pro',
      title: 'Laptop MSI Prestige N16 Flip AI+ RTX Spark N1X 64GB/2TB OLED',
      image: 'https://lh3.googleusercontent.com/p7mwSaoRmOnhVbwoCi3j1pmcFFX-bJQQWimMSsBGkWp7efz9nuSBmCIatUMFgsN8D3NWuhHwNpJacQJvSi9GPOLZWjqco4PRXw=w230-rw',
      price: '139.990.000 ₫',
      oldPrice: '149.990.000 ₫',
      reviews: 5,
    },
    {
      id: '261000912',
      slug: 'laptop-msi-prestige-n16-flip-ai-c1xmt-016vn-rtx-spark-n1x-128gb-2tb-windows-11-pro',
      title: 'Laptop MSI Prestige N16 Flip AI+ RTX Spark N1X 128GB/2TB Tandem OLED',
      image: 'https://lh3.googleusercontent.com/TR9IyRX4ggytDPYmjRhsYsODLsWCo8hWpDUA-5mwlxp3NvSLTQmF-LbvgdidKL4xQOnAg-0SvSIw-qQpjWdlzhX9uuDqXWk=w230-rw',
      price: '222.990.000 ₫',
      oldPrice: '235.000.000 ₫',
      reviews: 5,
    },
  ],
}

export function MegaMenuFlyout({
  isOpen,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: MegaMenuFlyoutProps) {
  const [activeSubcat, setActiveSubcat] = useState('laptop-van-phong')

  if (!isOpen) return null

  const currentProducts = PRODUCTS_BY_CATEGORY[activeSubcat] || PRODUCTS_BY_CATEGORY['laptop-van-phong']

  return (
    <div
      className={styles.megaMenuFlyout}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="region"
      aria-label="Danh mục Laptops mở rộng"
    >
      <div className={styles.megaMenuInner}>
        {/* Top Section: Split between Subcategories Sidebar & Featured 4-card Grid */}
        <div className={styles.megaMenuMain}>
          {/* Subcategories Column (Chỉ hiển thị đúng các danh mục con thực tế có trong Database) */}
          <aside className={styles.megaSidebar}>
            <ul className={styles.megaSubcatList}>
              {SUBCATEGORIES.map(subcat => {
                const isActive = activeSubcat === subcat.id
                return (
                  <li key={subcat.id}>
                    <button
                      type="button"
                      className={`${styles.megaSubcatBtn} ${isActive ? styles.megaSubcatBtnActive : ''}`}
                      onMouseEnter={() => setActiveSubcat(subcat.id)}
                      onClick={() => onNavigate(`/products?category=${subcat.id}`)}
                    >
                      <span>{subcat.name}</span>
                      {subcat.hasChevron && (
                        <svg
                          width="7"
                          height="10"
                          viewBox="0 0 7 10"
                          fill="none"
                          className={styles.megaChevron}
                        >
                          <path
                            d="M1.5 1.5L5.5 5L1.5 8.5"
                            stroke="#000000"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </aside>

          {/* Featured 4 Product Cards Grid (Thay đổi động theo danh mục đang hover) */}
          <div className={styles.megaProductsGrid}>
            {currentProducts.map(product => (
              <div
                key={product.id}
                className={styles.megaCard}
                onClick={() => onNavigate(`/products/${product.slug}`)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter') onNavigate(`/products/${product.slug}`)
                }}
              >
                {/* Stock status indicator */}
                <div className={styles.megaStockStatus}>
                  <span className={styles.megaStockDot} />
                  <span>Còn hàng</span>
                </div>

                {/* Product thumbnail */}
                <div className={styles.megaThumbWrapper}>
                  <img
                    src={product.image}
                    alt={product.title}
                    className={styles.megaThumbImg}
                  />
                </div>

                {/* Star rating and reviews */}
                <div className={styles.megaReviews}>
                  <span className={styles.megaStars}>★★★★★</span>
                  <span className={styles.megaReviewCount}>({product.reviews} đánh giá)</span>
                </div>

                {/* Product title */}
                <p className={styles.megaProductTitle}>{product.title}</p>

                {/* Pricing: struck-through old price and bold current price */}
                <div className={styles.megaPrices}>
                  <span className={styles.megaOldPrice}>{product.oldPrice}</span>
                  <span className={styles.megaPrice}>{product.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Brand Logos Bar */}
        <div className={styles.megaBrandsBar}>
          {/* ROCCAT */}
          <div className={styles.megaBrandLogo} title="ROCCAT">
            <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
              <path d="M4 14C4 9 8 5 13 5C17 5 21 8 21 14C21 20 17 23 13 23C8 23 4 19 4 14Z" stroke="#444" strokeWidth="2" />
              <path d="M12 9C10 11 10 17 14 19" stroke="#444" strokeWidth="2" strokeLinecap="round" />
              <text x="26" y="16" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="12" letterSpacing="0.5">ROCCAT</text>
              <text x="26" y="24" fill="#666" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="6" letterSpacing="1">SET THE RULES</text>
            </svg>
          </div>

          {/* MSI */}
          <div className={styles.megaBrandLogo} title="MSI">
            <svg width="85" height="28" viewBox="0 0 85 28" fill="none">
              <rect x="2" y="3" width="22" height="22" rx="4" fill="#333" />
              <path d="M7 14L13 8L19 14L13 20Z" fill="#E60012" />
              <text x="29" y="21" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="18" fontStyle="italic" letterSpacing="-0.5">msi</text>
            </svg>
          </div>

          {/* RAZER */}
          <div className={styles.megaBrandLogo} title="RAZER">
            <svg width="90" height="28" viewBox="0 0 90 28" fill="none">
              <path d="M6 14C8 9 14 9 16 14C14 19 8 19 6 14Z" stroke="#00FF00" strokeWidth="1.5" />
              <circle cx="11" cy="14" r="2" fill="#00FF00" />
              <text x="22" y="19" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="12" letterSpacing="3">RAZER</text>
            </svg>
          </div>

          {/* Thermaltake */}
          <div className={styles.megaBrandLogo} title="Thermaltake">
            <svg width="105" height="28" viewBox="0 0 105 28" fill="none">
              <rect x="2" y="4" width="20" height="20" rx="3" fill="#000" />
              <text x="5" y="19" fill="#FFF" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="13">Tt</text>
              <text x="27" y="19" fill="#333" fontFamily="Poppins, sans-serif" fontWeight="600" fontSize="12" letterSpacing="-0.3">thermaltake</text>
            </svg>
          </div>

          {/* ADATA */}
          <div className={styles.megaBrandLogo} title="ADATA">
            <svg width="85" height="28" viewBox="0 0 85 28" fill="none">
              <path d="M5 8L14 14L5 20L9 14Z" fill="#333" />
              <text x="20" y="20" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="15" letterSpacing="0.5">ADATA</text>
            </svg>
          </div>

          {/* HP HEWLETT PACKARD */}
          <div className={styles.megaBrandLogo} title="HP Hewlett Packard">
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none">
              <circle cx="14" cy="14" r="11" fill="#0096D6" />
              <text x="8" y="19" fill="#FFF" fontFamily="Poppins, sans-serif" fontWeight="900" fontStyle="italic" fontSize="13">hp</text>
              <text x="32" y="14" fill="#333" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="9">HEWLETT</text>
              <text x="32" y="23" fill="#333" fontFamily="Poppins, sans-serif" fontWeight="700" fontSize="9">PACKARD</text>
            </svg>
          </div>

          {/* GIGABYTE */}
          <div className={styles.megaBrandLogo} title="GIGABYTE">
            <svg width="100" height="28" viewBox="0 0 100 28" fill="none">
              <text x="2" y="20" fill="#1A1A1A" fontFamily="Poppins, sans-serif" fontWeight="900" fontSize="16" letterSpacing="0.5">GIGABYTE</text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
