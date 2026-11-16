import { useState } from 'react'
import { initialBranches, type AdminBranchItem } from '../adminData'
import styles from '../Admin.module.css'

export function AdminBranchesPage() {
  const [branches, setBranches] = useState<AdminBranchItem[]>(initialBranches)
  const [toast, setToast] = useState('')

  const handleToggleStatus = (id: string) => {
    setBranches(prev =>
      prev.map(b => (b.id === id ? { ...b, status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : b))
    )
    setToast('Đã cập nhật trạng thái chi nhánh!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý chi nhánh cửa hàng (Branches)</h1>
          <p>Mạng lưới showroom trải nghiệm công nghệ, thông tin liên hệ và trạng thái mở cửa của từng cơ sở.</p>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Tên chi nhánh</th>
              <th>Địa chỉ showroom</th>
              <th>Tỉnh / Thành phố</th>
              <th>Hotline</th>
              <th>Quản lý chi nhánh</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {branches.map(b => (
              <tr key={b.id}>
                <td>
                  <strong style={{ fontSize: '14px', color: 'var(--ts-color-primary)' }}>{b.name}</strong>
                </td>
                <td>{b.address}</td>
                <td>{b.city}</td>
                <td><code>{b.phone}</code></td>
                <td><strong>{b.managerName}</strong></td>
                <td>
                  <span className={`${styles.badge} ${b.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                    {b.status === 'ACTIVE' ? 'Đang mở cửa' : 'Tạm dừng hoạt động'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleToggleStatus(b.id)}
                  >
                    {b.status === 'ACTIVE' ? 'Tạm đóng cửa' : 'Mở lại'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
