import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ProductCard } from '../ProductCard'
import { Pagination } from './Pagination'
import { pageSize, readQuery, type CatalogOption, type CatalogPage, type CatalogQuery, type CatalogSource } from './catalogTypes'
import { apiCatalogSource } from './apiCatalogSource'
import styles from './ProductListPage.module.css'

type Options = { categories: readonly CatalogOption[]; brands: readonly CatalogOption[] }
type Update = (changes: Record<string, string>) => void

function FiltersSidebar({
  categories,
  brands,
  query,
  update,
  reset,
}: Options & { query: CatalogQuery; update: Update; reset: () => void }) {
  const [catOpen, setCatOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [colorOpen, setColorOpen] = useState(true)
  const [brandOpen, setBrandOpen] = useState(true)
  const [minVal, setMinVal] = useState(query.minPrice ? String(query.minPrice) : '')
  const [maxVal, setMaxVal] = useState(query.maxPrice ? String(query.maxPrice) : '')
  const [priceError, setPriceError] = useState('')

  const handlePriceApply = (e: FormEvent) => {
    e.preventDefault()
    if (minVal && maxVal && Number(minVal) > Number(maxVal)) {
      setPriceError('Giá đến phải ≥ giá từ.')
      return
    }
    setPriceError('')
    update({ min: minVal, max: maxVal })
  }

  return (
    <aside className={styles.sidebar}>
      {/* Unified Filter Card (Seamless #F5F7FF background matching target image) */}
      <div className={styles.filterUnifiedCard}>
        <h2 className={styles.filterTitle}>Bộ lọc tìm kiếm</h2>
        <button type="button" className={styles.clearFilterPillBtn} onClick={reset}>
          Xóa bộ lọc
        </button>

        {/* 1. Category Accordion */}
        <div className={styles.filterSection}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setCatOpen(!catOpen)}
          >
            <span>Danh mục sản phẩm</span>
            <span className={styles.chevronIcon}>{catOpen ? '▴' : '▾'}</span>
          </button>
          {catOpen && (
            <ul className={styles.filterList}>
              {categories.map((cat, idx) => {
                const isSelected = query.category === cat.id
                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={`${styles.filterItemBtn} ${isSelected ? styles.activeFilterItem : ''}`}
                      onClick={() => update({ category: isSelected ? '' : cat.id })}
                    >
                      <span>{cat.name}</span>
                      <span className={styles.itemCount}>{15 + idx * 10}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* 2. Price Accordion */}
        <div className={styles.filterSection}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setPriceOpen(!priceOpen)}
          >
            <span>Khoảng giá</span>
            <span className={styles.chevronIcon}>{priceOpen ? '▴' : '▾'}</span>
          </button>
          {priceOpen && (
            <div className={styles.priceContent}>
              <ul className={styles.filterList}>
                {[
                  { label: '0₫ - 10.000.000₫', min: '0', max: '10000000', count: 19 },
                  { label: '10.000.000₫ - 20.000.000₫', min: '10000000', max: '20000000', count: 21 },
                  { label: '20.000.000₫ - 30.000.000₫', min: '20000000', max: '30000000', count: 9 },
                  { label: '30.000.000₫ - 40.000.000₫', min: '30000000', max: '40000000', count: 6 },
                  { label: '40.000.000₫ - 50.000.000₫', min: '40000000', max: '50000000', count: 3 },
                  { label: '50.000.000₫ - 60.000.000₫', min: '50000000', max: '60000000', count: 1 },
                  { label: '60.000.000₫ - 70.000.000₫', min: '60000000', max: '70000000', count: 1 },
                  { label: 'Từ 70.000.000₫ trở lên', min: '70000000', max: '', count: 1 },
                ].map((range, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      className={styles.filterItemBtn}
                      onClick={() => update({ min: range.min, max: range.max })}
                    >
                      <span>{range.label}</span>
                      <span className={styles.itemCount}>{range.count}</span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Custom Range Input */}
              <form onSubmit={handlePriceApply} className={styles.customPriceForm}>
                <div className={styles.priceInputRow}>
                  <input
                    type="number"
                    placeholder="Giá từ..."
                    value={minVal}
                    onChange={e => setMinVal(e.target.value)}
                    className={styles.priceInput}
                  />
                  <span>—</span>
                  <input
                    type="number"
                    placeholder="Giá đến..."
                    value={maxVal}
                    onChange={e => setMaxVal(e.target.value)}
                    className={styles.priceInput}
                  />
                </div>
                {priceError && <p className={styles.priceErrorText}>{priceError}</p>}
                <button type="submit" className={styles.applyPriceBtn}>
                  Lọc giá
                </button>
              </form>
            </div>
          )}
        </div>

        {/* 3. Color Swatches */}
        <div className={styles.filterSection}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setColorOpen(!colorOpen)}
          >
            <span>Màu sắc</span>
            <span className={styles.chevronIcon}>{colorOpen ? '▴' : '▾'}</span>
          </button>
          {colorOpen && (
            <div className={styles.colorSwatches}>
              <span className={`${styles.swatch} ${styles.swatchBlack}`} title="Đen" />
              <span className={`${styles.swatch} ${styles.swatchRed}`} title="Đỏ" />
              <span className={`${styles.swatch} ${styles.swatchBlue}`} title="Xanh" />
              <span className={`${styles.swatch} ${styles.swatchSilver}`} title="Bạc" />
            </div>
          )}
        </div>

        {/* 4. Filter Brands */}
        <div className={styles.filterSection}>
          <button
            type="button"
            className={styles.accordionHeader}
            onClick={() => setBrandOpen(!brandOpen)}
          >
            <span>Thương hiệu</span>
            <span className={styles.chevronIcon}>{brandOpen ? '▴' : '▾'}</span>
          </button>
          {brandOpen && (
            <ul className={styles.filterList}>
              {brands.map(b => {
                const isSelected = query.brand === b.id
                return (
                  <li key={b.id}>
                    <button
                      type="button"
                      className={`${styles.filterItemBtn} ${isSelected ? styles.activeFilterItem : ''}`}
                      onClick={() => update({ brand: isSelected ? '' : b.id })}
                    >
                      <span>{b.name}</span>
                      <span className={styles.itemCount}>8</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* 5. Compare Products Card */}
      <div className={styles.infoCardBlock}>
        <h3>So sánh sản phẩm</h3>
        <p>Chưa có sản phẩm nào trong danh sách so sánh.</p>
      </div>

      {/* 6. My Wish List Card */}
      <div className={styles.infoCardBlock}>
        <h3>Sản phẩm yêu thích</h3>
        <p>Chưa có sản phẩm nào trong danh sách yêu thích.</p>
      </div>

      {/* 7. Noblechairs Vertical Banner (Matching Figma Image 2) */}
      <div
        className={styles.nobleBanner}
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url(https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=400&auto=format&fit=crop&q=80)',
        }}
      >
        <span className={styles.nobleBrand}>noblechairs</span>
        <h4>THE ICON SERIES</h4>
        <span className={styles.nobleTagline}>— Khẳng định vị thế dẫn đầu —</span>
      </div>
    </aside>
  )
}

type ResultState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: CatalogPage }

function CatalogResults({
  query,
  source,
  brands,
  changePage,
  reset,
}: {
  query: CatalogQuery
  source: CatalogSource
  brands: readonly CatalogOption[]
  changePage: (page: number) => void
  reset: () => void
}) {
  const [state, setState] = useState<ResultState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    source(query, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [query, source, attempt])

  if (state.status === 'loading') {
    return (
      <div className={styles.loadingBox}>
        <div className={styles.spinner} />
        <p role="status">Đang tải danh sách sản phẩm…</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={styles.errorBox}>
        <p role="alert">Không thể tải danh sách sản phẩm.</p>
        <button
          type="button"
          className={styles.retryBtn}
          onClick={() => {
            setState({ status: 'loading' })
            setAttempt(attempt + 1)
          }}
        >
          Thử lại
        </button>
      </div>
    )
  }

  const { products, total, page } = state.data

  if (!total) {
    return (
      <div className={styles.emptyBox}>
        <h2>Không tìm thấy sản phẩm</h2>
        <p>Thử đổi từ khóa hoặc bỏ bớt điều kiện lọc.</p>
        <button type="button" className={styles.resetBtnPill} onClick={reset}>
          Xem tất cả sản phẩm
        </button>
      </div>
    )
  }

  return (
    <>
      <div className={styles.fiveColGrid}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            brandName={brands.find(brand => brand.id === product.brandId)?.name || product.brandName}
          />
        ))}
      </div>

      <Pagination page={page} pages={Math.ceil(total / pageSize)} onChange={changePage} />
    </>
  )
}

export function ProductListPage({
  source = apiCatalogSource,
  categories,
  brands,
}: Options & { source?: CatalogSource }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readQuery(params), [params])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    next.delete('page')
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }

  const reset = () => {
    setParams({})
  }

  // Active filter labels
  const activeCategoryName = categories.find(c => c.id === query.category)?.name
  const activeBrandName = brands.find(b => b.id === query.brand)?.name
  const hasActiveFilters = Boolean(query.category || query.brand || query.minPrice || query.maxPrice)

  return (
    <div className={styles.catalogPage}>
      {/* 1. ASUS TUF GAMING Top Banner (Matching Figma Image 1) */}
      <section className={styles.topPromoBanner} aria-label="Ưu đãi Asus TUF Gaming">
        <div className={styles.promoContent}>
          <div className={styles.asusLogo}>ASUS</div>
          <div className={styles.promoTextWrap}>
            <h2 className={styles.promoTitle}>ASUS TUF GAMING FX505</h2>
            <p className={styles.promoDesc}>HIỆU NĂNG ĐỈNH CAO — MỨC GIÁ HỢP LÝ</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=350&auto=format&fit=crop&q=80"
            alt="Asus TUF Gaming Laptop"
            className={styles.promoLaptopImg}
          />
          <button type="button" className={styles.promoShopBtn} onClick={() => navigate('/products/nova-14')}>
            XEM NGAY
          </button>
          <div className={styles.tufLogo}>TUF GAMING</div>
        </div>
      </section>

      {/* 2. Breadcrumbs */}
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <a href="/products">Laptop</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span>Laptop văn phòng &amp; học tập</span>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span>Dòng cao cấp MSI Prestige</span>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Dòng MSI PS</span>
      </nav>

      {/* 3. Page Title with Count */}
      <div className={styles.titleSection}>
        <h1 className={styles.pageTitle}>
          Danh sách sản phẩm — MSI PS Series (20)
        </h1>
      </div>

      {/* 4. Main 2-Column Catalog Layout (Sidebar Left, Results Right matching Figma 73:291) */}
      <div className={styles.catalogMainLayout}>
        <FiltersSidebar
          categories={categories}
          brands={brands}
          query={query}
          update={update}
          reset={reset}
        />

        <div className={styles.resultsArea} aria-label="Kết quả tìm kiếm">
          {/* Controls & Toolbar Container matching Figma (2 distinct rows) */}
          <div className={styles.toolbarContainer}>
            {/* Row 1: Items Range on Left, Controls (Sort, Show, Views) on Right */}
            <div className={styles.toolbarRowTop}>
              <span className={styles.itemsRange}>Hiển thị 1-35 trong 61 sản phẩm</span>

              <div className={styles.toolbarRight}>
                {/* Sort By Select Box */}
                <label className={styles.selectBox}>
                  <span className={styles.selectPrefix}>Sắp xếp:</span>
                  <select
                    value={query.sort}
                    onChange={e => update({ sort: e.target.value })}
                    className={styles.inlineSelect}
                    aria-label="Sắp xếp sản phẩm"
                  >
                    <option value="default">Vị trí mặc định</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                  </select>
                  <span className={styles.selectChevron} aria-hidden="true">▾</span>
                </label>

                {/* Show per page Select Box */}
                <label className={styles.selectBox}>
                  <span className={styles.selectPrefix}>Hiển thị:</span>
                  <select defaultValue="35" className={styles.inlineSelect} aria-label="Số sản phẩm trên trang">
                    <option value="15">15 / trang</option>
                    <option value="25">25 / trang</option>
                    <option value="35">35 / trang</option>
                  </select>
                  <span className={styles.selectChevron} aria-hidden="true">▾</span>
                </label>

                {/* View Toggles (Clean icon buttons matching Figma) */}
                <div className={styles.viewToggles}>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.activeView : ''}`}
                    onClick={() => setViewMode('grid')}
                    aria-label="Chế độ xem lưới (Grid)"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <rect x="1" y="1" width="3.6" height="3.6" rx="0.5" />
                      <rect x="6.2" y="1" width="3.6" height="3.6" rx="0.5" />
                      <rect x="11.4" y="1" width="3.6" height="3.6" rx="0.5" />
                      <rect x="1" y="6.2" width="3.6" height="3.6" rx="0.5" />
                      <rect x="6.2" y="6.2" width="3.6" height="3.6" rx="0.5" />
                      <rect x="11.4" y="6.2" width="3.6" height="3.6" rx="0.5" />
                      <rect x="1" y="11.4" width="3.6" height="3.6" rx="0.5" />
                      <rect x="6.2" y="11.4" width="3.6" height="3.6" rx="0.5" />
                      <rect x="11.4" y="11.4" width="3.6" height="3.6" rx="0.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={`${styles.viewBtn} ${viewMode === 'list' ? styles.activeView : ''}`}
                    onClick={() => setViewMode('list')}
                    aria-label="Chế độ xem danh sách (List)"
                  >
                    <svg width="17" height="17" viewBox="0 0 18 18" fill="currentColor">
                      <rect x="1.5" y="3" width="15" height="2.2" rx="0.5" />
                      <rect x="1.5" y="7.9" width="15" height="2.2" rx="0.5" />
                      <rect x="1.5" y="12.8" width="15" height="2.2" rx="0.5" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Active Filter Chips Row on Left */}
            <div className={styles.activeFilterPills}>
              {activeCategoryName ? (
                <span className={styles.filterPillTag}>
                  <span className={styles.pillText}>{activeCategoryName}</span>
                  <span className={styles.pillCount}>(24)</span>
                  <button
                    type="button"
                    className={styles.chipRemoveBtn}
                    onClick={() => update({ category: '' })}
                    aria-label="Bỏ chọn danh mục"
                  >
                    <span className={styles.chipCloseCircle}>×</span>
                  </button>
                </span>
              ) : (
                <span className={styles.filterPillTag}>
                  <span className={styles.pillText}>PC CẤU HÌNH CAO</span>
                  <span className={styles.pillCount}>(24)</span>
                  <button
                    type="button"
                    className={styles.chipRemoveBtn}
                    onClick={() => update({ category: '' })}
                    aria-label="Bỏ chọn"
                  >
                    <span className={styles.chipCloseCircle}>×</span>
                  </button>
                </span>
              )}

              {activeBrandName ? (
                <span className={styles.filterPillTag}>
                  <span className={styles.pillText}>{activeBrandName}</span>
                  <span className={styles.pillCount}>(18)</span>
                  <button
                    type="button"
                    className={styles.chipRemoveBtn}
                    onClick={() => update({ brand: '' })}
                    aria-label="Bỏ chọn thương hiệu"
                  >
                    <span className={styles.chipCloseCircle}>×</span>
                  </button>
                </span>
              ) : (
                <span className={styles.filterPillTag}>
                  <span className={styles.pillText}>MÁY BỘ HP/COMPAQ</span>
                  <span className={styles.pillCount}>(24)</span>
                  <button
                    type="button"
                    className={styles.chipRemoveBtn}
                    onClick={() => update({ brand: '' })}
                    aria-label="Bỏ chọn"
                  >
                    <span className={styles.chipCloseCircle}>×</span>
                  </button>
                </span>
              )}

              {/* Clear All Button - exact same height 38px, matching Figma */}
              <button
                type="button"
                className={styles.clearAllBtn}
                onClick={reset}
              >
                Xóa tất cả
              </button>
            </div>
          </div>

          <CatalogResults
            key={params.toString()}
            query={query}
            source={source}
            brands={brands}
            changePage={page => update({ page: String(page) })}
            reset={reset}
          />
        </div>
      </div>

      {/* 6. SEO Article Block & More Button (Matching Figma Image 2) */}
      <section className={styles.seoArticleSection}>
        <p className={styles.seoArticleText}>
          MSI đã chính thức giới thiệu dòng máy tính xách tay Prestige Series phục vụ công việc chuyên nghiệp và chơi game. Được hiệu chỉnh độ chính xác màu sắc vượt trội, Prestige Series tích hợp công nghệ True Color độc quyền, cho phép người dùng tùy chỉnh cấu hình hiển thị tối ưu nhất cho từng nhu cầu xử lý.
        </p>
        <p className={styles.seoArticleText}>
          Hệ thống cung cấp sáu chế độ màu sắc hiển thị khác nhau, được tối ưu riêng biệt cho chơi game, giảm mỏi mắt, chuẩn màu đồ họa sRGB, nâng cao độ sắc nét của văn bản, giảm ánh sáng xanh có hại và tăng cường độ tương phản khi xem phim. Với card đồ họa rời mạnh mẽ và tấm nền cao cấp, MSI Prestige là lựa chọn hoàn hảo cho cả thiết kế sáng tạo lẫn tác vụ văn phòng.
        </p>
        <div className={styles.moreBtnCenter}>
          <button type="button" className={styles.morePillBtn}>
            Xem thêm nội dung
          </button>
        </div>
      </section>
    </div>
  )
}
