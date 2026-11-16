import { useState } from 'react'
import { initialInventory, initialBranches, type AdminInventoryItem } from '../adminData'
import styles from '../Admin.module.css'

export function AdminInventoryPage() {
  const [inventory, setInventory] = useState<AdminInventoryItem[]>(initialInventory)
  const [branchFilter, setBranchFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  // Transfer form state
  const [transferItemSku, setTransferItemSku] = useState('MSI-PRO-16')
  const [fromBranch, setFromBranch] = useState('Chi nhánh Quận 1 (TP.HCM)')
  const [toBranch, setToBranch] = useState('Chi nhánh Cầu Giấy (Hà Nội)')
  const [transferQty, setTransferQty] = useState(2)

  const filteredInventory = inventory.filter(item => {
    const matchBranch = branchFilter === 'ALL' || item.branchName === branchFilter
    const matchSearch =
      item.productName.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase())
    return matchBranch && matchSearch
  })

  const handleAdjustQty = (id: string, delta: number) => {
    setInventory(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextQty = Math.max(0, item.quantity + delta)
          const nextStatus = nextQty === 0 ? 'OUT_OF_STOCK' : nextQty <= item.minThreshold ? 'LOW_STOCK' : 'IN_STOCK'
          return { ...item, quantity: nextQty, status: nextStatus }
        }
        return item
      })
    )
    setToast('Đã cập nhật số lượng tồn kho!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (fromBranch === toBranch) {
      alert('Chi nhánh xuất và chi nhánh nhập không được trùng nhau!')
      return
    }

    // Deduct from source and add to destination
    setInventory(prev => {
      return prev.map(item => {
        if (item.sku === transferItemSku && item.branchName === fromBranch) {
          const q = Math.max(0, item.quantity - transferQty)
          return {
            ...item,
            quantity: q,
            status: q === 0 ? 'OUT_OF_STOCK' : q <= item.minThreshold ? 'LOW_STOCK' : 'IN_STOCK',
          }
        }
        if (item.sku === transferItemSku && item.branchName === toBranch) {
          const q = item.quantity + transferQty
          return {
            ...item,
            quantity: q,
            status: q === 0 ? 'OUT_OF_STOCK' : q <= item.minThreshold ? 'LOW_STOCK' : 'IN_STOCK',
          }
        }
        return item
      })
    })

    setIsTransferModalOpen(false)
    setToast(`Đã điều chuyển ${transferQty} sản phẩm từ ${fromBranch} sang ${toBranch}!`)
    setTimeout(() => setToast(''), 4000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý kho hàng & Tồn kho (Inventory)</h1>
          <p>Theo dõi mức tồn kho đa chi nhánh, cảnh báo hết hàng và điều phối luân chuyển hàng hóa.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={() => setIsTransferModalOpen(true)}>
            ⇄ Điều chuyển kho
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Toolbar & Filter */}
      <div className={styles.toolbarCard}>
        <div className={styles.toolbarLeft}>
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />

          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {initialBranches.map(b => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{filteredInventory.length}</strong> bản ghi kho
        </div>
      </div>

      {/* Inventory Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>SKU</th>
              <th>Chi nhánh lưu kho</th>
              <th>Số lượng tồn</th>
              <th>Ngưỡng an toàn</th>
              <th>Tình trạng tồn</th>
              <th>Thao tác điều chỉnh</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: 600 }}>{item.productName}</td>
                <td><code>{item.sku}</code></td>
                <td>{item.branchName}</td>
                <td>
                  <strong style={{ fontSize: '15px' }}>{item.quantity}</strong> chiếc
                </td>
                <td>{item.minThreshold} chiếc</td>
                <td>
                  <span
                    className={`${styles.badge} ${
                      item.status === 'IN_STOCK'
                        ? styles.badgeInStock
                        : item.status === 'LOW_STOCK'
                        ? styles.badgeLowStock
                        : styles.badgeOutOfStock
                    }`}
                  >
                    {item.status === 'IN_STOCK'
                      ? 'Còn hàng'
                      : item.status === 'LOW_STOCK'
                      ? 'Sắp hết hàng'
                      : 'Hết hàng'}
                  </span>
                </td>
                <td>
                  <div className={styles.actionGroup}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleAdjustQty(item.id, -1)}
                      title="Giảm 1"
                    >
                      −1
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleAdjustQty(item.id, 5)}
                      title="Nhập thêm 5"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleAdjustQty(item.id, 20)}
                      title="Nhập thêm 20"
                    >
                      +20
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Transfer Stock */}
      {isTransferModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsTransferModalOpen(false)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Điều chuyển hàng hóa giữa các chi nhánh</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsTransferModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleTransferSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="tr-prod">Chọn sản phẩm cần chuyển *</label>
                  <select
                    id="tr-prod"
                    value={transferItemSku}
                    onChange={e => setTransferItemSku(e.target.value)}
                  >
                    <option value="MSI-PRO-16">MSI Pro 16 Flex All-In-One (MSI-PRO-16)</option>
                    <option value="ASUS-TUF-FX505">ASUS TUF Gaming FX505 (ASUS-TUF-FX505)</option>
                    <option value="ADATA-XPG-32G">RAM Desktop ADATA XPG 32GB (ADATA-XPG-32G)</option>
                  </select>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="tr-from">Chi nhánh xuất hàng (Source) *</label>
                    <select
                      id="tr-from"
                      value={fromBranch}
                      onChange={e => setFromBranch(e.target.value)}
                    >
                      {initialBranches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="tr-to">Chi nhánh nhận hàng (Target) *</label>
                    <select
                      id="tr-to"
                      value={toBranch}
                      onChange={e => setToBranch(e.target.value)}
                    >
                      {initialBranches.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tr-qty">Số lượng điều chuyển *</label>
                  <input
                    id="tr-qty"
                    type="number"
                    min={1}
                    max={50}
                    value={transferQty}
                    onChange={e => setTransferQty(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsTransferModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn}>
                  Xác nhận chuyển kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
