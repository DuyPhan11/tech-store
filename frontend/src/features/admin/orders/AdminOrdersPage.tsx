import { useState } from 'react'
import { initialOrders, type AdminOrderItem } from '../adminData'
import styles from '../Admin.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderItem[]>(initialOrders)
  const [activeTab, setActiveTab] = useState<'ALL' | AdminOrderItem['status']>('ALL')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderItem | null>(null)
  const [toast, setToast] = useState('')

  const filteredOrders = orders.filter(ord => {
    const matchTab = activeTab === 'ALL' || ord.status === activeTab
    const matchSearch =
      ord.code.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(search.toLowerCase()) ||
      ord.customerPhone.includes(search)
    return matchTab && matchSearch
  })

  const updateOrderStatus = (orderId: string, nextStatus: AdminOrderItem['status'], reason = '') => {
    setOrders(prev =>
      prev.map(ord => {
        if (ord.id === orderId) {
          return { ...ord, status: nextStatus }
        }
        return ord
      })
    )
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => (prev ? { ...prev, status: nextStatus } : null))
    }
    const msg =
      nextStatus === 'CONFIRMED'
        ? 'Đã duyệt và xác nhận đơn hàng thành công!'
        : nextStatus === 'SHIPPING'
        ? 'Đã chuyển đơn hàng sang trạng thái đang giao hàng!'
        : nextStatus === 'COMPLETED'
        ? 'Đơn hàng đã được đánh dấu hoàn thành!'
        : `Đơn hàng đã bị hủy. ${reason}`
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const getStatusBadge = (status: AdminOrderItem['status']) => {
    switch (status) {
      case 'PENDING':
        return <span className={`${styles.badge} ${styles.badgePending}`}>Chờ xác nhận</span>
      case 'CONFIRMED':
        return <span className={`${styles.badge} ${styles.badgeConfirmed}`}>Đã xác nhận</span>
      case 'SHIPPING':
        return <span className={`${styles.badge} ${styles.badgeShipping}`}>Đang giao hàng</span>
      case 'COMPLETED':
        return <span className={`${styles.badge} ${styles.badgeCompleted}`}>Đã hoàn thành</span>
      case 'CANCELLED':
        return <span className={`${styles.badge} ${styles.badgeCancelled}`}>Đã hủy</span>
    }
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

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Status Filter Tabs */}
      <div className={styles.statusTabs}>
        {[
          { key: 'ALL', label: `Tất cả (${orders.length})` },
          { key: 'PENDING', label: `Chờ xác nhận (${orders.filter(o => o.status === 'PENDING').length})` },
          { key: 'CONFIRMED', label: `Đã xác nhận (${orders.filter(o => o.status === 'CONFIRMED').length})` },
          { key: 'SHIPPING', label: `Đang giao (${orders.filter(o => o.status === 'SHIPPING').length})` },
          { key: 'COMPLETED', label: `Đã hoàn thành (${orders.filter(o => o.status === 'COMPLETED').length})` },
          { key: 'CANCELLED', label: `Đã hủy (${orders.filter(o => o.status === 'CANCELLED').length})` },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.statusTabBtn} ${activeTab === tab.key ? styles.activeStatusTab : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="Tìm theo mã đơn (#TS-...), tên khách hàng hoặc SĐT..."
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
          Hiển thị <strong>{filteredOrders.length}</strong> đơn hàng
        </div>
      </div>

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
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Không tìm thấy đơn hàng nào trong mục này.
                </td>
              </tr>
            ) : (
              filteredOrders.map(ord => (
                <tr key={ord.id}>
                  <td><strong>#{ord.code}</strong></td>
                  <td>
                    <div>
                      <span style={{ fontWeight: 600 }}>{ord.customerName}</span>
                      <br />
                      <small style={{ color: 'var(--ts-color-muted)' }}>{ord.customerPhone}</small>
                    </div>
                  </td>
                  <td>{ord.date}</td>
                  <td>
                    <span style={{ fontSize: '12px' }}>
                      {ord.paymentMethod === 'COD' ? 'Tiền mặt khi nhận (COD)' : 'Chuyển khoản (Online Mock)'}
                    </span>
                  </td>
                  <td><strong>{currency.format(ord.totalVnd)}</strong></td>
                  <td>{getStatusBadge(ord.status)}</td>
                  <td>
                    <div className={styles.actionGroup}>
                      {ord.status === 'PENDING' && (
                        <>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ color: '#00a859', borderColor: '#00a859' }}
                            onClick={() => updateOrderStatus(ord.id, 'CONFIRMED')}
                          >
                            Xác nhận
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtnDanger}
                            onClick={() => updateOrderStatus(ord.id, 'CANCELLED', 'Khách hủy qua điện thoại')}
                          >
                            Hủy
                          </button>
                        </>
                      )}

                      {ord.status === 'CONFIRMED' && (
                        <>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ color: '#0156ff', borderColor: '#0156ff' }}
                            onClick={() => updateOrderStatus(ord.id, 'SHIPPING')}
                          >
                            Xuất kho & Giao
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtnDanger}
                            onClick={() => updateOrderStatus(ord.id, 'CANCELLED', 'Không đủ tồn kho giao hàng')}
                          >
                            Hủy
                          </button>
                        </>
                      )}

                      {ord.status === 'SHIPPING' && (
                        <button
                          type="button"
                          className={styles.actionBtn}
                          style={{ color: '#00a859', borderColor: '#00a859' }}
                          onClick={() => updateOrderStatus(ord.id, 'COMPLETED')}
                        >
                          Đã giao xong
                        </button>
                      )}

                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setSelectedOrder(ord)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal View Order Details */}
      {selectedOrder && (
        <div className={styles.modalOverlay} onClick={() => setSelectedOrder(null)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Chi tiết đơn hàng #{selectedOrder.code}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>Thời gian đặt hàng:</span>
                  <div style={{ fontWeight: 600 }}>{selectedOrder.date}</div>
                </div>
                <div>{getStatusBadge(selectedOrder.status)}</div>
              </div>

              <div style={{ background: '#f5f7ff', padding: '12px 16px', borderRadius: '6px' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Thông tin người nhận:</div>
                <div style={{ fontSize: '13px' }}><strong>Người nhận:</strong> {selectedOrder.customerName} ({selectedOrder.customerPhone})</div>
                <div style={{ fontSize: '13px' }}><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</div>
                <div style={{ fontSize: '13px' }}><strong>Thanh toán:</strong> {selectedOrder.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Chuyển khoản trực tuyến'}</div>
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
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td>{item.quantity}</td>
                          <td>{currency.format(item.priceVnd)}</td>
                          <td><strong>{currency.format(item.priceVnd * item.quantity)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', fontSize: '16px' }}>
                <span>Tổng cộng:</span>
                <strong style={{ color: 'var(--ts-color-primary)', fontSize: '18px' }}>
                  {currency.format(selectedOrder.totalVnd)}
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
    </div>
  )
}
