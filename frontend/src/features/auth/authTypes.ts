export interface AuthUser {
  id: number
  email: string
  phone: string
  fullName: string
  status: 'ACTIVE' | 'LOCKED'
  roles: string[]
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface RegisterOtpPayload {
  email: string
}

export interface RegisterOtpResponse {
  message: string
  email: string
  expiresInSeconds: number
  resendCooldownSeconds: number
}

export interface RegisterPayload {
  email: string
  otp: string
  fullName: string
  phone: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: AuthUser
}

export interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  isStaff: boolean
  isCustomer: boolean
  hasRole: (role: string) => boolean
  login: (credentials: LoginRequest) => Promise<LoginResponse>
  logout: () => void
}
