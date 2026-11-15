import { clearStoredAuth, getStoredToken } from '../../features/auth/authStorage'

export interface BackendErrorBody {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string>
  readonly path?: string

  constructor(status: number, message: string, errors?: Record<string, string>, path?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.path = path
  }
}

type UnauthorizedHandler = () => void
let onUnauthorizedCallback: UnauthorizedHandler | null = null

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorizedCallback = handler
}

export function getApiBaseUrl(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }
  return '/api'
}

export async function apiFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${baseUrl}${path}`

  const headers = new Headers(init.headers || {})
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const token = getStoredToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(url, { ...init, headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi kết nối mạng đến máy chủ'
    throw new ApiError(0, message)
  }

  if (response.status === 401) {
    clearStoredAuth()
    if (onUnauthorizedCallback) {
      onUnauthorizedCallback()
    }
  }

  if (!response.ok) {
    let errorBody: BackendErrorBody | null = null
    try {
      errorBody = await response.json() as BackendErrorBody
    } catch {
      // Response was not JSON
    }

    const defaultMessages: Record<number, string> = {
      400: 'Dữ liệu yêu cầu không hợp lệ.',
      401: 'Thông tin đăng nhập không chính xác hoặc phiên làm việc đã hết hạn.',
      403: 'Bạn không có quyền thực hiện thao tác này.',
      404: 'Tài nguyên được yêu cầu không tồn tại.',
      409: 'Xung đột dữ liệu hoặc vi phạm quy tắc nghiệp vụ.',
      500: 'Lỗi hệ thống máy chủ. Vui lòng thử lại sau.',
    }

    const fallbackMessage = defaultMessages[response.status] || `Yêu cầu thất bại (HTTP ${response.status})`
    const message = errorBody?.message || fallbackMessage

    throw new ApiError(response.status, message, errorBody?.errors, errorBody?.path)
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}
