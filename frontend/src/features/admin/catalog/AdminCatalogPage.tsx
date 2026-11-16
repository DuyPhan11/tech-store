import { useState } from 'react'
import { initialCategories, initialBrands, type AdminCategoryItem, type AdminBrandItem } from '../adminData'
import styles from '../Admin.module.css'

export function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'BRANDS'>('CATEGORIES')
  const [categories, setCategories] = useState<AdminCategoryItem[]>(initialCategories)
  const [brands, setBrands] = useState<AdminBrandItem[]>(initialBrands)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newExtra, setNewExtra] = useState('')
  const [toast, setToast] = useState('')

  const handleToggleCat = (id: string) => {
    setCategories(prev =>
      prev.map(c => (c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c))
    )
    setToast('Đã cập nhật trạng thái danh mục!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleToggleBrand = (id: string) => {
    setBrands(prev =>
      prev.map(b => (b.id === id ? { ...b, status: b.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : b))
    )
    setToast('Đã cập nhật trạng thái thương hiệu!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    if (activeTab === 'CATEGORIES') {
      const newCat: AdminCategoryItem = {
        id: `cat-${Date.now()}`,
        name: newName.trim(),
        slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
        productCount: 0,
        description: newExtra || 'Mô tả danh mục mới',
        status: 'ACTIVE',
      }
      setCategories(prev => [newCat, ...prev])
      setToast('Đã thêm danh mục mới thành công!')
    } else {
      const newBr: AdminBrandItem = {
        id: `br-${Date.now()}`,
        name: newName.trim(),
        country: newExtra || 'Việt Nam',
        productCount: 0,
        status: 'ACTIVE',
      }
      setBrands(prev => [newBr, ...prev])
      setToast('Đã thêm thương hiệu mới thành công!')
    }

    setIsAddModalOpen(false)
    setNewName('')
    setNewExtra('')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý danh mục & thương hiệu (Catalog)</h1>
          <p>Thiết lập cây phân cấp danh mục ngành hàng và các thương hiệu công nghệ đối tác phân phối.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={() => setIsAddModalOpen(true)}>
            + Thêm {activeTab === 'CATEGORIES' ? 'danh mục mới' : 'thương hiệu mới'}
          </button>
        </div>
      </div>

      {toast && <div className={styles.toastNotice}>{toast}</div>}

      {/* Tabs */}
      <div className={styles.statusTabs}>
        <button
          type="button"
          className={`${styles.statusTabBtn} ${activeTab === 'CATEGORIES' ? styles.activeStatusTab : ''}`}
          onClick={() => setActiveTab('CATEGORIES')}
        >
          Danh mục sản phẩm ({categories.length})
        </button>
        <button
          type="button"
          className={`${styles.statusTabBtn} ${activeTab === 'BRANDS' ? styles.activeStatusTab : ''}`}
          onClick={() => setActiveTab('BRANDS')}
        >
          Thương hiệu đối tác ({brands.length})
        </button>
      </div>

      {/* Categories View */}
      {activeTab === 'CATEGORIES' && (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Đường dẫn (Slug)</th>
                <th>Mô tả chi tiết</th>
                <th>Số sản phẩm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 600 }}>{cat.name}</td>
                  <td><code>/products?category={cat.slug}</code></td>
                  <td>{cat.description}</td>
                  <td><strong>{cat.productCount}</strong> sản phẩm</td>
                  <td>
                    <span className={`${styles.badge} ${cat.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {cat.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleToggleCat(cat.id)}
                    >
                      {cat.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brands View */}
      {activeTab === 'BRANDS' && (
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Tên thương hiệu</th>
                <th>Quốc gia xuất xứ</th>
                <th>Số lượng sản phẩm</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {brands.map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 600, fontSize: '15px' }}>{b.name}</td>
                  <td>{b.country}</td>
                  <td><strong>{b.productCount}</strong> sản phẩm</td>
                  <td>
                    <span className={`${styles.badge} ${b.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {b.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      onClick={() => handleToggleBrand(b.id)}
                    >
                      {b.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Thêm {activeTab === 'CATEGORIES' ? 'danh mục mới' : 'thương hiệu mới'}</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="cat-name">Tên {activeTab === 'CATEGORIES' ? 'danh mục' : 'thương hiệu'} *</label>
                  <input
                    id="cat-name"
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder={activeTab === 'CATEGORIES' ? 'ví dụ: Bàn phím cơ & Chuột' : 'ví dụ: Corsair'}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="cat-extra">{activeTab === 'CATEGORIES' ? 'Mô tả tóm tắt' : 'Quốc gia xuất xứ'}</label>
                  <input
                    id="cat-extra"
                    type="text"
                    value={newExtra}
                    onChange={e => setNewExtra(e.target.value)}
                    placeholder={activeTab === 'CATEGORIES' ? 'Các dòng chuột không dây, phím cơ custom...' : 'ví dụ: Mỹ, Nhật Bản, Đài Loan...'}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsAddModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn}>
                  Lưu dữ liệu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
