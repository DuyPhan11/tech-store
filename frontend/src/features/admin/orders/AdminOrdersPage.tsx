import { useEffect, useState, type FormEvent } from 'react'
import { adminOrderApi } from '../../../lib/api/adminOrderApi'
import { ApiError } from '../../../lib/api/apiClient'
import {
  CANCEL_REASON_MAX,
  DEFAULT_PAGE_SIZE,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  formatDateTime,
  nextActions,
  type AdminOrder,
  type OrderStatus,
  type StatusCounts,
} from './adminOrderTypes'
import styles from '../Admin.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready' }
type TabKey = 'ALL' | OrderStatus

const EMPTY_COUNTS: StatusCounts = { ALL: 0, PENDING: 0, CONFIRMED: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0 }

const TABS: { key: TabKey; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Đã xác nhận' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'COMPLETED', label: 'Đã hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
]

const STEP_BUTTONS: Record<'CONFIRMED' | 'SHIPPING' | 'COMPLETED', { label: string; color: string; toast: string }> = {
  CONFIRMED: { label: 'Xác nhận', color: '#00a859', toast: 'Đã duyệt và xác nhận đơn hàng thành công!' },
  SHIPPING: { label: 'Xuất kho & Giao', color: '#0156ff', toast: 'Đã chuyển đơn hàng sang trạng thái đang giao hàng!' },
  COMPLETED: { label: 'Đã giao xong', color: '#00a859', toast: 'Đơn hàng đã được đánh dấu hoàn thành!' },
}

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.'
}

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [counts, setCounts] = useState<StatusCounts>(EMPTY_COUNTS)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  const [activeTab, setActiveTab] = useState<TabKey>('ALL')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const [toast, setToast] = useState('')
  const [pageError, setPageError] = useState('')
  const [pendingId, setPendingId] = useState<number | null>(null)

  // Modal chi tiết (tải chi tiết qua API)
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const [detailError, setDetailError] = useState('')

  // Modal lý do hủy
  const [cancelTarget, setCancelTarget] = useState<AdminOrder | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim())
      setPage(0)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const controller = new AbortController()
    adminOrderApi
      .list({ status: activeTab === 'ALL' ? null : activeTab, q: query, page, size: DEFAULT_PAGE_SIZE }, controller.signal)
      .then(result => {
        setOrders(result.items)
        setCounts(result.counts)
        setTotalElements(result.totalElements)
        setTotalPages(result.totalPages)
        setLoadState({ status: 'ready' })
        // Trang hiện tại trống sau khi đơn đổi trạng thái → lùi về trang cuối còn dữ liệu
        if (result.items.length === 0 && page > 0 && result.totalPages > 0) setPage(result.totalPages - 1)
      })
      .catch(err => {
        if (!controller.signal.aborted) setLoadState({ status: 'error', message: errorMessage(err) })
      })
    return () => controller.abort()
  }, [activeTab, query, page, reloadKey])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  const reload = () => {
    setLoadState({ status: 'loading' })
    setReloadKey(k => k + 1)
  }

  const changeTab = (key: TabKey) => {
    setActiveTab(key)
    setPage(0)
  }

  const refreshDetail = (saved: AdminOrder) => {
    if (selectedOrder && selectedOrder.id === saved.id) setSelectedOrder(saved)
  }

  const handleStep = async (order: AdminOrder, target: 'CONFIRMED' | 'SHIPPING' | 'COMPLETED') => {
    if (pendingId !== null) return
    setPendingId(order.id)
    setPageError('')
    try {
      const saved = await adminOrderApi.updateStatus(order.id, target)
      refreshDetail(saved)
      setToast(STEP_BUTTONS[target].toast)
    } catch (err) {
      setPageError(errorMessage(err))
    } finally {
      setPendingId(null)
      reload()
    }
  }

  const openDetail = async (order: AdminOrder) => {
    setSelectedOrder(order)
    setDetailError('')
    try {
      setSelectedOrder(await adminOrderApi.get(order.id))
    } catch (err) {
      setDetailError(errorMessage(err))
    }
  }

  const openCancel = (order: AdminOrder) => {
    setCancelTarget(order)
    setCancelReason('')
    setCancelError('')
    setPageError('')
  }

  const closeCancel = () => {
    if (cancelling) return
    setCancelTarget(null)
  }

  const handleCancel = async (e: FormEvent) => {
    e.preventDefault()
    if (!cancelTarget || cancelling) return
    const reason = cancelReason.trim()
    if (!reason) {
      setCancelError('Vui lòng nhập lý do hủy đơn')
      return
    }
    if (reason.length > CANCEL_REASON_MAX) {
      setCancelError(`Lý do tối đa ${CANCEL_REASON_MAX} ký tự`)
      return
    }
    setCancelling(true)
    setCancelError('')
    try {
      const saved = await adminOrderApi.updateStatus(cancelTarget.id, 'CANCELLED', reason)
      refreshDetail(saved)
      setToast(`Đơn hàng #${saved.orderCode} đã bị hủy. ${reason}`)
      setCancelTarget(null)
      reload()
    } catch (err) {
      setCancelError(errorMessage(err))
      if (err instanceof ApiError && err.status === 409) reload()
    } finally {
      setCancelling(false)
    }
  }

  const getStatusBadge = (status: OrderStatus) => {
    const cls = {
      PENDING: styles.badgePending,
      CONFIRMED: styles.badgeConfirmed,
      SHIPPING: styles.badgeShipping,
      COMPLETED: styles.badgeCompleted,
      CANCELLED: styles.badgeCancelled,
    }[status]
    return <span className={`${styles.badge} ${cls}`}>{ORDER_STATUS_LABELS[status]}</span>
  }

  const renderActions = (ord: AdminOrder) => {
    const { next, canCancel } = nextActions(ord.status)
    const busy = pendingId !== null
    return (
      <div className={styles.actionGroup}>
        {next && next !== 'CANCELLED' && next !== 'PENDING' && (
          <button
            type="button"
            className={styles.actionBtn}
            style={{ color: STEP_BUTTONS[next].color, borderColor: STEP_BUTTONS[next].color }}
            onClick={() => handleStep(ord, next)}
            disabled={busy}
          >
            {pendingId === ord.id ? 'Đang lưu...' : STEP_BUTTONS[next].label}
          </button>
        )}
        {canCancel && (
          <button type="button" className={styles.actionBtnDanger} onClick={() => openCancel(ord)} disabled={busy}>
            Hủy
          </button>
        )}
        <button type="button" className={styles.actionBtn} onClick={() => openDetail(ord)}>
          Chi tiết
        </button>
      </div>
    )
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý đơn hàng (Orders)</h1>
          <p>Xem toàn bộ đơn hàng khách đặt, duyệt đơn, bàn giao vận chuyển và cập nhật trạng thái thanh toán.</p>
        </div>
      </div>

      {toast && <div className={styles.toastNotice} role="status">{toast}</div>}
      {pageError && <div className={styles.errorNotice} role="alert">{pageError}</div>}

      {/* Status Filter Tabs */}
      <div className={styles.statusTabs}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.statusTabBtn} ${activeTab === tab.key ? styles.activeStatusTab : ''}`}
            onClick={() => changeTab(tab.key)}
          >
            {tab.label} ({counts[tab.key] ?? 0})
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="Tìm theo mã đơn (ORD-...), tên khách hàng hoặc SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
            style={{ minWidth: '320px' }}
          />
          {search && (
            <button type="button" className={styles.actionBtn} onClick={() => setSearch('')}>
              Xóa tìm kiếm
            </button>
          )}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{orders.length}</strong> / {totalElements} đơn hàng
        </div>
      </div>

      {loadState.status === 'error' && (
        <div className={styles.errorNotice} role="alert">
          {loadState.message}{' '}
          <button type="button" className={styles.actionBtn} onClick={reload}>Thử lại</button>
        </div>
      )}

      {/* Orders Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Phương thức</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thao tác xử lý</th>
            </tr>
          </thead>
          <tbody>
            {loadState.status === 'loading' && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Đang tải danh sách đơn hàng...
                </td>
              </tr>
            )}
            {loadState.status === 'ready' && orders.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Không tìm thấy đơn hàng nào trong mục này.
                </td>
              </tr>
            )}
            {loadState.status === 'ready' && orders.map(ord => (
              <tr key={ord.id}>
                <td><strong>#{ord.orderCode}</strong></td>
                <td>
                  <div>
                    <span style={{ fontWeight: 600 }}>{ord.recipientName}</span>
                    <br />
                    <small style={{ color: 'var(--ts-color-muted)' }}>{ord.recipientPhone}</small>
                  </div>
                </td>
                <td>{formatDateTime(ord.createdAt)}</td>
                <td>
                  <span style={{ fontSize: '12px' }}>
                    {ord.paymentMethod === 'COD' ? 'Tiền mặt khi nhận (COD)' : 'Chuyển khoản (Online Mock)'}
                  </span>
                </td>
                <td><strong>{currency.format(ord.finalAmount)}</strong></td>
                <td>{getStatusBadge(ord.status)}</td>
                <td>{renderActions(ord)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.toolbarCard} style={{ justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loadState.status === 'loading'}
          >
            ‹ Trước
          </button>
          <span style={{ fontSize: '13px' }}>
            Trang <strong>{page + 1}</strong> / {totalPages}
          </span>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loadState.status === 'loading'}
          >
            Sau ›
          </button>
        </div>
      )}

      {/* Modal View Order Details */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết đơn hàng #{selectedOrder.orderCode}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              {detailError && <div className={styles.errorNotice} role="alert">{detailError}</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>Thời gian đặt hàng:</span>
                  <div style={{ fontWeight: 600 }}>{formatDateTime(selectedOrder.createdAt)}</div>
                </div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div style={{ background: '#f5f7ff', padding: '12px 16px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Thông tin người nhận:</div>
                <div style={{ fontSize: '13px' }}><strong>Người nhận:</strong> {selectedOrder.recipientName} ({selectedOrder.recipientPhone})</div>
                <div style={{ fontSize: '13px' }}><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</div>
                {selectedOrder.customer && (
                  <div style={{ fontSize: '13px' }}>
                    <strong>Tài khoản đặt:</strong> {selectedOrder.customer.fullName} — {selectedOrder.customer.email}
                  </div>
                )}
                {selectedOrder.branchName && (
                  <div style={{ fontSize: '13px' }}><strong>Chi nhánh xử lý:</strong> {selectedOrder.branchName}</div>
                )}
                <div style={{ fontSize: '13px' }}>
                  <strong>Thanh toán:</strong>{' '}
                  {selectedOrder.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản trực tuyến'}
                  {' — '}{PAYMENT_STATUS_LABELS[selectedOrder.paymentStatus] ?? selectedOrder.paymentStatus}
                  {selectedOrder.payment?.paidAt && ` (lúc ${formatDateTime(selectedOrder.payment.paidAt)})`}
                  {selectedOrder.payment?.refundedAt && ` (hoàn lúc ${formatDateTime(selectedOrder.payment.refundedAt)})`}
                </div>
                {selectedOrder.notes && <div style={{ fontSize: '13px' }}><strong>Ghi chú:</strong> {selectedOrder.notes}</div>}
                {selectedOrder.cancelReason && (
                  <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                    <strong>Lý do hủy:</strong> {selectedOrder.cancelReason}
                    {selectedOrder.cancelledAt && ` (${formatDateTime(selectedOrder.cancelledAt)})`}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>Danh sách sản phẩm đặt mua:</div>
                <div style={{ border: '1px solid var(--ts-color-border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <table className={styles.dataTable}>
                    <thead>
                      <tr>
                        <th>Sản phẩm</th>
                        <th>SL</th>
                        <th>Đơn giá</th>
                        <th>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 600 }}>
                            {item.productName}
                            <span className={styles.subText}>{item.productSku}</span>
                          </td>
                          <td>{item.quantity}</td>
                          <td>{currency.format(item.unitPrice)}</td>
                          <td><strong>{currency.format(item.subtotalAmount)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedOrder.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '14px' }}>
                  <span>Giảm giá:</span>
                  <strong>−{currency.format(selectedOrder.discountAmount)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '16px' }}>
                <span>Tổng cộng:</span>
                <strong style={{ color: 'var(--ts-color-primary)', fontSize: '18px' }}>
                  {currency.format(selectedOrder.finalAmount)}
                </strong>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.actionBtn} onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal lý do hủy */}
      {cancelTarget && (
        <div className={styles.modalOverlay} onClick={closeCancel}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Hủy đơn hàng #{cancelTarget.orderCode}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={closeCancel}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCancel} noValidate>
              <div className={styles.modalBody}>
                {cancelError && <div className={styles.errorNotice} role="alert">{cancelError}</div>}
                <p className={styles.subText}>
                  Hủy đơn sẽ hoàn lại tồn kho về chi nhánh {cancelTarget.branchName ?? 'gốc'} và cập nhật thanh toán
                  ({cancelTarget.paymentMethod === 'COD' ? 'hủy thu COD' : 'hoàn tiền'}).
                </p>
                <div className={styles.formGroup}>
                  <label htmlFor="cancel-reason">Lý do hủy đơn *</label>
                  <textarea
                    id="cancel-reason"
                    rows={4}
                    maxLength={CANCEL_REASON_MAX}
                    placeholder="Ví dụ: Khách gọi điện yêu cầu hủy, không đủ hàng giao..."
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    aria-invalid={cancelError ? true : undefined}
                  />
                  <span className={styles.subText}>{cancelReason.length}/{CANCEL_REASON_MAX} ký tự</span>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={closeCancel} disabled={cancelling}>
                  Quay lại
                </button>
                <button type="submit" className={styles.actionBtnDanger} disabled={cancelling}>
                  {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
