import { useState } from 'react'
import { initialCoupons, type AdminCouponItem } from '../adminData'
import styles from '../Admin.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<AdminCouponItem[]>(initialCoupons)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  // Form state
  const [newCode, setNewCode] = useState('')
  const [newType, setNewType] = useState<'PERCENT' | 'FIXED'>('PERCENT')
  const [newValue, setNewValue] = useState(10)
  const [newMinOrder, setNewMinOrder] = useState(5000000)
  const [newMaxUsage, setNewMaxUsage] = useState(100)
  const [newExpiry, setNewExpiry] = useState('31/12/2026')

  const handleToggleStatus = (id: string) => {
    setCoupons(prev =>
      prev.map(c => (c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE' } : c))
    )
    setToast('Đã cập nhật trạng thái mã khuyến mãi!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCode.trim()) return

    const newCoupon: AdminCouponItem = {
      id: `cp-${Date.now()}`,
      code: newCode.trim().toUpperCase(),
      discountType: newType,
      discountValue: Number(newValue),
      minOrderVnd: Number(newMinOrder),
      usedCount: 0,
      maxUsage: Number(newMaxUsage),
      validFrom: '16/11/2026',
      validUntil: newExpiry,
      status: 'ACTIVE',
    }

    setCoupons(prev => [newCoupon, ...prev])
    setIsAddModalOpen(false)
    setNewCode('')
    setToast('Đã phát hành mã khuyến mãi mới thành công!')
    setTimeout(() => setToast(''), 3000)
  }

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
          <button type="button" className={styles.pillPrimaryBtn} onClick={() => setIsAddModalOpen(true)}>
            + Tạo mã khuyến mãi mới
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

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
            {coupons.map(cp => (
              <tr key={cp.id}>
                <td>
                  <strong style={{ letterSpacing: '1px', color: 'var(--ts-color-primary)', fontSize: '15px' }}>
                    {cp.code}
                  </strong>
                </td>
                <td>
                  <strong style={{ color: '#00a859' }}>
                    {cp.discountType === 'PERCENT' ? `Giảm ${cp.discountValue}%` : `Giảm ${currency.format(cp.discountValue)}`}
                  </strong>
                </td>
                <td>{currency.format(cp.minOrderVnd)}</td>
                <td>{cp.validFrom} — {cp.validUntil}</td>
                <td>
                  <strong>{cp.usedCount}</strong> / {cp.maxUsage} lượt
                </td>
                <td>
                  <span className={`${styles.badge} ${cp.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                    {cp.status === 'ACTIVE' ? 'Đang hiệu lực' : 'Đã dừng / Hết hạn'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleToggleStatus(cp.id)}
                  >
                    {cp.status === 'ACTIVE' ? 'Dừng mã' : 'Kích hoạt lại'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Phát hành mã khuyến mãi mới</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCoupon}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="cp-code">Mã voucher (In hoa, không dấu cách) *</label>
                  <input
                    id="cp-code"
                    type="text"
                    required
                    placeholder="ví dụ: TECHSTORE20"
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                  />
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-type">Hình thức giảm *</label>
                    <select
                      id="cp-type"
                      value={newType}
                      onChange={e => setNewType(e.target.value as any)}
                    >
                      <option value="PERCENT">Giảm theo tỷ lệ phần trăm (%)</option>
                      <option value="FIXED">Giảm số tiền cố định (VND)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-val">Giá trị giảm *</label>
                    <input
                      id="cp-val"
                      type="number"
                      required
                      value={newValue}
                      onChange={e => setNewValue(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-min">Giá trị đơn tối thiểu (VND)</label>
                    <input
                      id="cp-min"
                      type="number"
                      value={newMinOrder}
                      onChange={e => setNewMinOrder(Number(e.target.value))}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="cp-max">Giới hạn số lượt dùng</label>
                    <input
                      id="cp-max"
                      type="number"
                      value={newMaxUsage}
                      onChange={e => setNewMaxUsage(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="cp-exp">Ngày hết hạn *</label>
                  <input
                    id="cp-exp"
                    type="text"
                    required
                    placeholder="31/12/2026"
                    value={newExpiry}
                    onChange={e => setNewExpiry(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsAddModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn}>
                  Phát hành mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
