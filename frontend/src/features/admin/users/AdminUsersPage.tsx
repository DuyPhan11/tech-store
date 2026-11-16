import { useState } from 'react'
import { initialUsers, type AdminUserItem } from '../adminData'
import styles from '../Admin.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'LOCKED'>('ALL')
  const [toast, setToast] = useState('')

  const filteredUsers = users.filter(u => {
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
    return matchStatus && matchSearch
  })

  const handleToggleLock = (id: string) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const nextStatus = u.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
          return { ...u, status: nextStatus }
        }
        return u
      })
    )
    setToast('Đã cập nhật trạng thái khóa/mở khóa tài khoản người dùng!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý người dùng & khách hàng (Users)</h1>
          <p>Danh sách tài khoản thành viên, lịch sử đặt hàng và kiểm soát quyền truy cập / khóa tài khoản vi phạm.</p>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Filter Toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
            style={{ minWidth: '300px' }}
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className={styles.selectInput}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="LOCKED">Đang bị khóa (LOCKED)</option>
          </select>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{filteredUsers.length}</strong> khách hàng
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Số đơn đã mua</th>
              <th>Tổng chi tiêu</th>
              <th>Ngày tham gia</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>
                  <strong style={{ fontSize: '14px' }}>{u.fullName}</strong>
                </td>
                <td>{u.email}</td>
                <td><code>{u.phone}</code></td>
                <td><strong>{u.orderCount}</strong> đơn</td>
                <td><strong>{currency.format(u.totalSpentVnd)}</strong></td>
                <td>{u.createdAt}</td>
                <td>
                  <span className={`${styles.badge} ${u.status === 'ACTIVE' ? styles.badgeActive : styles.badgeLocked}`}>
                    {u.status === 'ACTIVE' ? 'Hoạt động' : 'Đã bị khóa'}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={u.status === 'ACTIVE' ? styles.actionBtnDanger : styles.actionBtn}
                      onClick={() => handleToggleLock(u.id)}
                    >
                      {u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                    </button>
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
