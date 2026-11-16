import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import styles from './UserAccountPage.module.css'

type TabType =
  | 'dashboard'
  | 'account_info'
  | 'addresses'
  | 'orders'
  | 'downloadable'
  | 'payment_methods'
  | 'billing_agreements'
  | 'wishlist'
  | 'reviews'
  | 'newsletters'

interface MockOrder {
  code: string
  date: string
  totalVnd: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED'
  itemSummary: string
  paymentMethod: string
}

const mockOrders: MockOrder[] = [
  {
    code: 'TS-100245',
    date: '15/11/2026',
    totalVnd: 41480000,
    status: 'PENDING',
    itemSummary: 'MSI Pro 16 Flex + MSI MPG Trident AS PC',
    paymentMethod: 'COD',
  },
  {
    code: 'TS-100189',
    date: '02/10/2026',
    totalVnd: 28990000,
    status: 'COMPLETED',
    itemSummary: 'MSI Gaming Laptop GE66 Raider 10SFS',
    paymentMethod: 'ONLINE_MOCK',
  },
  {
    code: 'TS-099412',
    date: '18/08/2026',
    totalVnd: 5490000,
    status: 'CANCELLED',
    itemSummary: 'Màn hình MSI Optix MAG274QRF-QD 27 inch',
    paymentMethod: 'COD',
  },
]

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function UserAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  const initialTab: TabType = location.pathname.includes('/orders') ? 'orders' : 'dashboard'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [orders, setOrders] = useState<MockOrder[]>(mockOrders)
  const [message, setMessage] = useState('')

  const displayName = user?.fullName || 'Alex Driver'
  const displayEmail = user?.email || 'ExampeAdress@gmail.com'

  const handleCancelOrder = (code: string) => {
    setOrders(prev =>
      prev.map(ord => (ord.code === code ? { ...ord, status: 'CANCELLED' } : ord))
    )
    setMessage(`Đã gửi yêu cầu hủy đơn hàng #${code} thành công.`)
    setTimeout(() => setMessage(''), 4000)
  }

  const getStatusBadge = (status: MockOrder['status']) => {
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
    <div className={styles.accountPage}>
      {/* Breadcrumb */}
      <nav aria-label="Đường dẫn trang" className={styles.breadcrumb}>
        <a href="/">Trang chủ</a>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">›</span>
        <span className={styles.breadcrumbCurrent}>Bảng điều khiển tài khoản</span>
      </nav>

      {/* Page Title */}
      <h1 className={styles.pageTitle}>Bảng điều khiển tài khoản</h1>

      {message && <div className={styles.toastSuccess}>{message}</div>}

      <div className={styles.accountLayout}>
        {/* Left Sidebar matching Figma */}
        <aside className={styles.sidebar}>
          {/* Main Navigation Panel (#F5F7FF background, borderless) */}
          <nav className={styles.navPanel} aria-label="Menu tài khoản">
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <span>Bảng điều khiển tài khoản</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'account_info' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('account_info')}
            >
              <span>Thông tin tài khoản</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'addresses' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <span>Sổ địa chỉ</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'orders' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <span>Đơn hàng của tôi</span>
              <span className={styles.orderCountBadge}>{orders.length}</span>
            </button>

            <div className={styles.navDivider} role="separator" />

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'downloadable' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('downloadable')}
            >
              <span>Sản phẩm tải về</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'payment_methods' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('payment_methods')}
            >
              <span>Phương thức thanh toán đã lưu</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'billing_agreements' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('billing_agreements')}
            >
              <span>Thỏa thuận thanh toán</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'wishlist' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('wishlist')}
            >
              <span>Danh sách yêu thích</span>
            </button>

            <div className={styles.navDivider} role="separator" />

            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'reviews' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <span>Đánh giá sản phẩm của tôi</span>
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'newsletters' ? styles.activeNav : ''}`}
              onClick={() => setActiveTab('newsletters')}
            >
              <span>Đăng ký nhận tin</span>
            </button>

            {isAuthenticated && (
              <>
                <div className={styles.navDivider} role="separator" />
                <button
                  type="button"
                  className={styles.logoutNavBtn}
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  <span>Đăng xuất tài khoản</span>
                </button>
              </>
            )}
          </nav>

          {/* Widget 1: Compare Products matching Figma */}
          <div className={styles.sideWidget}>
            <h3 className={styles.sideWidgetTitle}>So sánh sản phẩm</h3>
            <p className={styles.sideWidgetText}>Bạn chưa có sản phẩm nào để so sánh.</p>
          </div>

          {/* Widget 2: My Wish List matching Figma */}
          <div className={styles.sideWidget}>
            <h3 className={styles.sideWidgetTitle}>Danh sách yêu thích</h3>
            <p className={styles.sideWidgetText}>Bạn chưa có sản phẩm nào trong danh sách yêu thích.</p>
          </div>
        </aside>

        {/* Right Main Content: CLEAN & BORDERLESS matching Figma */}
        <main className={styles.mainContent}>
          {/* TAB 1: DASHBOARD (Exact Match to Figma Image 2) */}
          {activeTab === 'dashboard' && (
            <div className={styles.tabPane}>
              {/* Section 1: Account Information */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Thông tin tài khoản</h2>
                </div>
                <div className={styles.twoColGrid}>
                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Thông tin liên lạc</h3>
                    <p className={styles.infoText}>{displayName}</p>
                    <p className={styles.infoText}>{displayEmail}</p>
                    <div className={styles.actionLinks}>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => setActiveTab('account_info')}
                      >
                        Chỉnh sửa
                      </button>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => alert('Chức năng đổi mật khẩu tài khoản')}
                      >
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Bản tin khuyến mãi</h3>
                    <p className={styles.infoMuted}>Bạn chưa đăng ký nhận bản tin công nghệ của chúng tôi.</p>
                    <div className={styles.actionLinks}>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => setActiveTab('newsletters')}
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Address Book */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Sổ địa chỉ</h2>
                  <button
                    type="button"
                    className={styles.headerLink}
                    onClick={() => setActiveTab('addresses')}
                  >
                    Quản lý địa chỉ
                  </button>
                </div>
                <div className={styles.twoColGrid}>
                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Địa chỉ thanh toán mặc định</h3>
                    <p className={styles.infoMuted}>Bạn chưa thiết lập địa chỉ thanh toán mặc định.</p>
                    <div className={styles.actionLinks}>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => setActiveTab('addresses')}
                      >
                        Chỉnh sửa địa chỉ
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Địa chỉ nhận hàng mặc định</h3>
                    <p className={styles.infoMuted}>Bạn chưa thiết lập địa chỉ nhận hàng mặc định.</p>
                    <div className={styles.actionLinks}>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => setActiveTab('addresses')}
                      >
                        Chỉnh sửa địa chỉ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS */}
          {activeTab === 'orders' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Lịch sử đơn hàng của tôi ({orders.length})</h2>
                </div>
                {orders.length === 0 ? (
                  <p className={styles.infoMuted}>Bạn chưa có đơn đặt hàng nào.</p>
                ) : (
                  <table className={styles.orderTable}>
                    <thead>
                      <tr>
                        <th>Mã đơn</th>
                        <th>Ngày đặt</th>
                        <th>Sản phẩm</th>
                        <th>Phương thức</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(ord => (
                        <tr key={ord.code}>
                          <td><strong>#{ord.code}</strong></td>
                          <td>{ord.date}</td>
                          <td>{ord.itemSummary}</td>
                          <td>{ord.paymentMethod === 'COD' ? 'Tiền mặt khi nhận (COD)' : 'Chuyển khoản (Online Mock)'}</td>
                          <td><strong>{currency.format(ord.totalVnd)}</strong></td>
                          <td>{getStatusBadge(ord.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              {ord.status === 'PENDING' && (
                                <button
                                  type="button"
                                  className={styles.cancelOrderBtn}
                                  onClick={() => handleCancelOrder(ord.code)}
                                >
                                  Hủy
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.reorderBtn}
                                onClick={() => navigate('/products')}
                              >
                                Mua lại
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Sổ địa chỉ giao nhận</h2>
                  <button
                    type="button"
                    className={styles.headerLink}
                    onClick={() => alert('Thêm địa chỉ mới')}
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>
                <div className={styles.twoColGrid}>
                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Địa chỉ nhà riêng (Mặc định)</h3>
                    <p className={styles.infoText}><strong>Người nhận:</strong> Nguyễn Văn A</p>
                    <p className={styles.infoText}><strong>Điện thoại:</strong> 0901234567</p>
                    <p className={styles.infoMuted}>123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</p>
                    <div className={styles.actionLinks}>
                      <button type="button" className={styles.actionLink}>Chỉnh sửa địa chỉ</button>
                    </div>
                  </div>

                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Địa chỉ văn phòng / Công ty</h3>
                    <p className={styles.infoText}><strong>Người nhận:</strong> Nguyễn Văn A</p>
                    <p className={styles.infoText}><strong>Điện thoại:</strong> 0901234567</p>
                    <p className={styles.infoMuted}>Tầng 8 Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP. HCM</p>
                    <div className={styles.actionLinks}>
                      <button type="button" className={styles.actionLink}>Chỉnh sửa địa chỉ</button>
                      <button type="button" className={styles.actionLink}>Đặt làm mặc định</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT INFO */}
          {activeTab === 'account_info' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Chỉnh sửa thông tin tài khoản</h2>
                </div>
                <form className={styles.infoForm} onSubmit={e => { e.preventDefault(); alert('Cập nhật thông tin thành công!') }}>
                  <div className={styles.formRow}>
                    <label htmlFor="usr-fullname">Họ và tên</label>
                    <input id="usr-fullname" type="text" defaultValue={displayName} />
                  </div>
                  <div className={styles.formRow}>
                    <label htmlFor="usr-email">Email đăng nhập</label>
                    <input id="usr-email" type="email" defaultValue={displayEmail} disabled />
                  </div>
                  <div className={styles.formRow}>
                    <label htmlFor="usr-phone">Số điện thoại</label>
                    <input id="usr-phone" type="tel" defaultValue="0901234567" />
                  </div>
                  <button type="submit" className={styles.saveBtnPill}>
                    Lưu thay đổi
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 5: DOWNLOADABLE PRODUCTS */}
          {activeTab === 'downloadable' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Sản phẩm tải về</h2>
                </div>
                <p className={styles.infoMuted}>Bạn chưa có sản phẩm kỹ thuật số hoặc tài liệu nào để tải về.</p>
              </div>
            </div>
          )}

          {/* TAB 6: PAYMENT METHODS */}
          {activeTab === 'payment_methods' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Phương thức thanh toán đã lưu</h2>
                </div>
                <p className={styles.infoMuted}>Bạn chưa lưu phương thức thanh toán trực tuyến nào.</p>
              </div>
            </div>
          )}

          {/* TAB 7: BILLING AGREEMENTS */}
          {activeTab === 'billing_agreements' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Thỏa thuận thanh toán</h2>
                </div>
                <p className={styles.infoMuted}>Bạn chưa có thỏa thuận thanh toán định kỳ nào.</p>
              </div>
            </div>
          )}

          {/* TAB 8: WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Danh sách sản phẩm yêu thích</h2>
                </div>
                <p className={styles.infoMuted} style={{ marginBottom: '16px' }}>
                  Bạn chưa có sản phẩm nào trong danh sách yêu thích.
                </p>
                <Button variant="primary" className={styles.reorderBtn} onClick={() => navigate('/products')}>
                  Khám phá sản phẩm ngay
                </Button>
              </div>
            </div>
          )}

          {/* TAB 9: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Đánh giá sản phẩm của tôi</h2>
                </div>
                <p className={styles.infoMuted}>Bạn chưa viết bài đánh giá sản phẩm nào.</p>
              </div>
            </div>
          )}

          {/* TAB 10: NEWSLETTERS */}
          {activeTab === 'newsletters' && (
            <div className={styles.tabPane}>
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Đăng ký nhận tin tức khuyến mãi</h2>
                </div>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" defaultChecked />
                  <span>Nhận email về các sản phẩm công nghệ mới, flash sale và mã giảm giá hàng tuần từ Tech Store.</span>
                </label>
                <div style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className={styles.saveBtnPill}
                    onClick={() => alert('Cài đặt bản tin đã được lưu thành công!')}
                  >
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
