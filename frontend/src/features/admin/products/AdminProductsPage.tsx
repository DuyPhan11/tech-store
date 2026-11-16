import { useState } from 'react'
import { initialProducts, type AdminProductItem } from '../adminData'
import styles from '../Admin.module.css'

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductItem[]>(initialProducts)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toast, setToast] = useState('')

  // New product form state
  const [newName, setNewName] = useState('')
  const [newSku, setNewSku] = useState('')
  const [newCategory, setNewCategory] = useState('Laptop')
  const [newBrand, setNewBrand] = useState('MSI')
  const [newPrice, setNewPrice] = useState('15000000')
  const [newStock, setNewStock] = useState('10')

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || p.category === categoryFilter
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchSearch && matchCat && matchStatus
  })

  const handleToggleStatus = (id: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const nextStatus = p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          return { ...p, status: nextStatus }
        }
        return p
      })
    )
    setToast('Đã cập nhật trạng thái sản phẩm!')
    setTimeout(() => setToast(''), 3000)
  }

  const handleDelete = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setToast('Đã xóa sản phẩm thành công!')
      setTimeout(() => setToast(''), 3000)
    }
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newSku.trim()) {
      alert('Vui lòng điền đầy đủ tên và mã SKU sản phẩm.')
      return
    }

    const newProd: AdminProductItem = {
      id: `p-${Date.now()}`,
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      brand: newBrand,
      priceVnd: Number(newPrice) || 10000000,
      stock: Number(newStock) || 0,
      status: 'ACTIVE',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=100&auto=format&fit=crop&q=80',
    }

    setProducts(prev => [newProd, ...prev])
    setIsAddModalOpen(false)
    setNewName('')
    setNewSku('')
    setToast('Đã thêm sản phẩm mới thành công!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className={styles.adminContainer}>
      <span style={{ display: 'none' }}>Vùng nội dung</span>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Quản lý sản phẩm (Products)</h1>
          <p>Quản lý toàn bộ danh mục sản phẩm, cấu hình giá bán, số lượng tồn kho và trạng thái hiển thị.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.pillPrimaryBtn} onClick={() => setIsAddModalOpen(true)}>
            + Thêm sản phẩm mới
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
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">Tất cả danh mục</option>
            <option value="Laptop">Laptop</option>
            <option value="Máy tính để bàn">Máy tính để bàn</option>
            <option value="Màn hình">Màn hình</option>
            <option value="Linh kiện PC">Linh kiện PC</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang kinh doanh (ACTIVE)</option>
            <option value="INACTIVE">Tạm ẩn (INACTIVE)</option>
          </select>

          {(search || categoryFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => {
                setSearch('')
                setCategoryFilter('ALL')
                setStatusFilter('ALL')
              }}
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>

        <div style={{ fontSize: '13px', color: 'var(--ts-color-muted)' }}>
          Hiển thị <strong>{filteredProducts.length}</strong> / {products.length} sản phẩm
        </div>
      </div>

      {/* Products Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>SKU</th>
              <th>Danh mục</th>
              <th>Hãng</th>
              <th>Giá bán niêm yết</th>
              <th>Tồn khả dụng</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--ts-color-muted)' }}>
                  Không tìm thấy sản phẩm nào phù hợp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.productCell}>
                      <img src={p.image} alt={p.name} className={styles.productThumb} />
                      <div className={styles.productMeta}>
                        <span className={styles.productName}>{p.name}</span>
                      </div>
                    </div>
                  </td>
                  <td><code>{p.sku}</code></td>
                  <td>{p.category}</td>
                  <td><strong>{p.brand}</strong></td>
                  <td><strong>{currency.format(p.priceVnd)}</strong></td>
                  <td>
                    <span style={{ fontWeight: 600, color: p.stock <= 5 ? '#d97706' : '#000000' }}>
                      {p.stock} chiếc
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${p.status === 'ACTIVE' ? styles.badgeActive : styles.badgeInactive}`}>
                      {p.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Tạm ẩn'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => handleToggleStatus(p.id)}
                        title="Bật/Tắt trạng thái kinh doanh"
                      >
                        {p.status === 'ACTIVE' ? 'Tạm ẩn' : 'Kích hoạt'}
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtnDanger}
                        onClick={() => handleDelete(p.id)}
                        title="Xóa sản phẩm"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Add Product */}
      {isAddModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={styles.modalWindow} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Thêm sản phẩm công nghệ mới</h2>
              <button type="button" className={styles.closeModalBtn} onClick={() => setIsAddModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label htmlFor="p-name">Tên sản phẩm *</label>
                  <input
                    id="p-name"
                    type="text"
                    required
                    placeholder="ví dụ: Laptop MSI Creator Z16P..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-sku">Mã SKU *</label>
                    <input
                      id="p-sku"
                      type="text"
                      required
                      placeholder="ví dụ: MSI-CREATOR-16"
                      value={newSku}
                      onChange={e => setNewSku(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-brand">Thương hiệu</label>
                    <select id="p-brand" value={newBrand} onChange={e => setNewBrand(e.target.value)}>
                      <option value="MSI">MSI</option>
                      <option value="ASUS">ASUS</option>
                      <option value="Razer">Razer</option>
                      <option value="Thermaltake">Thermaltake</option>
                      <option value="ADATA">ADATA</option>
                      <option value="HP">HP</option>
                      <option value="Gigabyte">Gigabyte</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRowTwo}>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-category">Danh mục</label>
                    <select id="p-category" value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                      <option value="Laptop">Laptop</option>
                      <option value="Máy tính để bàn">Máy tính để bàn</option>
                      <option value="Màn hình">Màn hình</option>
                      <option value="Linh kiện PC">Linh kiện PC</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="p-price">Giá bán (VND) *</label>
                    <input
                      id="p-price"
                      type="number"
                      required
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="p-stock">Số lượng nhập kho ban đầu</label>
                  <input
                    id="p-stock"
                    type="number"
                    value={newStock}
                    onChange={e => setNewStock(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button type="button" className={styles.actionBtn} onClick={() => setIsAddModalOpen(false)}>
                  Hủy bỏ
                </button>
                <button type="submit" className={styles.pillPrimaryBtn}>
                  Lưu sản phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
