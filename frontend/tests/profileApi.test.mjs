import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let profileApiModule
let accountPageModule
let authContextModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  const [apiMod, pageMod, authMod] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/profileApi.ts'),
    server.ssrLoadModule('/src/features/account/UserAccountPage.tsx'),
    server.ssrLoadModule('/src/features/auth/AuthContext.tsx'),
  ])

  profileApiModule = apiMod
  accountPageModule = pageMod
  authContextModule = authMod
})

after(async () => server?.close())

test('profileApi.getProfile calls GET /api/me', async () => {
  const { profileApi } = profileApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify({
      id: 1,
      email: 'customer@techstore.vn',
      fullName: 'Customer One',
      phone: '0901234567',
      roles: ['ROLE_CUSTOMER'],
      status: 'ACTIVE',
      defaultAddress: null,
      createdAt: '2026-11-17T00:00:00',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await profileApi.getProfile()
    assert.match(requestedUrl, /\/api\/me$/)
    assert.equal(requestedMethod, 'GET')
    assert.equal(res.email, 'customer@techstore.vn')
    assert.equal(res.fullName, 'Customer One')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('profileApi.updateProfile calls PATCH /api/me', async () => {
  const { profileApi } = profileApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''
  let requestBody = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    requestBody = String(init?.body ?? '')
    return new Response(JSON.stringify({
      id: 1,
      email: 'customer@techstore.vn',
      fullName: 'New Name',
      phone: '0912345678',
      roles: ['ROLE_CUSTOMER'],
      status: 'ACTIVE',
      defaultAddress: null,
      createdAt: '2026-11-17T00:00:00',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await profileApi.updateProfile({ fullName: 'New Name', phone: '0912345678' })
    assert.match(requestedUrl, /\/api\/me$/)
    assert.equal(requestedMethod, 'PATCH')
    assert.match(requestBody, /"fullName":"New Name"/)
    assert.equal(res.fullName, 'New Name')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('profileApi.changePassword calls POST /api/me/change-password', async () => {
  const { profileApi } = profileApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''
  let requestBody = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    requestBody = String(init?.body ?? '')
    return new Response(JSON.stringify({
      message: 'Mật khẩu đã được thay đổi thành công',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await profileApi.changePassword({ oldPassword: 'Old@123', newPassword: 'New@123' })
    assert.match(requestedUrl, /\/api\/me\/change-password$/)
    assert.equal(requestedMethod, 'POST')
    assert.match(requestBody, /"newPassword":"New@123"/)
    assert.equal(res.message, 'Mật khẩu đã được thay đổi thành công')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('profileApi.getAddresses calls GET /api/me/addresses', async () => {
  const { profileApi } = profileApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify([
      {
        id: 10,
        recipientName: 'Khách A',
        phone: '0901234567',
        streetAddress: '123 Lê Lợi',
        city: 'TP. HCM',
        fullAddress: '123 Lê Lợi, TP. HCM',
        isDefault: true,
      },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await profileApi.getAddresses()
    assert.match(requestedUrl, /\/api\/me\/addresses$/)
    assert.equal(requestedMethod, 'GET')
    assert.equal(res.length, 1)
    assert.equal(res[0].recipientName, 'Khách A')
    assert.equal(res[0].isDefault, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('profileApi.addAddress calls POST /api/me/addresses', async () => {
  const { profileApi } = profileApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify({
      id: 11,
      recipientName: 'Khách Mới',
      phone: '0909999999',
      streetAddress: '456 Hai Bà Trưng',
      city: 'TP. HCM',
      fullAddress: '456 Hai Bà Trưng, TP. HCM',
      isDefault: false,
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await profileApi.addAddress({
      recipientName: 'Khách Mới',
      phone: '0909999999',
      streetAddress: '456 Hai Bà Trưng',
      city: 'TP. HCM',
    })
    assert.match(requestedUrl, /\/api\/me\/addresses$/)
    assert.equal(requestedMethod, 'POST')
    assert.equal(res.id, 11)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('UserAccountPage renders without throwing', () => {
  const { UserAccountPage } = accountPageModule
  const { AuthProvider } = authContextModule

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/profile'] },
      createElement(AuthProvider, null, createElement(UserAccountPage, null))
    )
  )

  assert.match(html, /Bảng điều khiển tài khoản/)
  assert.match(html, /Thông tin tài khoản/)
  assert.match(html, /Sổ địa chỉ/)
})
