import { apiFetch } from './apiClient'
import type {
  LoginRequest,
  LoginResponse,
  RegisterOtpPayload,
  RegisterOtpResponse,
  RegisterPayload,
} from '../../features/auth/authTypes'

export const authApi = {
  login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  requestRegisterOtp(payload: RegisterOtpPayload): Promise<RegisterOtpResponse> {
    return apiFetch<RegisterOtpResponse>('/auth/register/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  register(payload: RegisterPayload): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
