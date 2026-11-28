import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'
import { authApi } from '../../lib/api/authApi'
import { setUnauthorizedHandler } from '../../lib/api/apiClient'
import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './authStorage'
import type { AuthContextValue, AuthUser, LoginRequest, LoginResponse } from './authTypes'

const defaultAuthContextValue: AuthContextValue = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isAdmin: false,
  isStaff: false,
  isCustomer: false,
  hasRole: () => false,
  login: async () => {
    throw new Error('AuthProvider is missing in component tree')
  },
  logout: () => {},
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps extends PropsWithChildren {
  initialUser?: AuthUser | null
  initialToken?: string | null
}

export function AuthProvider({ children, initialUser, initialToken }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(() => {
    if (initialToken !== undefined) return initialToken
    return getStoredToken()
  })

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (initialUser !== undefined) return initialUser
    return getStoredUser()
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const logout = useCallback(() => {
    clearStoredAuth()
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      setStoredUser(next)
      return next
    })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [logout])

  const login = useCallback(async (credentials: LoginRequest): Promise<LoginResponse> => {
    setIsLoading(true)
    try {
      const response = await authApi.login(credentials)
      setStoredToken(response.accessToken)
      setStoredUser(response.user)
      setToken(response.accessToken)
      setUser(response.user)
      return response
    } finally {
      setIsLoading(false)
    }
  }, [])

  const roles = useMemo(() => user?.roles ?? [], [user?.roles])
  const isAdmin = roles.includes('ROLE_ADMIN')
  const isStaff = roles.includes('ROLE_STAFF') || isAdmin
  const isCustomer = roles.includes('ROLE_CUSTOMER')
  const isAuthenticated = Boolean(token && user)

  const hasRole = useCallback((role: string) => roles.includes(role), [roles])

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      isAdmin,
      isStaff,
      isCustomer,
      hasRole,
      login,
      logout,
      updateUser,
    }),
    [user, token, isAuthenticated, isLoading, isAdmin, isStaff, isCustomer, hasRole, login, logout, updateUser],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  return context ?? defaultAuthContextValue
}

export function useHasAuthProvider(): boolean {
  return useContext(AuthContext) !== null
}
