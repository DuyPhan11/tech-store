import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { profileApi } from '../../lib/api/profileApi'
import { orderApi } from '../../lib/api/orderApi'
import type { AddressItem, AddressPayload, UserProfile } from './accountTypes'
import type { OrderResponse } from '../orders/orderTypes'
import { recoverAfterCancelFailure } from './cancelOrderRecovery'
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

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function UserAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated, logout } = useAuth()

  const initialTab: TabType = location.pathname.includes('/orders') ? 'orders' : 'dashboard'
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // State cho Modal chi tiết đơn hàng
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // State cho Modal hủy đơn hàng
  const [cancellingOrder, setCancellingOrder] = useState<OrderResponse | null>(null)
  const [cancelReasonInput, setCancelReasonInput] = useState('')
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  
  // Real Profile & Address State
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<AddressItem[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Form states for profile info
  const [fullNameInput, setFullNameInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Form states for password change
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null)
  const [modalRecipientName, setModalRecipientName] = useState('')
  const [modalPhone, setModalPhone] = useState('')
  const [modalStreetAddress, setModalStreetAddress] = useState('')
  const [modalWard, setModalWard] = useState('')
  const [modalDistrict, setModalDistrict] = useState('')
  const [modalCity, setModalCity] = useState('')
  const [modalIsDefault, setModalIsDefault] = useState(false)
  const [modalSubmitting, setModalSubmitting] = useState(false)

  // Load profile and addresses from API
  const fetchProfileAndAddresses = async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const [profData, addrData] = await Promise.all([
        profileApi.getProfile(),
        profileApi.getAddresses(),
      ])
      setProfile(profData)
      setAddresses(addrData)
      setFullNameInput(profData.fullName || '')
      setPhoneInput(profData.phone || '')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải dữ liệu tài khoản'
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Load danh sách đơn hàng thật từ backend API
  const fetchOrders = async () => {
    if (!isAuthenticated) return
    setLoadingOrders(true)
    try {
      const data = await orderApi.getMyOrders()
      setOrders(data)
    } catch {
      // ignore
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchProfileAndAddresses()
    fetchOrders()
  }, [isAuthenticated])

  const showToastSuccess = (text: string) => {
    setMessage(text)
    setErrorMessage('')
    setTimeout(() => setMessage(''), 4000)
  }

  const showToastError = (text: string) => {
    setErrorMessage(text)
    setMessage('')
    setTimeout(() => setErrorMessage(''), 5000)
  }

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileSaving(true)
    setErrorMessage('')
    try {
      const updated = await profileApi.updateProfile({
        fullName: fullNameInput.trim(),
        phone: phoneInput.trim() || undefined,
      })
      setProfile(updated)
      showToastSuccess('Cập nhật thông tin tài khoản thành công!')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cập nhật thất bại. Vui lòng kiểm tra lại.'
      showToastError(msg)
    } finally {
      setProfileSaving(false)
    }
  }

  // Handle Change Password
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      showToastError('Mật khẩu mới phải có tối thiểu 6 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      showToastError('Xác nhận mật khẩu mới không khớp.')
      return
    }
    setPasswordSaving(true)
    setErrorMessage('')
    try {
      await profileApi.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      })
      showToastSuccess('Đổi mật khẩu tài khoản thành công!')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại. Vui lòng thử lại.'
      showToastError(msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  // Open modal to add address
  const handleOpenAddAddress = () => {
    setEditingAddressId(null)
    setModalRecipientName(profile?.fullName || '')
    setModalPhone(profile?.phone || '')
    setModalStreetAddress('')
    setModalWard('')
    setModalDistrict('')
    setModalCity('')
    setModalIsDefault(addresses.length === 0)
    setIsAddressModalOpen(true)
  }

  // Open modal to edit address
  const handleOpenEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id)
    setModalRecipientName(addr.recipientName)
    setModalPhone(addr.phone)
    setModalStreetAddress(addr.streetAddress)
    setModalWard(addr.ward || '')
    setModalDistrict(addr.district || '')
    setModalCity(addr.city)
    setModalIsDefault(addr.isDefault)
    setIsAddressModalOpen(true)
  }

  // Submit address modal
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!modalRecipientName.trim() || !modalPhone.trim() || !modalStreetAddress.trim() || !modalCity.trim()) {
      showToastError('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }
    setModalSubmitting(true)
    const payload: AddressPayload = {
      recipientName: modalRecipientName.trim(),
      phone: modalPhone.trim(),
      streetAddress: modalStreetAddress.trim(),
      ward: modalWard.trim() || undefined,
      district: modalDistrict.trim() || undefined,
      city: modalCity.trim(),
      isDefault: modalIsDefault,
    }

    try {
      if (editingAddressId) {
        await profileApi.updateAddress(editingAddressId, payload)
        showToastSuccess('Cập nhật địa chỉ thành công!')
      } else {
        await profileApi.addAddress(payload)
        showToastSuccess('Thêm địa chỉ mới thành công!')
      }
      setIsAddressModalOpen(false)
      await fetchProfileAndAddresses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi khi lưu địa chỉ'
      showToastError(msg)
    } finally {
      setModalSubmitting(false)
    }
  }

  // Delete address
  const handleDeleteAddress = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ?')) return
    try {
      await profileApi.deleteAddress(id)
      showToastSuccess('Đã xóa địa chỉ thành công.')
      await fetchProfileAndAddresses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa địa chỉ.'
      showToastError(msg)
    }
  }

  // Set default address
  const handleSetDefaultAddress = async (id: number) => {
    try {
      await profileApi.setDefaultAddress(id)
      showToastSuccess('Đã đổi địa chỉ mặc định thành công.')
      await fetchProfileAndAddresses()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể đặt làm mặc định.'
      showToastError(msg)
    }
  }

  // Mở modal xem chi tiết đơn hàng
  const handleOpenDetailModal = async (ord: OrderResponse) => {
    try {
      const fullDetail = await orderApi.getOrderDetail(ord.id)
      setSelectedOrder(fullDetail)
    } catch {
      setSelectedOrder(ord)
    }
    setIsDetailModalOpen(true)
  }

  // Mở modal hủy đơn hàng
  const handleOpenCancelModal = (ord: OrderResponse) => {
    setCancellingOrder(ord)
    setCancelReasonInput('Khách hàng đổi ý / không còn nhu cầu')
    setIsCancelModalOpen(true)
  }

  // Xác nhận hủy đơn hàng
  const handleConfirmCancel = async () => {
    if (!cancellingOrder) return
    setIsCancelling(true)
    try {
      const updated = await orderApi.cancelOrder(cancellingOrder.id, cancelReasonInput.trim())
      setOrders(prev => prev.map(o => (o.id === updated.id ? updated : o)))
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated)
      }
      setIsCancelModalOpen(false)
      showToastSuccess(`Đã gửi yêu cầu hủy đơn hàng #${cancellingOrder.orderCode} thành công. Tồn kho đã được hoàn lại.`)
    } catch (err: unknown) {
      // Đơn có thể vừa bị cửa hàng đổi trạng thái (UC14): đóng modal, tải lại để hiện đúng trạng thái thật
      setIsCancelModalOpen(false)
      const result = await recoverAfterCancelFailure(err, cancellingOrder.id, {
        getMyOrders: () => orderApi.getMyOrders(),
        getOrderDetail: id => orderApi.getOrderDetail(id),
      })
      if (result.orders) setOrders(result.orders)
      if (result.detail && selectedOrder && selectedOrder.id === result.detail.id) {
        setSelectedOrder(result.detail)
      }
      showToastError(result.message)
    } finally {
      setIsCancelling(false)
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: OrderResponse['status']) => {
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

  const displayName = profile?.fullName || user?.fullName || 'Khách hàng'
  const displayEmail = profile?.email || user?.email || ''
  const displayPhone = profile?.phone || user?.phone || 'Chưa cập nhật'
  const defaultAddress = profile?.defaultAddress || addresses.find(a => a.isDefault) || null

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
      {errorMessage && <div className={styles.toastError}>{errorMessage}</div>}

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

          {/* Widget 1: Compare Products */}
          <div className={styles.sideWidget}>
            <h3 className={styles.sideWidgetTitle}>So sánh sản phẩm</h3>
            <p className={styles.sideWidgetText}>Bạn chưa có sản phẩm nào để so sánh.</p>
          </div>

          {/* Widget 2: My Wish List */}
          <div className={styles.sideWidget}>
            <h3 className={styles.sideWidgetTitle}>Danh sách yêu thích</h3>
            <p className={styles.sideWidgetText}>Bạn chưa có sản phẩm nào trong danh sách yêu thích.</p>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className={styles.mainContent}>
          {/* TAB 1: DASHBOARD */}
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
                    <p className={styles.infoText}><strong>Họ tên:</strong> {displayName}</p>
                    <p className={styles.infoText}><strong>Email:</strong> {displayEmail}</p>
                    <p className={styles.infoText}><strong>Điện thoại:</strong> {displayPhone}</p>
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
                        onClick={() => setActiveTab('account_info')}
                      >
                        Đổi mật khẩu
                      </button>
                    </div>
                  </div>

                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Bản tin khuyến mãi</h3>
                    <p className={styles.infoMuted}>Bạn đang đăng ký nhận thông tin ưu đãi từ Tech Store.</p>
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
                    <h3 className={styles.subTitle}>Địa chỉ giao hàng mặc định</h3>
                    {defaultAddress ? (
                      <>
                        <p className={styles.infoText}><strong>Người nhận:</strong> {defaultAddress.recipientName}</p>
                        <p className={styles.infoText}><strong>Điện thoại:</strong> {defaultAddress.phone}</p>
                        <p className={styles.infoMuted}>{defaultAddress.fullAddress}</p>
                        <div className={styles.actionLinks}>
                          <button
                            type="button"
                            className={styles.actionLink}
                            onClick={() => {
                              setActiveTab('addresses')
                              handleOpenEditAddress(defaultAddress)
                            }}
                          >
                            Chỉnh sửa địa chỉ
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className={styles.infoMuted}>Bạn chưa thiết lập địa chỉ nhận hàng mặc định.</p>
                        <div className={styles.actionLinks}>
                          <button
                            type="button"
                            className={styles.actionLink}
                            onClick={handleOpenAddAddress}
                          >
                            Thêm địa chỉ ngay
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <div className={styles.infoCol}>
                    <h3 className={styles.subTitle}>Tổng số địa chỉ đã lưu</h3>
                    <p className={styles.infoText}>Hiện tại bạn có <strong>{addresses.length}</strong> địa chỉ trong sổ địa chỉ.</p>
                    <div className={styles.actionLinks}>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => setActiveTab('addresses')}
                      >
                        Xem tất cả địa chỉ
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
                {loadingOrders ? (
                  <p className={styles.infoMuted}>Đang tải lịch sử đơn hàng...</p>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p className={styles.infoMuted} style={{ marginBottom: '16px' }}>
                      Bạn chưa có đơn đặt hàng nào trong hệ thống.
                    </p>
                    <Button variant="primary" onClick={() => navigate('/products')}>
                      Khám phá sản phẩm ngay
                    </Button>
                  </div>
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
                        <tr key={ord.id}>
                          <td><strong>#{ord.orderCode}</strong></td>
                          <td>{formatDate(ord.createdAt)}</td>
                          <td>{ord.itemSummary || 'Chi tiết trong đơn'}</td>
                          <td>
                            {ord.paymentMethod === 'COD' ? 'Tiền mặt khi nhận (COD)' : 'Chuyển khoản (Online Mock)'}
                          </td>
                          <td><strong>{currency.format(ord.finalAmount)}</strong></td>
                          <td>{getStatusBadge(ord.status)}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                className={styles.detailOrderBtn}
                                onClick={() => handleOpenDetailModal(ord)}
                              >
                                Chi tiết
                              </button>
                              {ord.canCancel && (
                                <button
                                  type="button"
                                  className={styles.cancelOrderBtn}
                                  onClick={() => handleOpenCancelModal(ord)}
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
                  <h2 className={styles.sectionTitle}>Sổ địa chỉ giao nhận ({addresses.length})</h2>
                  <button
                    type="button"
                    className={styles.headerLink}
                    onClick={handleOpenAddAddress}
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>

                {loading ? (
                  <p className={styles.infoMuted}>Đang tải danh sách địa chỉ...</p>
                ) : addresses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p className={styles.infoMuted} style={{ marginBottom: '16px' }}>
                      Bạn chưa có địa chỉ nào được lưu. Hãy thêm địa chỉ để thanh toán nhanh hơn!
                    </p>
                    <Button variant="primary" onClick={handleOpenAddAddress}>
                      + Thêm địa chỉ đầu tiên
                    </Button>
                  </div>
                ) : (
                  <div className={styles.twoColGrid}>
                    {addresses.map((addr, idx) => (
                      <div key={addr.id} className={styles.infoCol}>
                        <h3 className={styles.subTitle}>
                          Địa chỉ #{idx + 1}
                          {addr.isDefault && <span className={styles.badgeDefault}>Mặc định</span>}
                        </h3>
                        <p className={styles.infoText}><strong>Người nhận:</strong> {addr.recipientName}</p>
                        <p className={styles.infoText}><strong>Điện thoại:</strong> {addr.phone}</p>
                        <p className={styles.infoMuted}>{addr.fullAddress}</p>
                        <div className={styles.actionLinks} style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={styles.actionLink}
                            onClick={() => handleOpenEditAddress(addr)}
                          >
                            Chỉnh sửa
                          </button>
                          {!addr.isDefault && (
                            <button
                              type="button"
                              className={styles.actionLink}
                              onClick={() => handleSetDefaultAddress(addr.id)}
                            >
                              Đặt làm mặc định
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.actionBtnDelete}
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: ACCOUNT INFO & PASSWORD */}
          {activeTab === 'account_info' && (
            <div className={styles.tabPane}>
              {/* Profile Details Form */}
              <div className={styles.sectionBlock}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Chỉnh sửa thông tin tài khoản</h2>
                </div>
                <form className={styles.infoForm} onSubmit={handleProfileSubmit}>
                  <div className={styles.formRow}>
                    <label htmlFor="usr-fullname">Họ và tên *</label>
                    <input
                      id="usr-fullname"
                      type="text"
                      value={fullNameInput}
                      onChange={e => setFullNameInput(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label htmlFor="usr-email">Email đăng nhập</label>
                    <input
                      id="usr-email"
                      type="email"
                      value={displayEmail}
                      disabled
                      title="Email là định danh tài khoản và không thể thay đổi"
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label htmlFor="usr-phone">Số điện thoại *</label>
                    <input
                      id="usr-phone"
                      type="tel"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      placeholder="0901234567"
                      pattern="^(0|\+84)[0-9]{9,10}$"
                      title="Số điện thoại gồm 10 hoặc 11 chữ số, bắt đầu bằng 0 hoặc +84"
                    />
                  </div>
                  <button type="submit" className={styles.saveBtnPill} disabled={profileSaving}>
                    {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </form>
              </div>

              {/* Change Password Form */}
              <div className={styles.passwordSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Đổi mật khẩu tài khoản</h2>
                </div>
                <form className={styles.infoForm} onSubmit={handlePasswordSubmit}>
                  <div className={styles.formRow}>
                    <label htmlFor="old-password">Mật khẩu hiện tại *</label>
                    <input
                      id="old-password"
                      type="password"
                      value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      placeholder="Nhập mật khẩu cũ"
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label htmlFor="new-password">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                      minLength={6}
                      required
                    />
                  </div>
                  <div className={styles.formRow}>
                    <label htmlFor="confirm-password">Xác nhận mật khẩu mới *</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      minLength={6}
                      required
                    />
                  </div>
                  <button type="submit" className={styles.saveBtnPill} disabled={passwordSaving}>
                    {passwordSaving ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
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
                    onClick={() => showToastSuccess('Cài đặt bản tin đã được lưu thành công!')}
                  >
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Thêm / Sửa Địa chỉ */}
      {isAddressModalOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-addr-title">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 id="modal-addr-title" className={styles.modalTitle}>
                {editingAddressId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ giao nhận mới'}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsAddressModalOpen(false)}
                aria-label="Đóng"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAddress}>
              <div className={styles.infoForm} style={{ maxWidth: '100%' }}>
                <div className={styles.formRow}>
                  <label htmlFor="modal-name">Tên người nhận *</label>
                  <input
                    id="modal-name"
                    type="text"
                    value={modalRecipientName}
                    onChange={e => setModalRecipientName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="modal-phone">Số điện thoại *</label>
                  <input
                    id="modal-phone"
                    type="tel"
                    value={modalPhone}
                    onChange={e => setModalPhone(e.target.value)}
                    placeholder="0901234567"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="modal-street">Địa chỉ chi tiết (số nhà, đường) *</label>
                  <input
                    id="modal-street"
                    type="text"
                    value={modalStreetAddress}
                    onChange={e => setModalStreetAddress(e.target.value)}
                    placeholder="123 Đường Lê Lợi"
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="modal-ward">Phường / Xã</label>
                  <input
                    id="modal-ward"
                    type="text"
                    value={modalWard}
                    onChange={e => setModalWard(e.target.value)}
                    placeholder="Phường Bến Nghé"
                  />
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="modal-district">Quận / Huyện</label>
                  <input
                    id="modal-district"
                    type="text"
                    value={modalDistrict}
                    onChange={e => setModalDistrict(e.target.value)}
                    placeholder="Quận 1"
                  />
                </div>

                <div className={styles.formRow}>
                  <label htmlFor="modal-city">Tỉnh / Thành phố *</label>
                  <input
                    id="modal-city"
                    type="text"
                    value={modalCity}
                    onChange={e => setModalCity(e.target.value)}
                    placeholder="TP. Hồ Chí Minh"
                    required
                  />
                </div>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={modalIsDefault}
                    onChange={e => setModalIsDefault(e.target.checked)}
                  />
                  <span>Đặt làm địa chỉ giao hàng mặc định</span>
                </label>

                <div className={styles.modalActions}>
                  <button
                    type="button"
                    className={styles.btnSecondary}
                    onClick={() => setIsAddressModalOpen(false)}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className={styles.saveBtnPill}
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? 'Đang lưu...' : 'Lưu địa chỉ'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem chi tiết đơn hàng */}
      {isDetailModalOpen && selectedOrder && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.detailModalContent}>
            <div className={styles.detailModalHeader}>
              <h2 className={styles.detailModalTitle}>Chi tiết đơn hàng #{selectedOrder.orderCode}</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsDetailModalOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className={styles.twoColGrid} style={{ marginBottom: '20px' }}>
              <div>
                <h3 className={styles.subTitle}>Thông tin giao hàng</h3>
                <p className={styles.infoText}><strong>Người nhận:</strong> {selectedOrder.recipientName}</p>
                <p className={styles.infoText}><strong>Số điện thoại:</strong> {selectedOrder.recipientPhone}</p>
                <p className={styles.infoMuted}>{selectedOrder.shippingAddress}</p>
              </div>
              <div>
                <h3 className={styles.subTitle}>Thông tin đơn hàng</h3>
                <p className={styles.infoText}><strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}</p>
                <p className={styles.infoText}>
                  <strong>Phương thức:</strong>{' '}
                  {selectedOrder.paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : 'Thanh toán trực tuyến (Online Mock)'}
                </p>
                <p className={styles.infoText}>
                  <strong>Thanh toán:</strong> {selectedOrder.paymentStatusLabel}
                </p>
                <p className={styles.infoText}>
                  <strong>Trạng thái:</strong> {getStatusBadge(selectedOrder.status)}
                </p>
              </div>
            </div>

            {selectedOrder.cancelReason && (
              <div className={styles.cancelledNotice}>
                <strong>Đơn hàng đã hủy:</strong> {selectedOrder.cancelReason}
                {selectedOrder.cancelledAt && <span> ({formatDate(selectedOrder.cancelledAt)})</span>}
              </div>
            )}

            <h3 className={styles.subTitle} style={{ marginTop: '20px' }}>Danh sách sản phẩm</h3>
            <table className={styles.detailTable}>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>SKU</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th style={{ textAlign: 'right' }}>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items && selectedOrder.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {item.productImage && (
                          <img src={item.productImage} alt={item.productName} className={styles.detailItemThumb} />
                        )}
                        <span>{item.productName}</span>
                      </div>
                    </td>
                    <td>{item.productSku}</td>
                    <td>{currency.format(item.unitPrice)}</td>
                    <td>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{currency.format(item.subtotalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.detailSummaryBox}>
              <div className={styles.summaryRow}>
                <span>Tổng tiền hàng:</span>
                <span>{currency.format(selectedOrder.totalItemsAmount)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Giảm giá khuyến mãi:</span>
                <span>-{currency.format(selectedOrder.discountAmount || 0)}</span>
              </div>
              <div className={styles.summaryRowTotal}>
                <span>Tổng thanh toán:</span>
                <span>{currency.format(selectedOrder.finalAmount)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              {selectedOrder.canCancel && (
                <button
                  type="button"
                  className={styles.cancelOrderBtn}
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    handleOpenCancelModal(selectedOrder)
                  }}
                >
                  Hủy đơn hàng này
                </button>
              )}
              <button
                type="button"
                className={styles.saveBtnPill}
                onClick={() => setIsDetailModalOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận hủy đơn hàng */}
      {isCancelModalOpen && cancellingOrder && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Xác nhận hủy đơn hàng #{cancellingOrder.orderCode}</h2>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsCancelModalOpen(false)}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div>
              <p className={styles.infoText} style={{ marginBottom: '16px' }}>
                Bạn có chắc chắn muốn hủy đơn hàng này? Sau khi hủy, sản phẩm sẽ được hoàn lại kho và trạng thái đơn hàng sẽ không thể thay đổi.
              </p>

              <div className={styles.formRow}>
                <label htmlFor="cancel-reason">Lý do hủy đơn hàng *</label>
                <textarea
                  id="cancel-reason"
                  className={styles.cancelTextarea}
                  value={cancelReasonInput}
                  onChange={e => setCancelReasonInput(e.target.value)}
                  placeholder="Nhập lý do bạn muốn hủy đơn hàng..."
                  required
                />
              </div>

              <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => setIsCancelModalOpen(false)}
                  disabled={isCancelling}
                >
                  Không, giữ đơn
                </button>
                <button
                  type="button"
                  className={styles.dangerBtnPill}
                  onClick={handleConfirmCancel}
                  disabled={isCancelling || !cancelReasonInput.trim()}
                >
                  {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy đơn'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
