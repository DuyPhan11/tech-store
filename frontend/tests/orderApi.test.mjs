import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let orderApiModule
let accountPageModule
let authContextModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  const [apiMod, pageMod, authMod] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/orderApi.ts'),
    server.ssrLoadModule('/src/features/account/UserAccountPage.tsx'),
    server.ssrLoadModule('/src/features/auth/AuthContext.tsx'),
  ])

  orderApiModule = apiMod
  accountPageModule = pageMod
  authContextModule = authMod
})

after(async () => server?.close())

test('orderApi.getMyOrders calls GET /api/orders/me', async () => {
  const { orderApi } = orderApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify([
      {
        id: 101,
        orderCode: 'ORD-20261117-001',
        status: 'PENDING',
        statusLabel: 'Chờ xác nhận',
        paymentMethod: 'COD',
        paymentStatus: 'UNPAID',
        paymentStatusLabel: 'Chưa thanh toán',
        recipientName: 'Khách hàng',
        recipientPhone: '0901234567',
        shippingAddress: '123 Test, Q1',
        totalItemsAmount: 18990000,
        discountAmount: 0,
        finalAmount: 18990000,
        canCancel: true,
        itemSummary: 'Laptop Nova 14 (x1)',
        items: [],
        createdAt: '2026-11-17T12:00:00',
        updatedAt: '2026-11-17T12:00:00',
      }
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const orders = await orderApi.getMyOrders()
    assert.match(requestedUrl, /\/api\/orders\/me$/)
    assert.equal(requestedMethod, 'GET')
    assert.equal(orders.length, 1)
    assert.equal(orders[0].orderCode, 'ORD-20261117-001')
    assert.equal(orders[0].canCancel, true)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('orderApi.getOrderDetail calls GET /api/orders/me/:id', async () => {
  const { orderApi } = orderApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify({
      id: 101,
      orderCode: 'ORD-20261117-001',
      status: 'PENDING',
      statusLabel: 'Chờ xác nhận',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      paymentStatusLabel: 'Chưa thanh toán',
      recipientName: 'Khách hàng',
      recipientPhone: '0901234567',
      shippingAddress: '123 Test, Q1',
      totalItemsAmount: 18990000,
      discountAmount: 0,
      finalAmount: 18990000,
      canCancel: true,
      items: [
        {
          id: 1,
          productId: 1,
          productName: 'Laptop Nova 14',
          productSku: 'LAP-NOV-14',
          unitPrice: 18990000,
          quantity: 1,
          subtotalAmount: 18990000,
        }
      ],
      createdAt: '2026-11-17T12:00:00',
      updatedAt: '2026-11-17T12:00:00',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const detail = await orderApi.getOrderDetail(101)
    assert.match(requestedUrl, /\/api\/orders\/me\/101$/)
    assert.equal(requestedMethod, 'GET')
    assert.equal(detail.id, 101)
    assert.equal(detail.items.length, 1)
    assert.equal(detail.items[0].productName, 'Laptop Nova 14')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('orderApi.cancelOrder calls POST /api/orders/:id/cancel with reason', async () => {
  const { orderApi } = orderApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''
  let requestedBody = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    requestedBody = init?.body ? JSON.parse(init.body) : null
    return new Response(JSON.stringify({
      id: 101,
      orderCode: 'ORD-20261117-001',
      status: 'CANCELLED',
      statusLabel: 'Đã hủy',
      paymentMethod: 'COD',
      paymentStatus: 'CANCELLED',
      paymentStatusLabel: 'Đã hủy thanh toán',
      recipientName: 'Khách hàng',
      recipientPhone: '0901234567',
      shippingAddress: '123 Test, Q1',
      totalItemsAmount: 18990000,
      discountAmount: 0,
      finalAmount: 18990000,
      cancelReason: 'Đổi ý không mua nữa',
      cancelledAt: '2026-11-17T12:30:00',
      canCancel: false,
      items: [],
      createdAt: '2026-11-17T12:00:00',
      updatedAt: '2026-11-17T12:30:00',
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await orderApi.cancelOrder(101, 'Đổi ý không mua nữa')
    assert.match(requestedUrl, /\/api\/orders\/101\/cancel$/)
    assert.equal(requestedMethod, 'POST')
    assert.deepEqual(requestedBody, { cancelReason: 'Đổi ý không mua nữa' })
    assert.equal(res.status, 'CANCELLED')
    assert.equal(res.canCancel, false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('UserAccountPage renders tabs and orders view correctly in SSR markup', async () => {
  const { UserAccountPage } = accountPageModule
  const { AuthProvider } = authContextModule

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/orders'] },
      createElement(
        AuthProvider,
        null,
        createElement(UserAccountPage, null)
      )
    )
  )

  assert.match(html, /Lịch sử đơn hàng của tôi/)
  assert.match(html, /Sổ địa chỉ/)
  assert.match(html, /Thông tin tài khoản/)
})
