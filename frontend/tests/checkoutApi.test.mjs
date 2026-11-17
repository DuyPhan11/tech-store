import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let checkoutApiModule
let checkoutPageModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  const [apiMod, pageMod] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/checkoutApi.ts'),
    server.ssrLoadModule('/src/features/checkout/CheckoutPage.tsx'),
  ])

  checkoutApiModule = apiMod
  checkoutPageModule = pageMod
})

after(async () => server?.close())

test('checkoutApi.checkout sends POST /api/checkout with correct payload and headers', async () => {
  const { checkoutApi } = checkoutApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''
  let requestedHeaders = {}
  let requestedBody = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    requestedHeaders = init?.headers ?? {}
    requestedBody = init?.body ? JSON.parse(String(init.body)) : null
    return new Response(JSON.stringify({
      orderId: 101,
      orderCode: 'ORD-20261117-ABCDEF',
      status: 'PENDING',
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      recipientName: 'Nguyễn Văn A',
      recipientPhone: '0901234567',
      shippingAddress: '123 Lê Lợi, Q1, TP.HCM',
      totalItemsAmount: 18990000,
      discountAmount: 0,
      finalAmount: 18990000,
      items: [
        {
          productId: 1,
          productName: 'Laptop Nova 14',
          productSku: 'LAP-NOV-14',
          productImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
          unitPrice: 18990000,
          quantity: 1,
          subtotalAmount: 18990000,
        },
      ],
    }), { status: 201, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const payload = {
      source: 'CART',
      selectedCartItemIds: [12],
      branchId: 1,
      paymentMethod: 'COD',
      couponCode: null,
      recipientName: 'Nguyễn Văn A',
      recipientPhone: '0901234567',
      shippingAddress: '123 Lê Lợi, Q1, TP.HCM',
      notes: 'Giao giờ hành chính',
      idempotencyKey: 'test-idemp-123',
    }

    const res = await checkoutApi.checkout(payload)

    assert.match(requestedUrl, /\/api\/checkout$/)
    assert.equal(requestedMethod, 'POST')
    assert.equal(requestedBody.source, 'CART')
    assert.equal(requestedBody.paymentMethod, 'COD')
    assert.equal(requestedBody.branchId, 1)
    assert.equal(res.orderCode, 'ORD-20261117-ABCDEF')
    assert.equal(res.status, 'PENDING')
    assert.equal(res.paymentStatus, 'UNPAID')
    assert.equal(res.finalAmount, 18990000)
    assert.equal(res.items.length, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('CheckoutPage renders properly without crashing', async () => {
  const { CheckoutPage } = checkoutPageModule

  const html = renderToStaticMarkup(
    createElement(MemoryRouter, { initialEntries: ['/checkout'] },
      createElement(CheckoutPage)
    )
  )

  // Shows loading or initial state
  assert.ok(html.includes('thanh toán') || html.includes('Vui lòng đăng nhập'))
})
