import { useEffect, useState, type FormEvent } from 'react'
import { adminCouponApi } from '../../../lib/api/adminCouponApi'
import { ApiError } from '../../../lib/api/apiClient'
import {
  DISPLAY_STATUSES,
  DISPLAY_STATUS_LABELS,
  defaultDateRange,
  formatDateTime,
  formatDiscount,
  formatVnd,
  isoToLocalInput,
  localInputToIso,
  type AdminCoupon,
  type CouponDisplayStatus,
  type DiscountType,
} from './adminCouponTypes'
import styles from '../Admin.module.css'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }

interface CouponForm {
  code: string
  discountType: DiscountType
  discountValue: string
  minOrderAmount: string
  maxDiscountAmount: string
  usageLimit: string
  startDate: string
  endDate: string
}

const CODE_PATTERN = /^[A-Z0-9_-]{3,50}$/

const BADGE_CLASS: Record<CouponDisplayStatus, string> = {
  ACTIVE: styles.badgeActive,
  SCHEDULED: styles.badgeShipping,
  EXHAUSTED: styles.badgePending,
  EXPIRED: styles.badgeInactive,
  DISABLED: styles.badgeHidden,
}

function emptyForm(): CouponForm {
  return {
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: '10',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    usageLimit: '100',
    ...defaultDateRange(),
  }
}

