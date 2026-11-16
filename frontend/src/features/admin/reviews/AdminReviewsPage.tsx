import { useState } from 'react'
import { initialReviews, type AdminReviewItem } from '../adminData'
import styles from '../Admin.module.css'

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>(initialReviews)
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminReviewItem['status']>('ALL')
  const [toast, setToast] = useState('')

  const filteredReviews = reviews.filter(r => statusFilter === 'ALL' || r.status === statusFilter)

  const handleUpdateStatus = (id: string, status: AdminReviewItem['status']) => {
    setReviews(prev =>
      prev.map(r => (r.id === id ? { ...r, status } : r))
    )
    setToast(status === 'APPROVED' ? 'Đã duyệt hiển thị đánh giá!' : 'Đã ẩn đánh giá vi phạm quy chuẩn cộng đồng!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Kiểm duyệt đánh giá khách hàng (Reviews)</h1>
          <p>Kiểm duyệt nội dung phản hồi, chấm điểm sao từ khách hàng trước khi hiển thị công khai trên website.</p>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Filter Tabs */}
      <div className={styles.statusTabs}>
        {[
          { key: 'ALL', label: `Tất cả (${reviews.length})` },
          { key: 'APPROVED', label: `Đã duyệt (${reviews.filter(r => r.status === 'APPROVED').length})` },
          { key: 'PENDING', label: `Chờ duyệt (${reviews.filter(r => r.status === 'PENDING').length})` },
          { key: 'HIDDEN_BY_ADMIN', label: `Đã ẩn vi phạm (${reviews.filter(r => r.status === 'HIDDEN_BY_ADMIN').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.statusTabBtn} ${statusFilter === tab.key ? styles.activeStatusTab : ''}`}
            onClick={() => setStatusFilter(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Sản phẩm được đánh giá</th>
              <th>Khách hàng</th>
              <th>Số sao</th>
              <th>Nội dung bình luận</th>
              <th>Ngày gửi</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredReviews.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 600 }}>{r.productName}</td>
                <td><strong>{r.customerName}</strong></td>
                <td>
                  <span style={{ color: '#f59e0b', fontSize: '15px' }}>
                    {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                  </span>
                </td>
                <td style={{ maxWidth: '320px', lineHeight: '1.4' }}>{r.comment}</td>
                <td>{r.date}</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      r.status === 'APPROVED'
                        ? styles.badgeApproved
                        : r.status === 'PENDING'
                        ? styles.badgePending
                        : styles.badgeHidden
                    }`}
                  >
                    {r.status === 'APPROVED'
                      ? 'Đã duyệt'
                      : r.status === 'PENDING'
                      ? 'Chờ duyệt'
                      : 'Đã ẩn vi phạm'}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    {r.status !== 'APPROVED' && (
                      <button
                        type="button"
                        className={styles.actionBtn}
                        style={{ color: '#00a859', borderColor: '#00a859' }}
                        onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                      >
                        Duyệt
                      </button>
                    )}
                    {r.status !== 'HIDDEN_BY_ADMIN' && (
                      <button
                        type="button"
                        className={styles.actionBtnDanger}
                        onClick={() => handleUpdateStatus(r.id, 'HIDDEN_BY_ADMIN')}
                      >
                        Ẩn vi phạm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
