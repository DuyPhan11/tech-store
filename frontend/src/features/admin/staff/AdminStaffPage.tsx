import { useState } from 'react'
import { initialStaff, initialBranches, type AdminStaffItem } from '../adminData'
import styles from '../Admin.module.css'

export function AdminStaffPage() {
  const [staff, setStaff] = useState<AdminStaffItem[]>(initialStaff)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  // Form state
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newRole, setNewRole] = useState<'ROLE_STAFF' | 'ROLE_ADMIN'>('ROLE_STAFF')
  const [newBranch, setNewBranch] = useState(initialBranches[0].name)

  const handleToggleStatus = (id: string) => {
    setStaff(prev =>
      prev.map(s => (s.id === id ? { ...s, status: s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : s))
    )
    setToast('Đã cập nhật trạng thái nhân viên!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newEmail.trim()) return

    const newMember: AdminStaffItem = {
      id: `st-${Date.now()}`,
      fullName: newName.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim() || '0901234567',
      role: newRole,
      branchName: newBranch,
      status: 'ACTIVE',
      joinedDate: '16/11/2026',
    }

    setStaff(prev => [newMember, ...prev])
    setIsAddModalOpen(false)
    setNewName('')
    setNewEmail('')
    setNewPhone('')
    setToast('Đã thêm nhân viên mới vào hệ thống!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý nhân viên & Phân quyền (Staff)</h1>
          <p>Danh sách nhân viên cửa hàng, phân bổ chi nhánh công tác và quản trị vai trò hệ thống.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={() => setIsAddModalOpen(true)}>
            + Thêm nhân viên mới
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Vai trò</th>
              <th>Chi nhánh công tác</th>
              <th>Ngày vào làm</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(st => (
              <tr key={st.id}>
                <td>
                  <strong style={{ fontSize: '14px' }}>{st.fullName}</strong>
                </td>
                <td>{st.email}</td>
                <td><code>{st.phone}</code></td>
                <td>
                  <span
                    className={styles.badge}
                    style={{
                      background: st.role === 'ROLE_ADMIN' ? '#e0e7ff' : '#f5f7ff',
                      color: st.role === 'ROLE_ADMIN' ? '#4338ca' : '#1e40af',
                    }}
                  >
                    {st.role === 'ROLE_ADMIN' ? 'Quản trị viên (Admin)' : 'Nhân viên bán hàng (Staff)'}
                  </span>
                </td>
                <td>{st.branchName}</td>
                <td>{st.joinedDate}</td>
                <td>
                  <span className={`${styles.badge} ${st.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                    {st.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc / Tạm khóa'}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    onClick={() => handleToggleStatus(st.id)}
                  >
                    {st.status === 'ACTIVE' ? 'Tạm khóa' : 'Kích hoạt'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Add Staff */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Thêm tài khoản nhân viên mới</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="st-name">Họ và tên nhân viên *</label>
                  <input
                    id="st-name"
                    type="text"
                    required
                    placeholder="ví dụ: Nguyễn Hoàng Long"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="st-email">Email đăng nhập *</label>
                    <input
                      id="st-email"
                      type="email"
                      required
                      placeholder="name@techstore.vn"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="st-phone">Số điện thoại *</label>
                    <input
                      id="st-phone"
                      type="tel"
                      required
                      placeholder="0901234567"
                      value={newPhone}
                      onChange={e => setNewPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="st-role">Vai trò hệ thống</label>
                    <select
                      id="st-role"
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as any)}
                    >
                      <option value="ROLE_STAFF">Nhân viên (Staff)</option>
                      <option value="ROLE_ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="st-branch">Chi nhánh làm việc</label>
                    <select
                      id="st-branch"
                      value={newBranch}
                      onChange={e => setNewBranch(e.target.value)}
                    >
                      {initialBranches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsAddModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn}>
                  Tạo tài khoản nhân viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
