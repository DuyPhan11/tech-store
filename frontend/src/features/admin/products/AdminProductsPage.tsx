import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { adminProductApi } from '../../../lib/api/adminProductApi'
import { catalogApi } from '../../../lib/api/catalogApi'
import { ApiError } from '../../../lib/api/apiClient'
import type { PublicBrand, PublicCategory } from '../../catalog/list/catalogTypes'
import { SLUG_PATTERN, toSlug } from '../catalog/adminCatalogTypes'
import {
  MAX_PRODUCT_IMAGES,
  SKU_PATTERN,
  normalizeSku,
  validateImageFile,
  type AdminProduct,
  type AdminProductImageRef,
  type AdminProductPayload,
  type AdminProductSpec,
  type ProductStatus,
} from './adminProductTypes'
import styles from '../Admin.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }

/** Ảnh trong form: ảnh cũ đã lưu (imageId) hoặc file mới chọn (chưa upload). */
type ImageItem =
  | { key: string; kind: 'existing'; id: number; url: string }
  | { key: string; kind: 'new'; file: File; previewUrl: string }

interface FormState {
  name: string
  slug: string
  slugTouched: boolean
  sku: string
  categoryId: string
  brandId: string
  price: string
  costPrice: string
  description: string
  specs: AdminProductSpec[]
}

