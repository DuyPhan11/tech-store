import { useCallback, useEffect, useState } from 'react'
import { adminReviewApi } from '../../../lib/api/adminReviewApi'
import type { AdminReviewResponse, AdminReviewStatus } from './adminReviewTypes'
import styles from '../Admin.module.css'

type StatusTab = 'ALL' | AdminReviewStatus

function formatDateTime(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusTab>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [toast, setToast] = useState('')

  const [hidingReview, setHidingReview] = useState<AdminReviewResponse | null>(null)
  const [hideReason, setHideReason] = useState('')
  const [submittingHide, setSubmittingHide] = useState(false)
  const [modalError, setModalError] = useState('')

  const loadReviews = useCallback(async (status: StatusTab, q: string) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await adminReviewApi.listReviews(status, q)
      setReviews(data)
    } catch (err: unknown) {
      setErrorMsg((err as Error)?.message || 'Không thể tải danh sách đánh giá.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReviews(statusFilter, searchQuery)
  }, [statusFilter, loadReviews])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void loadReviews(statusFilter, searchQuery)
  }

  const openHideModal = (review: AdminReviewResponse) => {
    setHidingReview(review)
    setHideReason('')
    setModalError('')
  }

  const handleConfirmHide = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hidingReview) return
    const trimmed = hideReason.trim()
    if (!trimmed) {
      setModalError('Vui lòng nhập lý do ẩn đánh giá vi phạm.')
      return
    }
    setSubmittingHide(true)
    setModalError('')
    try {
      const updated = await adminReviewApi.hideReview(hidingReview.id, trimmed)
      setReviews(prev =>
        statusFilter === 'ALL'
          ? prev.map(r => (r.id === updated.id ? updated : r))
          : prev.filter(r => r.id !== updated.id)
      )
      setHidingReview(null)
      setToast(`Đã ẩn đánh giá #${updated.id} (HIDDEN_BY_ADMIN) và ghi nhật ký kiểm duyệt.`)
      setTimeout(() => setToast(''), 4000)
    } catch (err: unknown) {
      setModalError((err as Error)?.message || 'Không thể ẩn đánh giá.')
    } finally {
      setSubmittingHide(false)
    }
  }

  const statusBadge = (status: AdminReviewStatus) => {
    if (status === 'VISIBLE') {
      return <span className={`${styles.badge} ${styles.badgeApproved}`}>Đang hiển thị (VISIBLE)</span>
    }
    if (status === 'HIDDEN_BY_OWNER') {
      return <span className={`${styles.badge} ${styles.badgePending}`}>Khách tự ẩn (HIDDEN_BY_OWNER)</span>
    }
    return <span className={`${styles.badge} ${styles.badgeHidden}`}>Admin đã ẩn (HIDDEN_BY_ADMIN)</span>
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Kiểm duyệt đánh giá khách hàng (Reviews)</h1>
          <p>Xem đánh giá sản phẩm và ẩn mềm các đánh giá vi phạm quy chuẩn cộng đồng (giữ lịch sử & audit log).</p>
        </div>
      </div>

      {toast && <div className={styles.toastNotice} role="status">{toast}</div>}
      {errorMsg && <div className={styles.toastNotice} style={{ background: '#fef2f2', color: '#991b1b', borderColor: '#fecaca' }} role="alert">{errorMsg}</div>}

      {/* Filter Tabs */}
      <div className={styles.statusTabs}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'VISIBLE', label: 'Đang hiển thị' },
          { key: 'HIDDEN_BY_OWNER', label: 'Khách tự ẩn' },
          { key: 'HIDDEN_BY_ADMIN', label: 'Admin đã ẩn' },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.statusTabBtn} ${statusFilter === tab.key ? styles.activeStatusTab : ''}`}
            onClick={() => setStatusFilter(tab.key as StatusTab)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Tìm theo tên sản phẩm, khách hàng, email hoặc nội dung bình luận..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Tìm kiếm đánh giá"
        />
        <button type="submit" className={styles.actionBtn}>
          Tìm kiếm
        </button>
      </form>

      {/* Table */}
      <div className={styles.tableWrapper}>
        {loading ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Đang tải danh sách đánh giá...</p>
        ) : reviews.length === 0 ? (
          <p style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Không có đánh giá nào phù hợp.</p>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Sản phẩm</th>
                <th>Khách hàng</th>
                <th>Số sao</th>
                <th>Nội dung bình luận</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td style={{ fontWeight: 600 }}>
                    {r.productName}
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>Đơn #{r.orderCode}</div>
                  </td>
                  <td>
                    <strong>{r.customerName}</strong>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{r.customerEmail}</div>
                  </td>
                  <td>
                    <span style={{ color: '#f59e0b', fontSize: '15px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </span>
                  </td>
                  <td style={{ maxWidth: '320px', lineHeight: '1.4' }}>
                    <div>{r.comment}</div>
                    {r.hiddenReason && (
                      <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                        Lý do ẩn: {r.hiddenReason}
                      </div>
                    )}
                  </td>
                  <td>{formatDateTime(r.createdAt)}</td>
                  <td>{statusBadge(r.status)}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      {r.status === 'VISIBLE' ? (
                        <button
                          type="button"
                          className={styles.actionBtnDanger}
                          onClick={() => openHideModal(r)}
                        >
                          Ẩn vi phạm
                        </button>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>Đã ẩn</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal ẩn đánh giá vi phạm */}
      {hidingReview && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="hide-review-title">
          <div className={styles.modalWindow}>
            <div className={styles.modalHeader}>
              <h2 id="hide-review-title">Ẩn đánh giá vi phạm #{hidingReview.id}</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setHidingReview(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleConfirmHide}>
              <div className={styles.modalBody}>
                <p style={{ marginTop: 0, fontSize: '13px', color: '#374151' }}>
                  Sản phẩm: <strong>{hidingReview.productName}</strong> — Khách hàng: <strong>{hidingReview.customerName}</strong>
                </p>
                <p style={{ fontSize: '13px', color: '#4b5563', background: '#f9fafb', padding: '10px', borderRadius: '4px' }}>
                  "{hidingReview.comment}"
                </p>
                {modalError && (
                  <p style={{ color: '#991b1b', fontSize: '13px', margin: '8px 0' }} role="alert">
                    {modalError}
                  </p>
                )}
                <div className={styles.formGroup}>
                  <label htmlFor="admin-hide-reason">Lý do ẩn vi phạm *</label>
                  <textarea
                    id="admin-hide-reason"
                    value={hideReason}
                    onChange={e => setHideReason(e.target.value)}
                    placeholder="Nhập lý do vi phạm (VD: Ngôn từ thô tục, spam quảng cáo...)"
                    maxLength={255}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => setHidingReview(null)}
                  disabled={submittingHide}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={styles.actionBtnDanger}
                  disabled={submittingHide || !hideReason.trim()}
                >
                  {submittingHide ? 'Đang xử lý...' : 'Xác nhận ẩn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
