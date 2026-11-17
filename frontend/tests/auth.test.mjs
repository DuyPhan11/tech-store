import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router'
import { createServer } from 'vite'

let server
let authApiModule
let authStorageModule
let authContextModule
let routeGuardModule
let loginPageModule
let layoutModule
let registerPageModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  const [apiMod, storageMod, contextMod, guardMod, loginMod, custLayoutMod, regMod] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/authApi.ts'),
    server.ssrLoadModule('/src/features/auth/authStorage.ts'),
    server.ssrLoadModule('/src/features/auth/AuthContext.tsx'),
    server.ssrLoadModule('/src/features/auth/RouteGuard.tsx'),
    server.ssrLoadModule('/src/features/auth/LoginPage.tsx'),
    server.ssrLoadModule('/src/components/layout/CustomerLayout.tsx'),
    server.ssrLoadModule('/src/features/auth/RegisterPage.tsx'),
  ])

  authApiModule = apiMod
  authStorageModule = storageMod
  authContextModule = contextMod
  routeGuardModule = guardMod
  loginPageModule = loginMod
  layoutModule = custLayoutMod
  registerPageModule = regMod
})

after(async () => server?.close())

beforeEach(() => {
  authStorageModule.clearStoredAuth()
})

test('authStorage stores, retrieves, and clears token and user profile', () => {
  const { getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearStoredAuth } = authStorageModule

  assert.equal(getStoredToken(), null)
  assert.equal(getStoredUser(), null)

  const mockUser = {
    id: 1,
    email: 'customer@techstore.vn',
    phone: '0903456789',
    fullName: 'Demo Customer',
    status: 'ACTIVE',
    roles: ['ROLE_CUSTOMER'],
  }

  setStoredToken('mock-jwt-token')
  setStoredUser(mockUser)

  assert.equal(getStoredToken(), 'mock-jwt-token')
  assert.deepEqual(getStoredUser(), mockUser)

  clearStoredAuth()
  assert.equal(getStoredToken(), null)
  assert.equal(getStoredUser(), null)
})

