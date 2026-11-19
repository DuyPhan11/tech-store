import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adminCatalogApi } from '../../../lib/api/adminCatalogApi'
import { ApiError } from '../../../lib/api/apiClient'
import {
  SLUG_PATTERN,
  toSlug,
  type AdminBrand,
  type AdminCategory,
  type CatalogStatus,
} from './adminCatalogTypes'
import styles from '../Admin.module.css'

type Tab = 'CATEGORIES' | 'BRANDS'
type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }

interface FormState {
  name: string
  slug: string
  slugTouched: boolean
  description: string
  parentId: string
  country: string
}

const emptyForm: FormState = { name: '', slug: '', slugTouched: false, description: '', parentId: '', country: '' }

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

/** Id các danh mục con cháu của `rootId` — không được chọn làm danh mục cha (chống vòng). */
function descendantIds(categories: readonly AdminCategory[], rootId: number): Set<number> {
  const result = new Set<number>([rootId])
  let changed = true
  while (changed) {
    changed = false
    for (const c of categories) {
      if (c.parentId !== null && result.has(c.parentId) && !result.has(c.id)) {
        result.add(c.id)
        changed = true
      }
    }
  }
  return result
}

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<Tab>('CATEGORIES')
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [brands, setBrands] = useState<AdminBrand[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingStatusKey, setPendingStatusKey] = useState<string | null>(null)

  const [toast, setToast] = useState('')
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      adminCatalogApi.listCategories(controller.signal),
      adminCatalogApi.listBrands(controller.signal),
    ])
      .then(([cats, brs]) => {
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

  const isCategoryTab = activeTab === 'CATEGORIES'

  const parentOptions = useMemo(() => {
    const excluded = editingId !== null && isCategoryTab ? descendantIds(categories, editingId) : new Set<number>()
    return categories.filter(c => !excluded.has(c.id))
  }, [categories, editingId, isCategoryTab])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditCategory = (cat: AdminCategory) => {
    setEditingId(cat.id)
    setForm({
      name: cat.name,
      slug: cat.slug,
      slugTouched: true,
      description: cat.description ?? '',
      parentId: cat.parentId !== null ? String(cat.parentId) : '',
      country: '',
    })
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  const openEditBrand = (brand: AdminBrand) => {
    setEditingId(brand.id)
    setForm({
      name: brand.name,
      slug: brand.slug,
      slugTouched: true,
      description: brand.description ?? '',
      parentId: '',
      country: brand.country ?? '',
    })
    setFieldErrors({})
    setFormError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setIsModalOpen(false)
  }

  const handleNameChange = (value: string) => {
    setForm(prev => ({ ...prev, name: value, slug: prev.slugTouched ? prev.slug : toSlug(value) }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const name = form.name.trim()
    const slug = form.slug.trim()
    const localErrors: Record<string, string> = {}
    if (!name) localErrors.name = 'Tên không được để trống'
    if (!slug) localErrors.slug = 'Slug không được để trống'
    else if (!SLUG_PATTERN.test(slug)) localErrors.slug = 'Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang giữa các từ'
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    setSubmitting(true)
    setFieldErrors({})
    setFormError('')
    try {
      if (isCategoryTab) {
        const payload = {
          name,
          slug,
          description: form.description.trim() || null,
          parentId: form.parentId ? Number(form.parentId) : null,
        }
        if (editingId === null) {
          const created = await adminCatalogApi.createCategory(payload)
          setCategories(prev => [...prev, created])
          setToast('Đã thêm danh mục mới thành công!')
        } else {
          const updated = await adminCatalogApi.updateCategory(editingId, payload)
          // Cập nhật dòng đã sửa và tên cha hiển thị ở các danh mục con
          setCategories(prev => prev.map(c => {
            if (c.id === updated.id) return updated
            if (c.parentId === updated.id) return { ...c, parentName: updated.name }
            return c
          }))
          setToast('Đã cập nhật danh mục thành công!')
        }
      } else {
        const payload = {
          name,
          slug,
          country: form.country.trim() || null,
          description: form.description.trim() || null,
        }
        if (editingId === null) {
          const created = await adminCatalogApi.createBrand(payload)
          setBrands(prev => [...prev, created])
          setToast('Đã thêm thương hiệu mới thành công!')
        } else {
          const updated = await adminCatalogApi.updateBrand(editingId, payload)
          setBrands(prev => prev.map(b => (b.id === updated.id ? updated : b)))
          setToast('Đã cập nhật thương hiệu thành công!')
        }
      }
      setIsModalOpen(false)
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.errors)
      setFormError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const toggleCategory = async (cat: AdminCategory) => {
    const next: CatalogStatus = cat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setPendingStatusKey(`cat-${cat.id}`)
    setPageError('')
    try {
      const updated = await adminCatalogApi.updateCategoryStatus(cat.id, next)
      setCategories(prev => prev.map(c => (c.id === updated.id ? updated : c)))
      setToast('Đã cập nhật trạng thái danh mục!')
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setPendingStatusKey(null)
    }
  }

  const toggleBrand = async (brand: AdminBrand) => {
    const next: CatalogStatus = brand.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setPendingStatusKey(`br-${brand.id}`)
    setPageError('')
    try {
      const updated = await adminCatalogApi.updateBrandStatus(brand.id, next)
      setBrands(prev => prev.map(b => (b.id === updated.id ? updated : b)))
      setToast('Đã cập nhật trạng thái thương hiệu!')
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setPendingStatusKey(null)
    }
  }

  const fieldLabel = isCategoryTab ? 'danh mục' : 'thương hiệu'
  const modalTitle = `${editingId === null ? 'Thêm' : 'Cập nhật'} ${isCategoryTab ? 'danh mục' : 'thương hiệu'}${editingId === null ? ' mới' : ''}`

  const renderBody = () => {
    if (loadState.status === 'loading') {
      return <p role="status">Đang tải danh mục và thương hiệu…</p>
    }
    if (loadState.status === 'error') {
      return (
        <div className={styles.errorNotice} role="alert">
          Không tải được dữ liệu catalog: {loadState.message}{' '}
          <button type="button" className={styles.actionBtn} onClick={reload}>Thử lại</button>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý danh mục & thương hiệu (Catalog)</h1>
          <p>Thiết lập cây phân cấp danh mục ngành hàng và các thương hiệu công nghệ đối tác phân phối.</p>
        </div>
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.pillPrimaryBtn}
            onClick={openCreate}
            disabled={loadState.status !== 'ready'}
          >
            + Thêm {isCategoryTab ? 'danh mục mới' : 'thương hiệu mới'}
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice} role="status">{toast}</div>}
      {pageError && <div className={styles.errorNotice} role="alert">{pageError}</div>}

      {/* Tabs */}
      <div className={styles.statusTabs}>
        <button
          type="button"
          className={`${styles.statusTabBtn} ${isCategoryTab ? styles.activeStatusTab : ''}`}
          onClick={() => setActiveTab('CATEGORIES')}
        >
          Danh mục sản phẩm ({categories.length})
        </button>
        <button
          type="button"
          className={`${styles.statusTabBtn} ${!isCategoryTab ? styles.activeStatusTab : ''}`}
          onClick={() => setActiveTab('BRANDS')}
        >
          Thương hiệu đối tác ({brands.length})
        </button>
      </div>

      {renderBody()}

      {/* Categories View */}
      {loadState.status === 'ready' && isCategoryTab && (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Đường dẫn (Slug)</th>
                <th>Mô tả chi tiết</th>
                <th>Số sản phẩm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr><td colSpan={6}>Chưa có danh mục nào.</td></tr>
              )}
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>
                    {cat.name}
                    {cat.parentName && <span className={styles.subText}>Thuộc: {cat.parentName}</span>}
                  </td>
                  <td><code>/products?category={cat.slug}</code></td>
                  <td>{cat.description}</td>
                  <td><strong>{cat.productCount}</strong> sản phẩm</td>
                  <td>
                    <span className={`${styles.badge} ${cat.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {cat.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button type="button" className={styles.actionBtn} onClick={() => openEditCategory(cat)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => toggleCategory(cat)}
                        disabled={pendingStatusKey === `cat-${cat.id}`}
                      >
                        {cat.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brands View */}
      {loadState.status === 'ready' && !isCategoryTab && (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tên thương hiệu</th>
                <th>Quốc gia xuất xứ</th>
                <th>Số lượng sản phẩm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {brands.length === 0 && (
                <tr><td colSpan={5}>Chưa có thương hiệu nào.</td></tr>
              )}
              {brands.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, fontSize: '15px' }}>
                    {b.name}
                    <span className={styles.subText}>{b.slug}</span>
                  </td>
                  <td>{b.country || '—'}</td>
                  <td><strong>{b.productCount}</strong> sản phẩm</td>
                  <td>
                    <span className={`${styles.badge} ${b.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {b.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button type="button" className={styles.actionBtn} onClick={() => openEditBrand(b)}>
                        Sửa
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => toggleBrand(b)}
                        disabled={pendingStatusKey === `br-${b.id}`}
                      >
                        {b.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalWindow}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="catalog-modal-title">{modalTitle}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={closeModal} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorNotice} role="alert">{formError}</div>}

                <div className={styles.formGroup}>
                  <label htmlFor="cat-name">Tên {fieldLabel} *</label>
                  <input
                    id="cat-name"
                    type="text"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder={isCategoryTab ? 'ví dụ: Bàn phím cơ & Chuột' : 'ví dụ: Corsair'}
                    aria-invalid={fieldErrors.name ? true : undefined}
                  />
                  {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cat-slug">Đường dẫn (Slug) *</label>
                  <input
                    id="cat-slug"
                    type="text"
                    required
                    maxLength={100}
                    value={form.slug}
                    onChange={e => setForm(prev => ({ ...prev, slug: e.target.value, slugTouched: true }))}
                    placeholder={isCategoryTab ? 'ban-phim-co-chuot' : 'corsair'}
                    aria-invalid={fieldErrors.slug ? true : undefined}
                  />
                  {fieldErrors.slug && <span className={styles.fieldError}>{fieldErrors.slug}</span>}
                </div>

                {isCategoryTab ? (
                  <div className={styles.formGroup}>
                    <label htmlFor="cat-parent">Danh mục cha</label>
                    <select
                      id="cat-parent"
                      value={form.parentId}
                      onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                    >
                      <option value="">— Danh mục gốc (cấp 1) —</option>
                      {parentOptions.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                          {c.status === 'INACTIVE' ? ' (Tạm ẩn)' : ''}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.parentId && <span className={styles.fieldError}>{fieldErrors.parentId}</span>}
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label htmlFor="cat-extra">Quốc gia xuất xứ</label>
                    <input
                      id="cat-extra"
                      type="text"
                      maxLength={100}
                      value={form.country}
                      onChange={e => setForm(prev => ({ ...prev, country: e.target.value }))}
                      placeholder="ví dụ: Mỹ, Nhật Bản, Đài Loan..."
                    />
                    {fieldErrors.country && <span className={styles.fieldError}>{fieldErrors.country}</span>}
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="cat-description">{isCategoryTab ? 'Mô tả tóm tắt' : 'Mô tả'}</label>
                  <input
                    id="cat-description"
                    type="text"
                    maxLength={2000}
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder={isCategoryTab ? 'Các dòng chuột không dây, phím cơ custom...' : 'Giới thiệu ngắn về thương hiệu'}
                  />
                  {fieldErrors.description && <span className={styles.fieldError}>{fieldErrors.description}</span>}
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={closeModal} disabled={submitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn} disabled={submitting} aria-busy={submitting || undefined}>
                  {submitting ? 'Đang lưu…' : 'Lưu dữ liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
