import type { AuthUser } from './authTypes'

const TOKEN_KEY = 'tech_store_token'
const USER_KEY = 'tech_store_user'

function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

let inMemoryToken: string | null = null
let inMemoryUser: AuthUser | null = null

export function getStoredToken(): string | null {
  if (isStorageAvailable()) {
    try {
      return window.localStorage.getItem(TOKEN_KEY)
    } catch {
      return inMemoryToken
    }
  }
  return inMemoryToken
}

export function setStoredToken(token: string): void {
  inMemoryToken = token
  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token)
    } catch {
      // Ignore write errors in restricted storage environments
    }
  }
}

export function removeStoredToken(): void {
  inMemoryToken = null
  if (isStorageAvailable()) {
    try {
      window.localStorage.removeItem(TOKEN_KEY)
    } catch {
      // Ignore remove errors
    }
  }
}

export function getStoredUser(): AuthUser | null {
  if (isStorageAvailable()) {
    try {
      const raw = window.localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) as AuthUser : null
    } catch {
      return inMemoryUser
    }
  }
  return inMemoryUser
}

export function setStoredUser(user: AuthUser): void {
  inMemoryUser = user
  if (isStorageAvailable()) {
    try {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user))
    } catch {
      // Ignore write errors
    }
  }
}

export function removeStoredUser(): void {
  inMemoryUser = null
  if (isStorageAvailable()) {
    try {
      window.localStorage.removeItem(USER_KEY)
    } catch {
      // Ignore remove errors
    }
  }
}

export function clearStoredAuth(): void {
  removeStoredToken()
  removeStoredUser()
}
