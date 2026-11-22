import { useEffect, useState, type FormEvent } from 'react'
import { adminBranchApi } from '../../../lib/api/adminBranchApi'
import { ApiError } from '../../../lib/api/apiClient'
import { PHONE_PATTERN, extractCity, type AdminBranch, type BranchStatus } from './adminBranchTypes'
import styles from '../Admin.module.css'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }

interface FormState {
  name: string
  phone: string
  address: string
}

const emptyForm: FormState = { name: '', phone: '', address: '' }

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

export function AdminBranchesPage() {
  const [branches, setBranches] = useState<AdminBranch[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [pendingStatusId, setPendingStatusId] = useState<number | null>(null)

  const [toast, setToast] = useState('')
  const [pageError, setPageError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    adminBranchApi.listBranches(controller.signal)
      .then(list => {
        setBranches(list)
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

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFieldErrors({})
    setFormError('')
    setPageError('')
    setIsModalOpen(true)
  }

  const openEdit = (branch: AdminBranch) => {
    setEditingId(branch.id)
    setForm({ name: branch.name, phone: branch.phone ?? '', address: branch.address })
    setFieldErrors({})
    setFormError('')
    setPageError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setIsModalOpen(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const name = form.name.trim()
    const phone = form.phone.trim()
    const address = form.address.trim()
    const errors: Record<string, string> = {}
    if (!name) errors.name = 'Tên chi nhánh không được để trống'
    if (!address) errors.address = 'Địa chỉ chi nhánh không được để trống'
    if (phone && !PHONE_PATTERN.test(phone)) {
      errors.phone = 'Số điện thoại chỉ gồm số, khoảng trắng, + ( ) . - và dài 8-20 ký tự'
    }
    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    const payload = { name, phone: phone || null, address }
    setSubmitting(true)
    try {
      const saved = editingId !== null
        ? await adminBranchApi.updateBranch(editingId, payload)
        : await adminBranchApi.createBranch(payload)
      setBranches(prev => (editingId !== null ? prev.map(b => (b.id === saved.id ? saved : b)) : [...prev, saved]))
      setIsModalOpen(false)
      setToast(editingId !== null ? 'Đã cập nhật chi nhánh!' : 'Đã thêm chi nhánh mới!')
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.errors)
      setFormError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (branch: AdminBranch) => {
    if (pendingStatusId !== null) return
    const nextStatus: BranchStatus = branch.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    setPendingStatusId(branch.id)
    setPageError('')
    try {
      const saved = await adminBranchApi.updateStatus(branch.id, nextStatus)
      setBranches(prev => prev.map(b => (b.id === saved.id ? saved : b)))
      setToast('Đã cập nhật trạng thái chi nhánh!')
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
          <h1>Quản lý chi nhánh cửa hàng (Branches)</h1>
          <p>Mạng lưới showroom trải nghiệm công nghệ, thông tin liên hệ và trạng thái mở cửa của từng cơ sở.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={openCreate} disabled={!isReady}>
            + Thêm chi nhánh
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice} role="status">{toast}</div>}
      {pageError && <div className={styles.errorNotice} role="alert">{pageError}</div>}

      {loadState.status === 'error' && (
        <div className={styles.errorNotice} role="alert">
          {loadState.message}{' '}
          <button type="button" className={styles.actionBtn} onClick={reload}>Thử lại</button>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Tên chi nhánh</th>
              <th>Địa chỉ showroom</th>
              <th>Tỉnh / Thành phố</th>
              <th>Hotline</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadState.status === 'loading' && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Đang tải danh sách chi nhánh...
                </td>
              </tr>
            )}
            {isReady && branches.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Chưa có chi nhánh nào.
                </td>
              </tr>
            )}
            {isReady && branches.map(b => (
              <tr key={b.id}>
                <td>
                  <strong style={{ fontSize: '14px', color: 'var(--ts-color-primary)' }}>{b.name}</strong>
                </td>
                <td>{b.address}</td>
                <td>{extractCity(b.address)}</td>
                <td>{b.phone ? <code>{b.phone}</code> : '—'}</td>
                <td>
                  <span className={`${styles.badge} ${b.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                    {b.status === 'ACTIVE' ? 'Đang mở cửa' : 'Tạm dừng hoạt động'}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button type="button" className={styles.actionBtn} onClick={() => openEdit(b)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleToggleStatus(b)}
                      disabled={pendingStatusId === b.id}
                    >
                      {b.status === 'ACTIVE' ? 'Tạm đóng cửa' : 'Mở lại'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div
            className={styles.modalWindow}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="branch-modal-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="branch-modal-title">{editingId !== null ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh mới'}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={closeModal} aria-label="Đóng">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorNotice} role="alert">{formError}</div>}

                <div className={styles.formGroup}>
                  <label htmlFor="branch-name">Tên chi nhánh *</label>
                  <input
                    id="branch-name"
                    type="text"
                    required
                    maxLength={150}
                    placeholder="ví dụ: Chi nhánh Quận 1"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    aria-invalid={fieldErrors.name ? true : undefined}
                  />
                  {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="branch-phone">Hotline</label>
                  <input
                    id="branch-phone"
                    type="tel"
                    maxLength={20}
                    placeholder="ví dụ: (028) 1234 5678"
                    value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    aria-invalid={fieldErrors.phone ? true : undefined}
                  />
                  {fieldErrors.phone && <span className={styles.fieldError}>{fieldErrors.phone}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="branch-address">Địa chỉ showroom *</label>
                  <input
                    id="branch-address"
                    type="text"
                    required
                    maxLength={255}
                    placeholder="Số nhà, đường, phường/quận, Tỉnh/Thành phố"
                    value={form.address}
                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                    aria-invalid={fieldErrors.address ? true : undefined}
                  />
                  {fieldErrors.address && <span className={styles.fieldError}>{fieldErrors.address}</span>}
                  <span className={styles.subText}>
                    Tỉnh / Thành phố hiển thị: <strong>{extractCity(form.address)}</strong> (phần sau dấu phẩy cuối)
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={closeModal} disabled={submitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu chi nhánh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
