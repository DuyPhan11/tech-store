export interface AddressItem {
  id: number
  recipientName: string
  phone: string
  streetAddress: string
  ward?: string | null
  district?: string | null
  city: string
  isDefault: boolean
  fullAddress: string
  createdAt: string
  updatedAt: string
}

export interface AddressPayload {
  recipientName: string
  phone: string
  streetAddress: string
  ward?: string | null
  district?: string | null
  city: string
  isDefault?: boolean
}

export interface UserProfile {
  id: number
  email: string
  fullName: string | null
  phone: string | null
  avatarUrl: string | null
  roles: string[]
  status: string
  defaultAddress: AddressItem | null
  createdAt: string
}

export interface UpdateProfilePayload {
  fullName?: string
  phone?: string
  avatarUrl?: string
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
  confirmPassword?: string
}
