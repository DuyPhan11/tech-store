import { apiFetch } from './apiClient'
import type { LoginRequest, LoginResponse } from '../../features/auth/authTypes'

export const authApi = {
  login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },
}