function formFromCoupon(c: AdminCoupon): CouponForm {
  return {
    code: c.code,
    discountType: c.discountType,
    discountValue: String(Number(c.discountValue)),
    minOrderAmount: String(Number(c.minOrderAmount)),
    maxDiscountAmount: c.maxDiscountAmount != null ? String(Number(c.maxDiscountAmount)) : '',
    usageLimit: String(c.usageLimit),
    startDate: isoToLocalInput(c.startDate),
    endDate: isoToLocalInput(c.endDate),
  }
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([])
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<CouponDisplayStatus | ''>('')

  const [toast, setToast] = useState('')
  const [pageError, setPageError] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)

  // Modal tạo / sửa dùng chung: editing = null → tạo mới
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCoupon | null>(null)
  const [form, setForm] = useState<CouponForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    adminCouponApi
      .list({ q: query, status: statusFilter || null }, controller.signal)
      .then(items => {
        setCoupons(items)
        setLoadState({ status: 'ready' })
      })
      .catch(err => {
        if (!controller.signal.aborted) setLoadState({ status: 'error', message: errorMessage(err) })
      })
    return () => controller.abort()
  }, [query, statusFilter, reloadKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const reload = () => {
    setLoadState({ status: 'loading' })
    setReloadKey(k => k + 1)
  }

  const handleToggleStatus = async (coupon: AdminCoupon) => {
    if (pendingId !== null) return
    setPendingId(coupon.id)
    setPageError('')
    try {
      const saved = await adminCouponApi.setActive(coupon.id, !coupon.active)
      setToast(saved.active ? `Đã kích hoạt lại mã ${saved.code}!` : `Đã dừng mã ${saved.code}!`)
      reload()
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setPendingId(null)
    }
  }

  // ---------------- Modal ----------------

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setFormError('')
    setFieldErrors({})
    setPageError('')
    setIsModalOpen(true)
  }

  const openEdit = (coupon: AdminCoupon) => {
    setEditing(coupon)
    setForm(formFromCoupon(coupon))
    setFormError('')
    setFieldErrors({})
    setPageError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setIsModalOpen(false)
  }

  // Coupon đã có lượt dùng: khóa code / loại / giá trị (server vẫn kiểm tra lại — ADR-022 mục 3)
  const lockedFields = editing !== null && editing.usedCount > 0
  const isPercent = form.discountType === 'PERCENTAGE'

  const setField = (field: keyof CouponForm) => (value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const validate = (): Record<string, string> => {
    const errors: Record<string, string> = {}
    const code = form.code.trim().toUpperCase()
    if (!CODE_PATTERN.test(code)) errors.code = 'Mã chỉ gồm A-Z, 0-9, dấu _ hoặc -, dài 3–50 ký tự'
    const value = Number(form.discountValue)
    if (form.discountValue.trim() === '' || !Number.isFinite(value) || value <= 0) {
      errors.discountValue = 'Giá trị giảm phải lớn hơn 0'
    } else if (isPercent && value > 100) {
      errors.discountValue = 'Giảm theo phần trăm không vượt quá 100%'
    }
    const minOrder = form.minOrderAmount.trim() === '' ? 0 : Number(form.minOrderAmount)
    if (!Number.isFinite(minOrder) || minOrder < 0) errors.minOrderAmount = 'Giá trị đơn tối thiểu không được âm'
    if (isPercent && form.maxDiscountAmount.trim() !== '') {
      const max = Number(form.maxDiscountAmount)
      if (!Number.isFinite(max) || max <= 0) errors.maxDiscountAmount = 'Mức giảm tối đa phải lớn hơn 0'
    }
    const limit = Number(form.usageLimit)
    if (!Number.isInteger(limit) || limit < 1) {
      errors.usageLimit = 'Giới hạn lượt dùng phải là số nguyên ≥ 1'
    } else if (editing && limit < editing.usedCount) {
      errors.usageLimit = `Không được nhỏ hơn số lượt đã dùng (${editing.usedCount})`
    }
    if (!form.startDate) errors.startDate = 'Vui lòng chọn ngày bắt đầu'
    if (!form.endDate) errors.endDate = 'Vui lòng chọn ngày kết thúc'
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu'
    }
    return errors
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const errors = validate()
    setFieldErrors(errors)
    setFormError('')
    if (Object.keys(errors).length > 0) return

    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderAmount: form.minOrderAmount.trim() === '' ? 0 : Number(form.minOrderAmount),
      maxDiscountAmount: isPercent && form.maxDiscountAmount.trim() !== '' ? Number(form.maxDiscountAmount) : null,
      usageLimit: Number(form.usageLimit),
      startDate: localInputToIso(form.startDate),
      endDate: localInputToIso(form.endDate),
    }
    setSubmitting(true)
    try {
      const saved = editing ? await adminCouponApi.update(editing.id, payload) : await adminCouponApi.create(payload)
      setToast(editing ? `Đã cập nhật mã ${saved.code}!` : `Đã phát hành mã ${saved.code} thành công!`)
      setIsModalOpen(false)
      reload()
    } catch (err) {
      if (err instanceof ApiError && err.errors) setFieldErrors(err.errors)
      setFormError(errorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const fieldError = (field: string) =>
    fieldErrors[field] ? <span className={styles.fieldError}>{fieldErrors[field]}</span> : null

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý mã khuyến mãi & Voucher (Coupons)</h1>
          <p>Phát hành mã giảm giá, giới hạn ngân sách chiết khấu và theo dõi số lượt áp dụng thực tế.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={openCreate}>
            + Tạo mã khuyến mãi mới
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
            placeholder="Tìm theo mã khuyến mãi..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as CouponDisplayStatus | '')}
            className={styles.selectInput}
            aria-label="Lọc theo trạng thái"
          >
            <option value="">Tất cả trạng thái</option>
            {DISPLAY_STATUSES.map(s => (
              <option key={s} value={s}>{DISPLAY_STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{coupons.length}</strong> mã khuyến mãi
        </div>
      </div>

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
              <th>Mã khuyến mãi</th>
              <th>Mức chiết khấu</th>
              <th>Đơn hàng tối thiểu</th>
              <th>Thời hạn áp dụng</th>
              <th>Lượt đã dùng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loadState.status === 'loading' && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Đang tải danh sách mã khuyến mãi...
                </td>
              </tr>
            )}
            {loadState.status === 'ready' && coupons.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Không có mã khuyến mãi phù hợp.
                </td>
              </tr>
            )}
            {loadState.status === 'ready' && coupons.map(cp => (
              <tr key={cp.id}>
                <td>
                  <strong style={{ letterSpacing: '1px', color: 'var(--ts-color-primary)', fontSize: '15px' }}>
                    {cp.code}
                  </strong>
                </td>
                <td>
                  <strong style={{ color: '#00a859' }}>{formatDiscount(cp)}</strong>
                </td>
                <td>{formatVnd(cp.minOrderAmount)}</td>
                <td>{formatDateTime(cp.startDate)} — {formatDateTime(cp.endDate)}</td>
                <td>
                  <strong>{cp.usedCount}</strong> / {cp.usageLimit} lượt
                </td>
                <td>
                  <span className={`${styles.badge} ${BADGE_CLASS[cp.displayStatus]}`}>
                    {DISPLAY_STATUS_LABELS[cp.displayStatus]}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button type="button" className={styles.actionBtn} onClick={() => openEdit(cp)}>
                      Sửa
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleToggleStatus(cp)}
                      disabled={pendingId !== null}
                    >
                      {pendingId === cp.id ? 'Đang lưu...' : cp.active ? 'Dừng mã' : 'Kích hoạt lại'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal tạo / sửa */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editing ? `Chỉnh sửa mã ${editing.code}` : 'Phát hành mã khuyến mãi mới'}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={closeModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.modalBody}>
                {formError && <div className={styles.errorNotice} role="alert">{formError}</div>}
                {lockedFields && (
                  <p className={styles.subText}>
                    Mã đã có {editing?.usedCount} lượt dùng nên không thể đổi mã, hình thức giảm và giá trị giảm.
                  </p>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="cp-code">Mã voucher (In hoa, không dấu cách) *</label>
                  <input
                    id="cp-code"
                    type="text"
                    required
                    maxLength={50}
                    placeholder="ví dụ: TECHSTORE20"
                    value={form.code}
                    disabled={lockedFields}
                    onChange={e => setField('code')(e.target.value.toUpperCase())}
                    aria-invalid={fieldErrors.code ? true : undefined}
                  />
                  {fieldError('code')}
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-type">Hình thức giảm *</label>
                    <select
                      id="cp-type"
                      value={form.discountType}
                      disabled={lockedFields}
                      onChange={e => setField('discountType')(e.target.value)}
                    >
                      <option value="PERCENTAGE">Giảm theo tỷ lệ phần trăm (%)</option>
                      <option value="FIXED_AMOUNT">Giảm số tiền cố định (VND)</option>
                    </select>
                    {fieldError('discountType')}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-val">Giá trị giảm {isPercent ? '(%)' : '(VND)'} *</label>
                    <input
                      id="cp-val"
                      type="number"
                      required
                      min={0}
                      max={isPercent ? 100 : undefined}
                      step={isPercent ? '0.01' : '1000'}
                      value={form.discountValue}
                      disabled={lockedFields}
                      onChange={e => setField('discountValue')(e.target.value)}
                      aria-invalid={fieldErrors.discountValue ? true : undefined}
                    />
                    {fieldError('discountValue')}
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-min">Giá trị đơn tối thiểu (VND)</label>
                    <input
                      id="cp-min"
                      type="number"
                      min={0}
                      step="1000"
                      value={form.minOrderAmount}
                      onChange={e => setField('minOrderAmount')(e.target.value)}
                      aria-invalid={fieldErrors.minOrderAmount ? true : undefined}
                    />
                    {fieldError('minOrderAmount')}
                  </div>
                  {isPercent ? (
                    <div className={styles.formGroup}>
                      <label htmlFor="cp-maxdisc">Giảm tối đa (VND, bỏ trống = không giới hạn)</label>
                      <input
                        id="cp-maxdisc"
                        type="number"
                        min={0}
                        step="1000"
                        value={form.maxDiscountAmount}
                        onChange={e => setField('maxDiscountAmount')(e.target.value)}
                        aria-invalid={fieldErrors.maxDiscountAmount ? true : undefined}
                      />
                      {fieldError('maxDiscountAmount')}
                    </div>
                  ) : (
                    <div className={styles.formGroup} />
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cp-max">Giới hạn số lượt dùng *</label>
                  <input
                    id="cp-max"
                    type="number"
                    min={editing ? Math.max(1, editing.usedCount) : 1}
                    step="1"
                    value={form.usageLimit}
                    onChange={e => setField('usageLimit')(e.target.value)}
                    aria-invalid={fieldErrors.usageLimit ? true : undefined}
                  />
                  {fieldError('usageLimit')}
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-start">Ngày bắt đầu *</label>
                    <input
                      id="cp-start"
                      type="datetime-local"
                      required
                      value={form.startDate}
                      onChange={e => setField('startDate')(e.target.value)}
                      aria-invalid={fieldErrors.startDate ? true : undefined}
                    />
                    {fieldError('startDate')}
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-exp">Ngày hết hạn *</label>
                    <input
                      id="cp-exp"
                      type="datetime-local"
                      required
                      value={form.endDate}
                      onChange={e => setField('endDate')(e.target.value)}
                      aria-invalid={fieldErrors.endDate ? true : undefined}
                    />
                    {fieldError('endDate')}
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={closeModal} disabled={submitting}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn} disabled={submitting}>
                  {submitting ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Phát hành mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
