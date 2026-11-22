import { useEffect, useState, type FormEvent } from 'react'
import { adminInventoryApi } from '../../../lib/api/adminInventoryApi'
import { adminProductApi } from '../../../lib/api/adminProductApi'
import { ApiError } from '../../../lib/api/apiClient'
import type { AdminProduct } from '../products/adminProductTypes'
import {
  ADJUST_TYPE_LABELS,
  stockLevel,
  type AdjustType,
  type InventoryBranchOption,
  type InventoryItem,
} from './adminInventoryTypes'
import styles from '../Admin.module.css'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }
type ModalKind = 'TRANSFER' | 'ADJUST' | null

interface ModalForm {
  productId: string
  branchId: string
  fromBranchId: string
  toBranchId: string
  type: AdjustType
  quantity: string
  reason: string
}

const emptyModalForm: ModalForm = {
  productId: '',
  branchId: '',
  fromBranchId: '',
  toBranchId: '',
  type: 'INBOUND',
  quantity: '1',
  reason: '',
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

export function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [branches, setBranches] = useState<InventoryBranchOption[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  const [branchFilter, setBranchFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  const [pendingRowId, setPendingRowId] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [pageError, setPageError] = useState('')

  const [modal, setModal] = useState<ModalKind>(null)
  const [form, setForm] = useState<ModalForm>(emptyModalForm)
  const [products, setProducts] = useState<AdminProduct[] | null>(null)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Debounce ô tìm kiếm trước khi gọi API (lọc phía server theo q)
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    adminInventoryApi.listBranches(controller.signal)
      .then(setBranches)
      .catch(err => {
        if (!controller.signal.aborted) setPageError(errorMessage(err))
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    adminInventoryApi
      .listInventories({ branchId: branchFilter === 'ALL' ? null : Number(branchFilter), q: query }, controller.signal)
      .then(items => {
        setInventory(items)
        setLoadState({ status: 'ready' })
      })
      .catch(err => {
        if (!controller.signal.aborted) setLoadState({ status: 'error', message: errorMessage(err) })
      })
    return () => controller.abort()
  }, [branchFilter, query, reloadKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const reload = () => {
    setLoadState({ status: 'loading' })
    setReloadKey(k => k + 1)
  }

  const activeBranches = branches.filter(b => b.status === 'ACTIVE')

  // ---------------- Thao tác nhanh trên một dòng ----------------

  const handleQuickAdjust = async (item: InventoryItem, type: 'INBOUND' | 'OUTBOUND', quantity: number) => {
    if (pendingRowId !== null) return
    setPendingRowId(item.inventoryId)
    setPageError('')
    try {
      const saved = await adminInventoryApi.adjust({
        productId: item.productId,
        branchId: item.branchId,
        type,
        quantity,
        reason: type === 'INBOUND' ? `Nhập nhanh +${quantity}` : `Xuất nhanh −${quantity}`,
      })
      setInventory(prev => prev.map(row => (row.inventoryId === saved.inventoryId ? saved : row)))
      setToast('Đã cập nhật số lượng tồn kho!')
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setPendingRowId(null)
    }
  }

  // ---------------- Modal ----------------

  const openModal = (kind: Exclude<ModalKind, null>) => {
    setForm({
      ...emptyModalForm,
      branchId: activeBranches[0] ? String(activeBranches[0].id) : '',
      fromBranchId: activeBranches[0] ? String(activeBranches[0].id) : '',
      toBranchId: activeBranches[1] ? String(activeBranches[1].id) : '',
    })
    setFormError('')
    setFieldErrors({})
    setPageError('')
    setModal(kind)
    if (products === null) {
      adminProductApi.listProducts()
        .then(setProducts)
        .catch(err => setFormError(errorMessage(err)))
    }
  }

  const closeModal = () => {
    if (submitting) return
    setModal(null)
  }

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    if (!form.productId) errors.productId = 'Vui lòng chọn sản phẩm'
    const qty = Number(form.quantity)
    const allowZero = modal === 'ADJUST' && form.type === 'SET'
    if (form.quantity.trim() === '' || !Number.isInteger(qty) || qty < 0 || (!allowZero && qty === 0)) {
      errors.quantity = allowZero ? 'Số lượng phải là số nguyên ≥ 0' : 'Số lượng phải là số nguyên > 0'
    }
    if (modal === 'ADJUST' && !form.branchId) errors.branchId = 'Vui lòng chọn chi nhánh'
    if (modal === 'TRANSFER') {
      if (!form.fromBranchId) errors.fromBranchId = 'Vui lòng chọn chi nhánh xuất'
      if (!form.toBranchId) errors.toBranchId = 'Vui lòng chọn chi nhánh nhận'
      if (form.fromBranchId && form.fromBranchId === form.toBranchId) {
        errors.toBranchId = 'Chi nhánh xuất và chi nhánh nhận không được trùng nhau'
      }
    }
    if (form.reason.length > 255) errors.reason = 'Lý do tối đa 255 ký tự'
    return errors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const errors = validate()
    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    const reason = form.reason.trim() || null
    setSubmitting(true)
    try {
      if (modal === 'TRANSFER') {
        const result = await adminInventoryApi.transfer({
          productId: Number(form.productId),
          fromBranchId: Number(form.fromBranchId),
          toBranchId: Number(form.toBranchId),
          quantity: Number(form.quantity),
          reason,
        })
        setToast(`Đã điều chuyển ${form.quantity} sản phẩm từ ${result.from.branchName} sang ${result.to.branchName}!`)
      } else {
        const saved = await adminInventoryApi.adjust({
          productId: Number(form.productId),
          branchId: Number(form.branchId),
          type: form.type,
          quantity: Number(form.quantity),
          reason,
        })
        setToast(`Đã cập nhật tồn ${saved.sku} tại ${saved.branchName}: ${saved.quantity} chiếc`)
      }
      setModal(null)
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.errors)
      setFormError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const setField = (field: keyof ModalForm) => (value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const branchSelect = (id: string, label: string, field: 'branchId' | 'fromBranchId' | 'toBranchId') => (
    <div className={styles.formGroup}>
      <label htmlFor={id}>{label} *</label>
      <select
        id={id}
        value={form[field]}
        onChange={e => setField(field)(e.target.value)}
        aria-invalid={fieldErrors[field] ? true : undefined}
      >
        <option value="">— Chọn chi nhánh —</option>
        {activeBranches.map(b => (
          <option key={b.id} value={String(b.id)}>{b.name}</option>
        ))}
      </select>
      {fieldErrors[field] && <span className={styles.fieldError}>{fieldErrors[field]}</span>}
    </div>
  )

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý kho hàng & Tồn kho (Inventory)</h1>
          <p>Theo dõi mức tồn kho đa chi nhánh, cảnh báo hết hàng và điều phối luân chuyển hàng hóa.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.actionBtn} onClick={() => openModal('ADJUST')} disabled={branches.length === 0}>
            ± Điều chỉnh tồn kho
          </button>
          <button type="button" className={styles.pillPrimaryBtn} onClick={() => openModal('TRANSFER')} disabled={branches.length === 0}>
            ⇄ Điều chuyển kho
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
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className={styles.selectInput}
            aria-label="Lọc theo chi nhánh"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map(b => (
              <option key={b.id} value={String(b.id)}>
                {b.name}{b.status === 'INACTIVE' ? ' (tạm dừng)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{inventory.length}</strong> bản ghi kho
        </div>
      </div>

      {loadState.status === 'error' && (
        <div className={styles.errorNotice} role="alert">
          {loadState.message}{' '}
          <button type="button" className={styles.actionBtn} onClick={reload}>Thử lại</button>
        </div>
      )}

      {/* Inventory Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>SKU</th>
              <th>Chi nhánh lưu kho</th>
              <th>Số lượng tồn</th>
              <th>Ngưỡng an toàn</th>
              <th>Tình trạng tồn</th>
              <th>Thao tác điều chỉnh</th>
            </tr>
          </thead>
          <tbody>
            {loadState.status === 'loading' && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Đang tải dữ liệu tồn kho...
                </td>
              </tr>
            )}
            {loadState.status === 'ready' && inventory.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Không có bản ghi tồn kho phù hợp. Dùng “± Điều chỉnh tồn kho” để nhập kho lần đầu cho sản phẩm.
                </td>
              </tr>
            )}
            {loadState.status === 'ready' && inventory.map(item => {
              const level = stockLevel(item.quantity, item.minStockAlert)
              const branchInactive = item.branchStatus !== 'ACTIVE'
              const busy = pendingRowId === item.inventoryId
              return (
                <tr key={item.inventoryId}>
                  <td style={{ fontWeight: 600 }}>{item.productName}</td>
                  <td><code>{item.sku}</code></td>
                  <td>
                    {item.branchName}
                    {branchInactive && <span className={styles.subText}>(tạm dừng hoạt động)</span>}
                  </td>
                  <td>
                    <strong style={{ fontSize: '15px' }}>{item.quantity}</strong> chiếc
                  </td>
                  <td>{item.minStockAlert} chiếc</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        level === 'IN_STOCK'
                          ? styles.badgeInStock
                          : level === 'LOW_STOCK'
                          ? styles.badgeLowStock
                          : styles.badgeOutOfStock
                      }`}
                    >
                      {level === 'IN_STOCK' ? 'Còn hàng' : level === 'LOW_STOCK' ? 'Sắp hết hàng' : 'Hết hàng'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleQuickAdjust(item, 'OUTBOUND', 1)}
                        disabled={branchInactive || busy || item.quantity === 0}
                        title="Xuất 1"
                      >
                        −1
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleQuickAdjust(item, 'INBOUND', 5)}
                        disabled={branchInactive || busy}
                        title="Nhập thêm 5"
                      >
                        +5
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleQuickAdjust(item, 'INBOUND', 20)}
                        disabled={branchInactive || busy}
                        title="Nhập thêm 20"
                      >
                        +20
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Điều chỉnh tồn / Điều chuyển kho */}
      {modal !== null && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalWindow}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="inventory-modal-title">
                {modal === 'TRANSFER' ? 'Điều chuyển hàng hóa giữa các chi nhánh' : 'Điều chỉnh tồn kho'}
              </h2>
              <button type="button" className={styles.closeModalBtn} onClick={closeModal} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorNotice} role="alert">{formError}</div>}

                <div className={styles.formGroup}>
                  <label htmlFor="inv-prod">{modal === 'TRANSFER' ? 'Chọn sản phẩm cần chuyển *' : 'Sản phẩm *'}</label>
                  <select
                    id="inv-prod"
                    value={form.productId}
                    onChange={e => setField('productId')(e.target.value)}
                    disabled={products === null}
                    aria-invalid={fieldErrors.productId ? true : undefined}
                  >
                    <option value="">{products === null ? 'Đang tải sản phẩm...' : '— Chọn sản phẩm —'}</option>
                    {(products ?? []).map(p => (
                      <option key={p.id} value={String(p.id)}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  {fieldErrors.productId && <span className={styles.fieldError}>{fieldErrors.productId}</span>}
                </div>

                {modal === 'TRANSFER' ? (
                  <div className={styles.formRowTwo}>
                    {branchSelect('tr-from', 'Chi nhánh xuất hàng (Source)', 'fromBranchId')}
                    {branchSelect('tr-to', 'Chi nhánh nhận hàng (Target)', 'toBranchId')}
                  </div>
                ) : (
                  <div className={styles.formRowTwo}>
                    {branchSelect('adj-branch', 'Chi nhánh', 'branchId')}
                    <div className={styles.formGroup}>
                      <label htmlFor="adj-type">Loại điều chỉnh *</label>
                      <select id="adj-type" value={form.type} onChange={e => setField('type')(e.target.value)}>
                        {(Object.keys(ADJUST_TYPE_LABELS) as AdjustType[]).map(t => (
                          <option key={t} value={t}>{ADJUST_TYPE_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="inv-qty">
                    {modal === 'TRANSFER'
                      ? 'Số lượng điều chuyển *'
                      : form.type === 'SET' ? 'Số lượng tồn mới *' : 'Số lượng *'}
                  </label>
                  <input
                    id="inv-qty"
                    type="number"
                    min={modal === 'ADJUST' && form.type === 'SET' ? 0 : 1}
                    step={1}
                    value={form.quantity}
                    onChange={e => setField('quantity')(e.target.value)}
                    aria-invalid={fieldErrors.quantity ? true : undefined}
                  />
                  {fieldErrors.quantity && <span className={styles.fieldError}>{fieldErrors.quantity}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="inv-reason">Lý do / ghi chú</label>
                  <input
                    id="inv-reason"
                    type="text"
                    maxLength={255}
                    placeholder="ví dụ: Nhập lô hàng tháng 11"
                    value={form.reason}
                    onChange={e => setField('reason')(e.target.value)}
                  />
                  {fieldErrors.reason && <span className={styles.fieldError}>{fieldErrors.reason}</span>}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={closeModal} disabled={submitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn} disabled={submitting || products === null}>
                  {submitting ? 'Đang lưu...' : modal === 'TRANSFER' ? 'Xác nhận chuyển kho' : 'Lưu điều chỉnh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
