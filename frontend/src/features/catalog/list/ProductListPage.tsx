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
  const [minVal, setMinVal] = useState(query.minPrice !== undefined ? String(query.minPrice) : '')
  const [maxVal, setMaxVal] = useState(query.maxPrice !== undefined ? String(query.maxPrice) : '')
  const [priceError, setPriceError] = useState('')

  useEffect(() => {
    setMinVal(query.minPrice !== undefined ? String(query.minPrice) : '')
    setMaxVal(query.maxPrice !== undefined ? String(query.maxPrice) : '')
  }, [query.minPrice, query.maxPrice])

  const handlePriceApply = (e: FormEvent) => {
    e.preventDefault()
    if (minVal && maxVal && Number(minVal) > Number(maxVal)) {
      setPriceError('Giá đến phải ≥ giá từ.')
      return
    }
    setPriceError('')
    update({ min: minVal, max: maxVal })
  }

  const rootCategories = categories.filter(c => !c.parentId)

  const priceRanges = [
    { label: '0₫ - 10.000.000₫', min: '0', max: '10000000' },
    { label: '10.000.000₫ - 20.000.000₫', min: '10000000', max: '20000000' },
    { label: '20.000.000₫ - 30.000.000₫', min: '20000000', max: '30000000' },
    { label: '30.000.000₫ - 40.000.000₫', min: '30000000', max: '40000000' },
    { label: '40.000.000₫ - 50.000.000₫', min: '40000000', max: '50000000' },
    { label: '50.000.000₫ - 60.000.000₫', min: '50000000', max: '60000000' },
    { label: '60.000.000₫ - 70.000.000₫', min: '60000000', max: '70000000' },
    { label: 'Từ 70.000.000₫ trở lên', min: '70000000', max: '' },
  ]

  return (
    <aside className={styles.sidebar}>
      {/* Unified Filter Card */}
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
              {rootCategories.map(cat => {
                const isSelected = query.category === cat.id
                const subcats = categories.filter(c => c.parentId === cat.id)

                return (
                  <li key={cat.id}>
                    <button
                      type="button"
                      className={`${styles.filterItemBtn} ${isSelected ? styles.activeFilterItem : ''}`}
                      onClick={() => update({ category: isSelected ? '' : cat.id })}
                    >
                      <span>{cat.name}</span>
                    </button>
                    {subcats.length > 0 && (
                      <ul className={styles.filterList} style={{ paddingLeft: '12px', marginTop: '4px' }}>
                        {subcats.map(sub => {
                          const isSubSelected = query.category === sub.id
                          return (
                            <li key={sub.id}>
                              <button
                                type="button"
                                className={`${styles.filterItemBtn} ${isSubSelected ? styles.activeFilterItem : ''}`}
                                onClick={() => update({ category: isSubSelected ? '' : sub.id })}
                              >
                                <span>• {sub.name}</span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}
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
                {priceRanges.map((range, idx) => {
                  const isSelected =
                    query.minPrice === Number(range.min) &&
                    (range.max ? query.maxPrice === Number(range.max) : query.maxPrice === undefined)

                  return (
                    <li key={idx}>
                      <button
                        type="button"
                        className={`${styles.filterItemBtn} ${isSelected ? styles.activeFilterItem : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            update({ min: '', max: '' })
                          } else {
                            update({ min: range.min, max: range.max })
                          }
                        }}
                      >
                        <span>{range.label}</span>
                      </button>
                    </li>
                  )
                })}
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

      {/* 7. Noblechairs Vertical Banner */}
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
  state,
  brands,
  changePage,
  reset,
  retry,
}: {
  state: ResultState
  brands: readonly CatalogOption[]
  changePage: (page: number) => void
  reset: () => void
  retry: () => void
}) {
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
        <button type="button" className={styles.retryBtn} onClick={retry}>
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
  const [state, setState] = useState<ResultState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    source(query, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setState({ status: 'ready', data })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' })
      })
    return () => controller.abort()
  }, [query, source, attempt])

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

  // Active filter items lookup
  const activeCategory = categories.find(c => c.id === query.category)
  const activeBrand = brands.find(b => b.id === query.brand)
  const hasActiveFilters = Boolean(
    query.category ||
    query.brand ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined ||
    query.keyword
  )

  // Dynamic Breadcrumb construction
  const breadcrumbItems: { label: string; url?: string }[] = [
    { label: 'Trang chủ', url: '/' },
    { label: 'Sản phẩm', url: '/products' },
  ]

  if (activeCategory) {
    if (activeCategory.parentId) {
      const parent = categories.find(c => c.id === activeCategory.parentId)
      if (parent) {
        breadcrumbItems.push({ label: parent.name, url: `/products?category=${parent.id}` })
      }
    }
    breadcrumbItems.push({
      label: activeCategory.name,
      url: `/products?category=${activeCategory.id}`,
    })
  } else if (query.category) {
    breadcrumbItems.push({
      label: query.category,
      url: `/products?category=${query.category}`,
    })
  }

  if (activeBrand) {
    breadcrumbItems.push({
      label: activeBrand.name,
      url: `/products?brand=${activeBrand.id}`,
    })
  } else if (query.brand) {
    breadcrumbItems.push({
      label: query.brand,
      url: `/products?brand=${query.brand}`,
    })
  }

  if (query.keyword) {
    breadcrumbItems.push({
      label: `Tìm kiếm: "${query.keyword}"`,
    })
  }

  // Dynamic Page Title
  const getPageTitle = () => {
    if (activeCategory && activeBrand) {
      return `Danh sách sản phẩm — ${activeCategory.name} (${activeBrand.name})`
    }
    if (activeCategory) {
      return `Danh sách sản phẩm — ${activeCategory.name}`
    }
    if (activeBrand) {
      return `Danh sách sản phẩm — ${activeBrand.name}`
    }
    if (query.keyword) {
      return `Danh sách sản phẩm — Tìm kiếm "${query.keyword}"`
    }
    return 'Danh sách sản phẩm'
  }

  const formatPriceTag = (min?: number, max?: number) => {
    const fmt = (v: number) => v.toLocaleString('vi-VN') + '₫'
    if (min !== undefined && max !== undefined) {
      return `${fmt(min)} - ${fmt(max)}`
    }
    if (min !== undefined) return `TỪ ${fmt(min)}`
    if (max !== undefined) return `ĐẾN ${fmt(max)}`
    return 'KHOẢNG GIÁ'
  }

  const totalCount = state.status === 'ready' ? state.data.total : undefined
  const currentPage = state.status === 'ready' ? state.data.page : 1

  return (
    <div className={styles.catalogPage}>
      {/* 1. ASUS TUF GAMING Top Banner */}
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
        {breadcrumbItems.map((item, idx) => {
          const isLast = idx === breadcrumbItems.length - 1
          return (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center' }}>
              {idx > 0 && (
                <span className={styles.breadcrumbSeparator} aria-hidden="true" style={{ margin: '0 6px' }}>
                  ›
                </span>
              )}
              {isLast || !item.url ? (
                <span className={styles.breadcrumbCurrent}>{item.label}</span>
              ) : (
                <a href={item.url}>{item.label}</a>
              )}
            </span>
          )
        })}
      </nav>

      {/* 3. Page Title with Count */}
      <div className={styles.titleSection}>
        <h1 className={styles.pageTitle}>
          {getPageTitle()} {totalCount !== undefined ? `(${totalCount})` : ''}
        </h1>
      </div>

      {/* 4. Main 2-Column Catalog Layout */}
      <div className={styles.catalogMainLayout}>
        <FiltersSidebar
          categories={categories}
          brands={brands}
          query={query}
          update={update}
          reset={reset}
        />

        <div className={styles.resultsArea} aria-label="Kết quả tìm kiếm">
          {/* Controls & Toolbar Container */}
          <div className={styles.toolbarContainer}>
            {/* Row 1: Items Range on Left, Controls on Right */}
            <div className={styles.toolbarRowTop}>
              <span className={styles.itemsRange}>
                {state.status === 'ready'
                  ? state.data.total > 0
                    ? `Hiển thị ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, state.data.total)} trong ${state.data.total} sản phẩm`
                    : 'Không tìm thấy sản phẩm nào'
                  : 'Đang tải danh sách sản phẩm…'}
              </span>

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
                  <select defaultValue="8" className={styles.inlineSelect} aria-label="Số sản phẩm trên trang" disabled>
                    <option value="8">8 / trang</option>
                  </select>
                  <span className={styles.selectChevron} aria-hidden="true">▾</span>
                </label>

                {/* View Toggles */}
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
            {hasActiveFilters && (
              <div className={styles.activeFilterPills}>
                {query.category && (
                  <span className={styles.filterPillTag}>
                    <span className={styles.pillText}>{activeCategory?.name || query.category}</span>
                    <button
                      type="button"
                      className={styles.chipRemoveBtn}
                      onClick={() => update({ category: '' })}
                      aria-label="Bỏ chọn danh mục"
                    >
                      <span className={styles.chipCloseCircle}>×</span>
                    </button>
                  </span>
                )}

                {query.brand && (
                  <span className={styles.filterPillTag}>
                    <span className={styles.pillText}>{activeBrand?.name || query.brand}</span>
                    <button
                      type="button"
                      className={styles.chipRemoveBtn}
                      onClick={() => update({ brand: '' })}
                      aria-label="Bỏ chọn thương hiệu"
                    >
                      <span className={styles.chipCloseCircle}>×</span>
                    </button>
                  </span>
                )}

                {(query.minPrice !== undefined || query.maxPrice !== undefined) && (
                  <span className={styles.filterPillTag}>
                    <span className={styles.pillText}>{formatPriceTag(query.minPrice, query.maxPrice)}</span>
                    <button
                      type="button"
                      className={styles.chipRemoveBtn}
                      onClick={() => update({ min: '', max: '' })}
                      aria-label="Bỏ chọn khoảng giá"
                    >
                      <span className={styles.chipCloseCircle}>×</span>
                    </button>
                  </span>
                )}

                {query.keyword && (
                  <span className={styles.filterPillTag}>
                    <span className={styles.pillText}>TỪ KHÓA: "{query.keyword}"</span>
                    <button
                      type="button"
                      className={styles.chipRemoveBtn}
                      onClick={() => update({ q: '' })}
                      aria-label="Bỏ từ khóa tìm kiếm"
                    >
                      <span className={styles.chipCloseCircle}>×</span>
                    </button>
                  </span>
                )}

                {/* Clear All Button */}
                <button
                  type="button"
                  className={styles.clearAllBtn}
                  onClick={reset}
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          <CatalogResults
            state={state}
            brands={brands}
            changePage={page => update({ page: String(page) })}
            reset={reset}
            retry={() => {
              setState({ status: 'loading' })
              setAttempt(a => a + 1)
            }}
          />
        </div>
      </div>

      {/* 6. SEO Article Block */}
      <section className={styles.seoArticleSection}>
        <p className={styles.seoArticleText}>
          Tech Store mang đến những sản phẩm công nghệ chính hãng chất lượng cao từ các thương hiệu hàng đầu thế giới như ASUS, Lenovo, Acer, HP, MSI... Tất cả sản phẩm đều được kiểm định nguồn gốc xuất xứ rõ ràng, bảo hành chính hãng và hỗ trợ kỹ thuật tận tâm.
        </p>
        <p className={styles.seoArticleText}>
          Chúng tôi cam kết cung cấp mức giá cạnh tranh nhất thị trường cùng nhiều chương trình ưu đãi, trả góp linh hoạt và giao hàng nhanh chóng trên toàn quốc. Đội ngũ tư vấn viên am hiểu công nghệ luôn sẵn sàng hỗ trợ bạn lựa chọn sản phẩm phù hợp nhất với nhu cầu làm việc, học tập hay giải trí.
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