test('authApi.login sends POST to /api/auth/login and parses successful 200 response', async () => {
  const originalFetch = globalThis.fetch
  let interceptedUrl = ''
  let interceptedMethod = ''
  let interceptedBody = ''

  globalThis.fetch = async (url, options) => {
    interceptedUrl = String(url)
    interceptedMethod = options.method
    interceptedBody = String(options.body)

    return new globalThis.Response(JSON.stringify({
      accessToken: 'jwt-access-token-xyz',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 10,
        email: 'customer@techstore.vn',
        phone: '0903456789',
        fullName: 'Demo Customer',
        status: 'ACTIVE',
        roles: ['ROLE_CUSTOMER'],
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const response = await authApiModule.authApi.login({
      identifier: 'customer@techstore.vn',
      password: 'Customer@123456',
    })

    assert.equal(interceptedUrl, '/api/auth/login')
    assert.equal(interceptedMethod, 'POST')
    assert.equal(JSON.parse(interceptedBody).identifier, 'customer@techstore.vn')
    assert.equal(response.accessToken, 'jwt-access-token-xyz')
    assert.equal(response.user.email, 'customer@techstore.vn')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('authApi.login rejects with ApiError (401) on invalid credentials', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new globalThis.Response(JSON.stringify({
    timestamp: '2026-11-15T22:00:00Z',
    status: 401,
    error: 'Unauthorized',
    message: 'Thông tin đăng nhập không chính xác',
    path: '/api/auth/login',
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })

  try {
    await assert.rejects(
      authApiModule.authApi.login({ identifier: 'wrong@techstore.vn', password: 'wrong' }),
      err => {
        assert.equal(err.name, 'ApiError')
        assert.equal(err.status, 401)
        assert.match(err.message, /Thông tin đăng nhập không chính xác/)
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('authApi.login rejects with ApiError (403) on locked account', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new globalThis.Response(JSON.stringify({
    timestamp: '2026-11-15T22:00:00Z',
    status: 403,
    error: 'Forbidden',
    message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
    path: '/api/auth/login',
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })

  try {
    await assert.rejects(
      authApiModule.authApi.login({ identifier: 'locked@techstore.vn', password: 'pass' }),
      err => {
        assert.equal(err.name, 'ApiError')
        assert.equal(err.status, 403)
        assert.match(err.message, /Tài khoản của bạn đã bị khóa/)
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiFetch triggers unauthorized handler and clears token on 401 response', async () => {
  const { setStoredToken, getStoredToken } = authStorageModule
  const { apiFetch, setUnauthorizedHandler } = await server.ssrLoadModule('/src/lib/api/apiClient.ts')

  setStoredToken('expired-token')
  let handlerTriggered = false
  setUnauthorizedHandler(() => {
    handlerTriggered = true
  })

  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new globalThis.Response(JSON.stringify({
    status: 401,
    message: 'Token hết hạn',
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  })

  try {
    await assert.rejects(apiFetch('/any-endpoint'), { status: 401 })
    assert.equal(handlerTriggered, true)
    assert.equal(getStoredToken(), null)
  } finally {
    globalThis.fetch = originalFetch
    setUnauthorizedHandler(null)
  }
})

test('LoginPage renders title, email/phone input, password input, and demo accounts', () => {
  const { LoginPage } = loginPageModule
  const { AuthProvider } = authContextModule

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/login'] },
      createElement(
        AuthProvider,
        null,
        createElement(LoginPage),
      ),
    ),
  )

  assert.match(html, /<h1[^>]*>Đăng nhập<\/h1>/)
  assert.match(html, /Email hoặc số điện thoại/)
  assert.match(html, /type="text"[^>]*name="identifier"/)
  assert.match(html, /Mật khẩu/)
  assert.match(html, /type="password"[^>]*name="password"/)
  assert.match(html, /Tài khoản Demo thử nghiệm/)
  assert.match(html, /Khách hàng/)
  assert.match(html, /Nhân viên/)
  assert.match(html, /Quản trị viên/)
  assert.match(html, /Bị khóa \(403\)/)
})

test('ProtectedRoute renders 403 ForbiddenPage when customer tries to access staff/admin area', () => {
  const { ProtectedRoute } = routeGuardModule
  const { AuthProvider } = authContextModule

  const customerUser = {
    id: 1,
    email: 'customer@techstore.vn',
    phone: '0903456789',
    fullName: 'Demo Customer',
    status: 'ACTIVE',
    roles: ['ROLE_CUSTOMER'],
  }

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/admin'] },
      createElement(
        AuthProvider,
        { initialUser: customerUser, initialToken: 'valid-customer-token' },
        createElement(
          ProtectedRoute,
          { allowedRoles: ['ROLE_ADMIN', 'ROLE_STAFF'] },
          createElement('div', null, 'Bí mật quản trị'),
        ),
      ),
    ),
  )

  assert.match(html, /403 — Không có quyền truy cập/)
  assert.match(html, /Bạn không có quyền truy cập vào trang này/)
  assert.doesNotMatch(html, /Bí mật quản trị/)
})

test('ProtectedRoute permits access when user has ROLE_ADMIN', () => {
  const { ProtectedRoute } = routeGuardModule
  const { AuthProvider } = authContextModule

  const adminUser = {
    id: 99,
    email: 'admin@techstore.vn',
    phone: '0901234567',
    fullName: 'Minh Anh',
    status: 'ACTIVE',
    roles: ['ROLE_ADMIN'],
  }

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/admin'] },
      createElement(
        AuthProvider,
        { initialUser: adminUser, initialToken: 'valid-admin-token' },
        createElement(
          ProtectedRoute,
          { allowedRoles: ['ROLE_STAFF'] },
          createElement('div', null, 'Nội dung quản trị được duyệt'),
        ),
      ),
    ),
  )

  assert.match(html, /Nội dung quản trị được duyệt/)
  assert.doesNotMatch(html, /403 — Không có quyền truy cập/)
})

test('ProtectedRoute redirects unauthenticated guest to login with redirect parameter', () => {
  const { ProtectedRoute } = routeGuardModule
  const { AuthProvider } = authContextModule

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/admin'] },
      createElement(
        AuthProvider,
        { initialUser: null, initialToken: null },
        createElement(
          Routes,
          null,
          createElement(
            Route,
            {
              path: '/admin',
              element: createElement(
                ProtectedRoute,
                { allowedRoles: ['ROLE_ADMIN'] },
                createElement('div', null, 'Nội dung bí mật'),
              ),
            },
          ),
          createElement(Route, { path: '/login', element: createElement('div', null, 'Trang đăng nhập đích') }),
        ),
      ),
    ),
  )

  // Navigate component in static rendering will either redirect or suppress protected content
  assert.doesNotMatch(html, /Nội dung bí mật/)
})

test('GuestRoute redirects authenticated customer away from login, ignoring admin redirect param', () => {
  const { GuestRoute } = routeGuardModule
  const { AuthProvider } = authContextModule

  const customerUser = {
    id: 1,
    email: 'customer@techstore.vn',
    phone: '0903456789',
    fullName: 'Demo Customer',
    status: 'ACTIVE',
    roles: ['ROLE_CUSTOMER'],
  }

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/login?redirect=%2Fadmin'] },
      createElement(
        AuthProvider,
        { initialUser: customerUser, initialToken: 'valid-token' },
        createElement(
          GuestRoute,
          null,
          createElement('div', null, 'Form đăng nhập chỉ dành cho khách'),
        ),
      ),
    ),
  )

  assert.doesNotMatch(html, /Form đăng nhập chỉ dành cho khách/)
})

test('CustomerLayout displays authenticated user fullName in account area', () => {
  const { CustomerLayout } = layoutModule
  const { AuthProvider } = authContextModule

  const customerUser = {
    id: 1,
    email: 'customer@techstore.vn',
    phone: '0903456789',
    fullName: 'Nguyễn Văn A',
    status: 'ACTIVE',
    roles: ['ROLE_CUSTOMER'],
  }

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/'] },
      createElement(
        AuthProvider,
        { initialUser: customerUser, initialToken: 'valid-token' },
        createElement(CustomerLayout, null, createElement('div', null, 'Trang chủ')),
      ),
    ),
  )

  assert.match(html, /Nguyễn Văn A/)
})

test('authApi.requestRegisterOtp sends POST to /api/auth/register/request-otp', async () => {
  const originalFetch = globalThis.fetch
  let interceptedUrl = ''
  let interceptedMethod = ''
  let interceptedBody = ''

  globalThis.fetch = async (url, options) => {
    interceptedUrl = String(url)
    interceptedMethod = options.method
    interceptedBody = String(options.body)

    return new globalThis.Response(JSON.stringify({
      message: 'Mã xác thực OTP đã được gửi đến email (hiệu lực 5 phút)',
      email: 'newuser@example.com',
      expiresInSeconds: 300,
      resendCooldownSeconds: 60,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await authApiModule.authApi.requestRegisterOtp({ email: 'newuser@example.com' })
    assert.equal(interceptedUrl, '/api/auth/register/request-otp')
    assert.equal(interceptedMethod, 'POST')
    assert.equal(JSON.parse(interceptedBody).email, 'newuser@example.com')
    assert.equal(res.expiresInSeconds, 300)
    assert.equal(res.resendCooldownSeconds, 60)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('authApi.register sends POST to /api/auth/register/verify-otp and returns auth response', async () => {
  const originalFetch = globalThis.fetch
  let interceptedUrl = ''
  let interceptedMethod = ''
  let interceptedBody = ''

  globalThis.fetch = async (url, options) => {
    interceptedUrl = String(url)
    interceptedMethod = options.method
    interceptedBody = String(options.body)

    return new globalThis.Response(JSON.stringify({
      accessToken: 'jwt-new-user-token',
      tokenType: 'Bearer',
      expiresIn: 86400,
      user: {
        id: 15,
        email: 'newuser@example.com',
        phone: '0912345678',
        fullName: 'Nguyễn Văn B',
        status: 'ACTIVE',
        roles: ['ROLE_CUSTOMER'],
      },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await authApiModule.authApi.register({
      email: 'newuser@example.com',
      otp: '123456',
      fullName: 'Nguyễn Văn B',
      phone: '0912345678',
      password: 'Password@123',
    })
    assert.equal(interceptedUrl, '/api/auth/register/verify-otp')
    assert.equal(interceptedMethod, 'POST')
    const body = JSON.parse(interceptedBody)
    assert.equal(body.email, 'newuser@example.com')
    assert.equal(body.otp, '123456')
    assert.equal(body.fullName, 'Nguyễn Văn B')
    assert.equal(res.accessToken, 'jwt-new-user-token')
    assert.equal(res.user.roles[0], 'ROLE_CUSTOMER')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('RegisterPage renders required fields including OTP and send OTP button', () => {
  const { RegisterPage } = registerPageModule
  const { AuthProvider } = authContextModule

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/register'] },
      createElement(
        AuthProvider,
        null,
        createElement(RegisterPage),
      ),
    ),
  )

  assert.match(html, /<h1[^>]*>Tạo tài khoản khách hàng mới<\/h1>/)
  assert.match(html, /Họ &amp; tên đệm/)
  assert.match(html, /id="reg-lastname"/)
  assert.match(html, /id="reg-firstname"/)
  assert.match(html, /id="reg-email"/)
  assert.match(html, /id="reg-phone"/)
  assert.match(html, /id="reg-otp"/)
  assert.match(html, /Gửi mã OTP/)
  assert.match(html, /id="reg-password"/)
  assert.match(html, /id="reg-confirm"/)
  assert.match(html, /Tạo tài khoản/)
})
