import { apiFetch } from './apiClient'
import type {
  AddressItem,
  AddressPayload,
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../../features/account/accountTypes'

export const profileApi = {
  /**
   * Lấy thông tin tài khoản của user hiện tại kèm địa chỉ mặc định
   */
  getProfile(): Promise<UserProfile> {
    return apiFetch<UserProfile>('/me')
  },

  /**
   * Cập nhật thông tin tài khoản (họ tên, số điện thoại, avatar)
   */
  updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    return apiFetch<UserProfile>('/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/me/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Lấy danh sách sổ địa chỉ của user (sắp xếp mặc định lên đầu)
   */
  getAddresses(): Promise<AddressItem[]> {
    return apiFetch<AddressItem[]>('/me/addresses')
  },

  /**
   * Thêm một địa chỉ mới vào sổ địa chỉ
   */
  addAddress(payload: AddressPayload): Promise<AddressItem> {
    return apiFetch<AddressItem>('/me/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Cập nhật thông tin địa chỉ
   */
  updateAddress(id: number, payload: AddressPayload): Promise<AddressItem> {
    return apiFetch<AddressItem>(`/me/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Xóa địa chỉ khỏi sổ địa chỉ
   */
  deleteAddress(id: number): Promise<void> {
    return apiFetch<void>(`/me/addresses/${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Đặt địa chỉ làm mặc định
   */
  setDefaultAddress(id: number): Promise<AddressItem> {
    return apiFetch<AddressItem>(`/me/addresses/${id}/default`, {
      method: 'PATCH',
    })
  },
}
