import { apiFetch } from './apiClient'
import type {
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterOtpPayload,
  RegisterOtpResponse,
  RegisterPayload,
  ResetPasswordPayload,
  ResetPasswordResponse,
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

  requestPasswordResetOtp(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
    return apiFetch<ForgotPasswordResponse>('/auth/password/request-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
    return apiFetch<ResetPasswordResponse>('/auth/password/reset', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },
}