const emptyForm: FormState = {
  name: '',
  slug: '',
  slugTouched: false,
  sku: '',
  categoryId: '',
  brandId: '',
  price: '',
  costPrice: '',
  description: '',
  specs: [],
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

let imageKeySeq = 0
const nextImageKey = () => `img-${++imageKeySeq}`

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [categories, setCategories] = useState<PublicCategory[]>([])
  const [brands, setBrands] = useState<PublicBrand[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminProduct | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [images, setImages] = useState<ImageItem[]>([])
  const [primaryKey, setPrimaryKey] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null)

  const [toast, setToast] = useState('')
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      adminProductApi.listProducts(controller.signal),
      catalogApi.getCategories(controller.signal),
      catalogApi.getBrands(controller.signal),
    ])
      .then(([prods, cats, brs]) => {
        setProducts(prods)
        setCategories(cats)
        setBrands(brs)
        setLoadState({ status: 'ready' })
      })
      .catch(err => {
        if (!controller.signal.aborted) setLoadState({ status: 'error', message: errorMessage(err) })
      })
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const reload = () => {
    setLoadState({ status: 'loading' })
    setReloadKey(k => k + 1)
  }

  const filteredProducts = products.filter(p => {
    const keyword = search.toLowerCase()
    const matchSearch = p.name.toLowerCase().includes(keyword) || p.sku.toLowerCase().includes(keyword)
    const matchCat = categoryFilter === 'ALL' || String(p.categoryId) === categoryFilter
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  /** Chỉ chọn được danh mục/hãng ACTIVE; khi sửa vẫn hiển thị lựa chọn hiện tại nếu nó đã bị vô hiệu hóa. */
  const categoryOptions = useMemo(() => {
    const options = categories.map(c => ({ id: c.id, name: c.name }))
    if (editing && !categories.some(c => c.id === editing.categoryId)) {
      options.push({ id: editing.categoryId, name: `${editing.categoryName} (đang tạm ẩn)` })
    }
    return options
  }, [categories, editing])

  const brandOptions = useMemo(() => {
    const options = brands.map(b => ({ id: b.id, name: b.name }))
    if (editing && !brands.some(b => b.id === editing.brandId)) {
      options.push({ id: editing.brandId, name: `${editing.brandName} (đang tạm ẩn)` })
    }
    return options
  }, [brands, editing])

  // ---------------- Modal ----------------

  const releasePreviews = (items: readonly ImageItem[]) => {
    items.forEach(item => {
      if (item.kind === 'new') URL.revokeObjectURL(item.previewUrl)
    })
  }

  const resetModal = () => {
    releasePreviews(images)
    setImages([])
    setPrimaryKey(null)
    setFieldErrors({})
    setFormError('')
  }

  const openCreate = () => {
    resetModal()
    setEditing(null)
    setForm(emptyForm)
    setModalLoading(false)
    setIsModalOpen(true)
  }

  const openEdit = (product: AdminProduct) => {
    resetModal()
    setEditing(product)
    setModalLoading(true)
    setIsModalOpen(true)
    adminProductApi.getProduct(product.id)
      .then(detail => {
        setEditing(detail)
        setForm({
          name: detail.name,
          slug: detail.slug,
          slugTouched: true,
          sku: detail.sku,
          categoryId: String(detail.categoryId),
          brandId: String(detail.brandId),
          price: String(detail.price),
          costPrice: String(detail.costPrice),
          description: detail.description ?? '',
          specs: detail.specifications.map(s => ({ ...s })),
        })
        const items: ImageItem[] = [...detail.images]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map(img => ({ key: nextImageKey(), kind: 'existing', id: img.id, url: img.url }))
        setImages(items)
        const primaryIndex = [...detail.images].sort((a, b) => a.displayOrder - b.displayOrder).findIndex(img => img.primary)
        setPrimaryKey(items[primaryIndex >= 0 ? primaryIndex : 0]?.key ?? null)
      })
      .catch(err => setFormError(errorMessage(err)))
      .finally(() => setModalLoading(false))
  }

  const closeModal = () => {
    if (submitting) return
    resetModal()
    setIsModalOpen(false)
  }

  const handleNameChange = (value: string) => {
    setForm(prev => ({ ...prev, name: value, slug: prev.slugTouched ? prev.slug : toSlug(value) }))
  }

  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (selected.length === 0) return
    for (const file of selected) {
      const problem = validateImageFile(file)
      if (problem) {
        setFieldErrors(prev => ({ ...prev, images: problem }))
        return
      }
    }
    if (images.length + selected.length > MAX_PRODUCT_IMAGES) {
      setFieldErrors(prev => ({ ...prev, images: `Mỗi sản phẩm tối đa ${MAX_PRODUCT_IMAGES} ảnh` }))
      return
    }
    const added: ImageItem[] = selected.map(file => ({
      key: nextImageKey(),
      kind: 'new',
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setImages(prev => [...prev, ...added])
    setPrimaryKey(prev => prev ?? added[0].key)
    setFieldErrors(prev => {
      const next = { ...prev }
      delete next.images
      return next
    })
  }

  const removeImage = (key: string) => {
    const target = images.find(item => item.key === key)
    if (target) releasePreviews([target])
    const remaining = images.filter(item => item.key !== key)
    setImages(remaining)
    if (primaryKey === key) setPrimaryKey(remaining[0]?.key ?? null)
  }

  const moveImage = (key: string, delta: -1 | 1) => {
    setImages(prev => {
      const index = prev.findIndex(item => item.key === key)
      const target = index + delta
      if (index < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const updateSpec = (index: number, field: keyof AdminProductSpec, value: string) => {
    setForm(prev => ({
      ...prev,
      specs: prev.specs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }))
  }

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.name.trim()) errors.name = 'Tên sản phẩm không được để trống'
    if (!SLUG_PATTERN.test(form.slug.trim())) errors.slug = 'Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang giữa các từ'
    if (!SKU_PATTERN.test(form.sku.trim())) errors.sku = 'SKU chỉ gồm chữ in hoa A-Z, số 0-9 và dấu gạch ngang giữa các cụm'
    if (!form.categoryId) errors.categoryId = 'Vui lòng chọn danh mục'
    if (!form.brandId) errors.brandId = 'Vui lòng chọn thương hiệu'
    const price = Number(form.price)
    if (form.price.trim() === '' || !Number.isFinite(price) || price < 0) errors.price = 'Giá bán phải là số không âm'
    const cost = Number(form.costPrice)
    if (form.costPrice.trim() === '' || !Number.isFinite(cost) || cost < 0) errors.costPrice = 'Giá vốn phải là số không âm'
    if (form.specs.some(s => (s.label.trim() === '') !== (s.value.trim() === ''))) {
      errors.specifications = 'Mỗi dòng thông số cần đủ tên và giá trị'
    }
    if (images.length > MAX_PRODUCT_IMAGES) errors.images = `Mỗi sản phẩm tối đa ${MAX_PRODUCT_IMAGES} ảnh`
    return errors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting || modalLoading) return
    const errors = validateForm()
    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    const files: File[] = []
    const refs: AdminProductImageRef[] = images.map(item => {
      const primary = item.key === primaryKey
      if (item.kind === 'existing') return { imageId: item.id, primary }
      files.push(item.file)
      return { fileIndex: files.length - 1, primary }
    })
    const payload: AdminProductPayload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      sku: form.sku.trim(),
      categoryId: Number(form.categoryId),
      brandId: Number(form.brandId),
      price: Number(form.price),
      costPrice: Number(form.costPrice),
      description: form.description.trim() || null,
      specifications: form.specs
        .filter(s => s.label.trim() && s.value.trim())
        .map(s => ({ label: s.label.trim(), value: s.value.trim() })),
      images: refs,
    }

    setSubmitting(true)
    try {
      const saved = editing
        ? await adminProductApi.updateProduct(editing.id, payload, files)
        : await adminProductApi.createProduct(payload, files)
      setProducts(prev => (editing ? prev.map(p => (p.id === saved.id ? saved : p)) : [saved, ...prev]))
      releasePreviews(images)
      setImages([])
      setIsModalOpen(false)
      setToast(editing ? 'Đã cập nhật sản phẩm thành công!' : 'Đã thêm sản phẩm mới thành công!')
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.errors)
      setFormError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (product: AdminProduct) => {
    const nextStatus: ProductStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setPendingStatusId(product.id)
    setPageError('')
    try {
      const saved = await adminProductApi.updateStatus(product.id, nextStatus)
      setProducts(prev => prev.map(p => (p.id === saved.id ? { ...p, status: saved.status, updatedAt: saved.updatedAt } : p)))
      setToast('Đã cập nhật trạng thái sản phẩm!')
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setPendingStatusId(null)
    }
  }

  const isReady = loadState.status === 'ready'

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý sản phẩm (Products)</h1>
          <p>Quản lý toàn bộ danh mục sản phẩm, cấu hình giá bán, hình ảnh và trạng thái hiển thị.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={openCreate} disabled={!isReady}>
            + Thêm sản phẩm mới
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice} role="status">{toast}</div>}
      {pageError && <div className={styles.errorNotice} role="alert">{pageError}</div>}

      {/* Toolbar & Filter */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className={styles.selectInput}
            aria-label="Lọc theo danh mục"
          >
            <option value="ALL">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={styles.selectInput}
            aria-label="Lọc theo trạng thái"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kinh doanh (ACTIVE)</option>
            <option value="INACTIVE">Tạm ẩn (INACTIVE)</option>
          </select>

          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => {
                setSearch('')
                setCategoryFilter('ALL')
                setStatusFilter('ALL')
              }}
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
        </div>
      </div>

      {loadState.status === 'error' && (
        <div className={styles.errorNotice} role="alert">
          {loadState.message}{' '}
          <button type="button" className={styles.actionBtn} onClick={reload}>Thử lại</button>
        </div>
      )}

      {/* Products Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>SKU</th>
              <th>Danh mục</th>
              <th>Hãng</th>
              <th>Giá bán niêm yết</th>
              <th>Tồn khả dụng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadState.status === 'loading' ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Đang tải danh sách sản phẩm...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  {products.length === 0 && isReady
                    ? 'Chưa có sản phẩm nào.'
                    : 'Không tìm thấy sản phẩm nào phù hợp với điều kiện lọc.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productCell}>
                      {p.primaryImageUrl ? (
                        <img src={p.primaryImageUrl} alt={p.name} className={styles.productThumb} />
                      ) : (
                        <div className={styles.productThumb} aria-hidden="true" style={{ background: '#F5F7FF' }} />
                      )}
                      <div className={styles.productMeta}>
                        <span className={styles.productName}>{p.name}</span>
                        <span className={styles.subText}>{p.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.categoryName}</td>
                  <td><strong>{p.brandName}</strong></td>
                  <td><strong>{currency.format(p.price)}</strong></td>
                  <td>
                    <span style={{ fontWeight: 600, color: p.totalStock <= 5 ? '#d97706' : '#000000' }}>
                      {p.totalStock} chiếc
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${p.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {p.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleToggleStatus(p)}
                        disabled={pendingStatusId === p.id}
                        title="Bật/Tắt trạng thái kinh doanh"
                      >
                        {p.status === 'ACTIVE' ? 'Tạm ẩn' : 'Kích hoạt'}
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => openEdit(p)}
                        title="Sửa sản phẩm"
                      >
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit Product */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalWindow}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="product-modal-title">{editing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm công nghệ mới'}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={closeModal} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorNotice} role="alert">{formError}</div>}
                {modalLoading && <p style={{ color: 'var(--ts-color-muted)' }}>Đang tải chi tiết sản phẩm...</p>}

                <div className={styles.formGroup}>
                  <label htmlFor="p-name">Tên sản phẩm *</label>
                  <input
                    id="p-name"
                    type="text"
                    required
                    maxLength={200}
                    placeholder="ví dụ: Laptop MSI Creator Z16P..."
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    aria-invalid={fieldErrors.name ? true : undefined}
                  />
                  {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-slug">Đường dẫn (Slug) *</label>
                    <input
                      id="p-slug"
                      type="text"
                      required
                      maxLength={255}
                      placeholder="laptop-msi-creator-z16p"
                      value={form.slug}
                      onChange={e => setForm(prev => ({ ...prev, slug: e.target.value, slugTouched: true }))}
                      aria-invalid={fieldErrors.slug ? true : undefined}
                    />
                    {fieldErrors.slug && <span className={styles.fieldError}>{fieldErrors.slug}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-sku">Mã SKU *</label>
                    <input
                      id="p-sku"
                      type="text"
                      required
                      maxLength={50}
                      placeholder="ví dụ: MSI-CREATOR-16"
                      value={form.sku}
                      onChange={e => setForm(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                      onBlur={() => setForm(prev => ({ ...prev, sku: normalizeSku(prev.sku) }))}
                      aria-invalid={fieldErrors.sku ? true : undefined}
                    />
                    {fieldErrors.sku && <span className={styles.fieldError}>{fieldErrors.sku}</span>}
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-category">Danh mục *</label>
                    <select
                      id="p-category"
                      value={form.categoryId}
                      onChange={e => setForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      aria-invalid={fieldErrors.categoryId ? true : undefined}
                    >
                      <option value="">— Chọn danh mục —</option>
                      {categoryOptions.map(c => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                    {fieldErrors.categoryId && <span className={styles.fieldError}>{fieldErrors.categoryId}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-brand">Thương hiệu *</label>
                    <select
                      id="p-brand"
                      value={form.brandId}
                      onChange={e => setForm(prev => ({ ...prev, brandId: e.target.value }))}
                      aria-invalid={fieldErrors.brandId ? true : undefined}
                    >
                      <option value="">— Chọn thương hiệu —</option>
                      {brandOptions.map(b => (
                        <option key={b.id} value={String(b.id)}>{b.name}</option>
                      ))}
                    </select>
                    {fieldErrors.brandId && <span className={styles.fieldError}>{fieldErrors.brandId}</span>}
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-price">Giá bán (VND) *</label>
                    <input
                      id="p-price"
                      type="number"
                      min={0}
                      required
                      value={form.price}
                      onChange={e => setForm(prev => ({ ...prev, price: e.target.value }))}
                      aria-invalid={fieldErrors.price ? true : undefined}
                    />
                    {fieldErrors.price && <span className={styles.fieldError}>{fieldErrors.price}</span>}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-cost">Giá vốn (VND) *</label>
                    <input
                      id="p-cost"
                      type="number"
                      min={0}
                      required
                      value={form.costPrice}
                      onChange={e => setForm(prev => ({ ...prev, costPrice: e.target.value }))}
                      aria-invalid={fieldErrors.costPrice ? true : undefined}
                    />
                    {fieldErrors.costPrice && <span className={styles.fieldError}>{fieldErrors.costPrice}</span>}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="p-description">Mô tả sản phẩm</label>
                  <textarea
                    id="p-description"
                    rows={3}
                    maxLength={20000}
                    style={{ fontFamily: 'inherit' }}
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Thông số kỹ thuật</label>
                  {form.specs.map((spec, index) => (
                    <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                      <input
                        type="text"
                        aria-label={`Tên thông số ${index + 1}`}
                        placeholder="ví dụ: CPU"
                        maxLength={100}
                        value={spec.label}
                        onChange={e => updateSpec(index, 'label', e.target.value)}
                      />
                      <input
                        type="text"
                        aria-label={`Giá trị thông số ${index + 1}`}
                        placeholder="ví dụ: Intel Core i7-13700H"
                        maxLength={500}
                        value={spec.value}
                        onChange={e => updateSpec(index, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.actionBtn}
                        aria-label={`Xóa dòng thông số ${index + 1}`}
                        onClick={() => setForm(prev => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }))}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => setForm(prev => ({ ...prev, specs: [...prev.specs, { label: '', value: '' }] }))}
                    >
                      + Thêm thông số
                    </button>
                  </div>
                  {fieldErrors.specifications && <span className={styles.fieldError}>{fieldErrors.specifications}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="p-images">
                    Hình ảnh sản phẩm ({images.length}/{MAX_PRODUCT_IMAGES})
                  </label>
                  {images.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      {images.map((item, index) => {
                        const src = item.kind === 'existing' ? item.url : item.previewUrl
                        const isPrimary = item.key === primaryKey
                        return (
                          <div
                            key={item.key}
                            style={{
                              width: '112px',
                              border: `2px solid ${isPrimary ? 'var(--ts-color-primary, #0156FF)' : '#CACDD8'}`,
                              borderRadius: '6px',
                              padding: '4px',
                              fontSize: '12px',
                            }}
                          >
                            <img
                              src={src}
                              alt={`${form.name || 'Sản phẩm'} - ảnh ${index + 1}`}
                              style={{ width: '100%', height: '72px', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0' }}>
                              <input
                                type="radio"
                                name="primary-image"
                                checked={isPrimary}
                                onChange={() => setPrimaryKey(item.key)}
                              />
                              Ảnh đại diện
                            </label>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Đưa ảnh ${index + 1} lên trước`}
                                disabled={index === 0}
                                onClick={() => moveImage(item.key, -1)}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtn}
                                aria-label={`Đưa ảnh ${index + 1} ra sau`}
                                disabled={index === images.length - 1}
                                onClick={() => moveImage(item.key, 1)}
                              >
                                ›
                              </button>
                              <button
                                type="button"
                                className={styles.actionBtnDanger}
                                aria-label={`Gỡ ảnh ${index + 1}`}
                                onClick={() => removeImage(item.key)}
                              >
                                Gỡ
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <input
                    id="p-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={images.length >= MAX_PRODUCT_IMAGES || modalLoading}
                    onChange={handleFilesSelected}
                  />
                  <span className={styles.subText}>JPEG, PNG hoặc WebP, tối đa 5MB mỗi ảnh. Ảnh được tải lên khi bấm Lưu.</span>
                  {fieldErrors.images && <span className={styles.fieldError}>{fieldErrors.images}</span>}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={closeModal} disabled={submitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn} disabled={submitting || modalLoading}>
                  {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
