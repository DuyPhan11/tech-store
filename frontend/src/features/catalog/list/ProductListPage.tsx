import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { ProductCard } from '../ProductCard'
import { Pagination } from './Pagination'
import { pageSize, readQuery, type CatalogOption, type CatalogPage, type CatalogQuery, type CatalogSource } from './catalogTypes'
import { apiCatalogSource } from './apiCatalogSource'
import styles from './ProductListPage.module.css'
type Options = { categories: readonly CatalogOption[]; brands: readonly CatalogOption[] }
type Update = (changes: Record<string, string>) => void

function Filters({ categories, brands, query, update, reset }: Options & {
  query: CatalogQuery; update: Update; reset: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [error, setError] = useState('')
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const value = (key: string) => String(data.get(key) ?? '')
    const min = value('min')
    const max = value('max')
    if (min && max && Number(min) > Number(max)) {
      setError('Giá đến phải lớn hơn hoặc bằng giá từ.')
      return
    }
    setError('')
    update({
      category: value('category'), brand: value('brand'),
      min: min ? String(Number(min)) : '', max: max ? String(Number(max)) : '',
    })
  }
  return <aside className={styles.panel}>
    <h2>Bộ lọc</h2>
    <Button className={styles.toggle} variant="outline" aria-expanded={expanded} aria-controls="catalog-filters"
      onClick={() => setExpanded(!expanded)}>{expanded ? 'Thu gọn bộ lọc' : 'Mở bộ lọc'}</Button>
    <form id="catalog-filters" onSubmit={apply} className={styles.filters} data-expanded={expanded}>
      <label>Danh mục<select name="category" defaultValue={query.category}>
        <option value="">Tất cả danh mục</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select></label>
      <label>Thương hiệu<select name="brand" defaultValue={query.brand}>
        <option value="">Tất cả thương hiệu</option>
        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
      </select></label>
      <Input label="Giá từ (₫)" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" name="min" defaultValue={query.minPrice} />
      <Input label="Giá đến (₫)" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" name="max" defaultValue={query.maxPrice} error={error} />
      <Button type="submit">Áp dụng bộ lọc</Button>
      <Button variant="outline" onClick={reset}>Đặt lại tìm kiếm và bộ lọc</Button>
    </form>
  </aside>
}

type ResultState = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: CatalogPage }

function Results({ query, source, brands, changePage, reset }: {
  query: CatalogQuery; source: CatalogSource; brands: readonly CatalogOption[]
  changePage: (page: number) => void; reset: () => void
}) {
  const [state, setState] = useState<ResultState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    source(query, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({ status: 'ready', data })
    }).catch(() => {
      if (!controller.signal.aborted) setState({ status: 'error' })
    })
    return () => controller.abort()
  }, [query, source, attempt])

  if (state.status === 'loading') return <p role="status" className={styles.message}>Đang tải danh sách sản phẩm…</p>
  if (state.status === 'error') return <div className={styles.message}>
    <p role="alert">Không thể tải danh sách sản phẩm.</p>
    <Button variant="outline" onClick={() => { setState({ status: 'loading' }); setAttempt(attempt + 1) }}>Thử lại</Button>
  </div>
  const { products, total, page } = state.data
  if (!total) return <div className={styles.message}>
    <h2>Không tìm thấy sản phẩm</h2><p>Thử đổi từ khóa hoặc bỏ bớt điều kiện lọc.</p>
    <Button variant="outline" onClick={reset}>Xem tất cả sản phẩm</Button>
  </div>

  return <>
    <p role="status" className={styles.count}>{total} sản phẩm{query.keyword && <> cho “{query.keyword}”</>}</p>
    <div className={styles.grid}>{products.map(product => (
      <ProductCard
        key={product.id}
        product={product}
        brandName={brands.find(brand => brand.id === product.brandId)?.name || product.brandName}
      />
    ))}</div>
    <Pagination page={page} pages={Math.ceil(total / pageSize)} onChange={changePage} />
  </>
}

export function ProductListPage({ source = apiCatalogSource, categories, brands }: Options & { source?: CatalogSource }) {
  const [params, setParams] = useSearchParams()
  const query = useMemo(() => readQuery(params), [params])
  const [resetCount, setResetCount] = useState(0)
  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params)
    next.delete('page')
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    setParams(next)
  }
  function reset() {
    setResetCount(resetCount + 1)
    setParams({})
  }
  return <div className={styles.catalog}>
    <header><h1>Danh sách sản phẩm</h1><p>Sản phẩm, thương hiệu và giá dùng để minh họa.</p></header>
    <div className={styles.layout}>
      <Filters key={JSON.stringify([query.category, query.brand, query.minPrice, query.maxPrice, resetCount])}
        categories={categories} brands={brands} query={query} update={update} reset={reset} />
      <section aria-label="Kết quả tìm kiếm" className={styles.results}>
        <label className={styles.sort}>Sắp xếp<select value={query.sort} onChange={e => update({ sort: e.target.value })}>
          <option value="default">Mặc định</option><option value="price-asc">Giá tăng dần</option><option value="price-desc">Giá giảm dần</option>
        </select></label>
        <Results key={params.toString()} query={query} source={source} brands={brands}
          changePage={page => update({ page: String(page) })} reset={reset} />
      </section>
    </div>
  </div>
}
