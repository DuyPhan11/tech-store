import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

// ADR-024 — Áp coupon khi checkout: helper preview, client gửi couponCode, Cart không còn mã hardcode.

let server
let helperModule
let apiClientModule
let checkoutApiModule
let cartModule

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;[helperModule, apiClientModule, checkoutApiModule, cartModule] = await Promise.all([
    server.ssrLoadModule('/src/features/checkout/couponPreview.ts'),
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
    server.ssrLoadModule('/src/lib/api/checkoutApi.ts'),
    server.ssrLoadModule('/src/features/cart/CartPage.tsx'),
  ])
})

after(async () => server?.close())

test('buildPreviewRequest normalizes the code and sends the right items per source', () => {
  const { buildPreviewRequest, normalizeCouponCode } = helperModule
  assert.equal(normalizeCouponCode('  techstore10 '), 'TECHSTORE10')
  assert.equal(normalizeCouponCode(null), '')
  assert.deepEqual(buildPreviewRequest(' giam500k', { source: 'CART', cartItemIds: [12, 15] }),
    { couponCode: 'GIAM500K', source: 'CART', selectedCartItemIds: [12, 15] })
  assert.deepEqual(buildPreviewRequest('TECHSTORE10', { source: 'BUY_NOW', productId: 3, quantity: 2 }),
    { couponCode: 'TECHSTORE10', source: 'BUY_NOW', productId: 3, quantity: 2 })
})

test('couponRejectReason only recognises 400 coupon errors; couponErrorMessage uses the server text', () => {
  const { couponRejectReason, couponErrorMessage } = helperModule
  const { ApiError } = apiClientModule
  const expired = new ApiError(400, 'Mã giảm giá HETHAN2025 đã hết hạn', { reason: 'EXPIRED' })
  assert.equal(couponRejectReason(expired), 'EXPIRED')
  assert.equal(couponErrorMessage(expired), 'Mã giảm giá HETHAN2025 đã hết hạn')
  assert.equal(couponRejectReason(new ApiError(400, 'Chi nhánh tạm ngưng')), null)
  assert.equal(couponRejectReason(new ApiError(409, 'Không đủ hàng', { reason: 'EXPIRED' })), null)
  assert.equal(couponRejectReason(new ApiError(400, 'x', { reason: 'SOMETHING_ELSE' })), null)
  assert.equal(couponRejectReason(new Error('Failed to fetch')), null)
  assert.equal(couponErrorMessage(new Error('Failed to fetch')), 'Không thể kiểm tra mã giảm giá. Vui lòng thử lại.')
})

test('checkoutApi.checkout sends couponCode; a 400 coupon rejection surfaces errors.reason', async () => {
  const { checkoutApi } = checkoutApiModule
  const { ApiError } = apiClientModule
  const original = globalThis.fetch
  const calls = []
  let status = 201
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) })
    const body = status === 201
      ? { orderId: 9, orderCode: 'ORD-1', totalItemsAmount: 18990000, discountAmount: 1899000, finalAmount: 17091000, items: [] }
      : { status: 400, message: 'Mã giảm giá TECHSTORE10 đã hết lượt sử dụng', errors: { reason: 'EXHAUSTED' } }
    return new globalThis.Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  }
  try {
    const request = {
      source: 'CART', selectedCartItemIds: [4], branchId: 1, paymentMethod: 'COD', couponCode: 'TECHSTORE10',
      recipientName: 'A', recipientPhone: '0901234567', shippingAddress: '1 Lê Lợi',
    }
    const res = await checkoutApi.checkout(request)
    assert.equal(res.finalAmount, 17091000)
    assert.equal(calls[0].url, '/api/checkout')
    assert.equal(calls[0].body.couponCode, 'TECHSTORE10')

    status = 400
    await assert.rejects(checkoutApi.checkout(request),
      err => err instanceof ApiError && err.status === 400 && err.errors?.reason === 'EXHAUSTED')
  } finally {
    globalThis.fetch = original
  }
})

test('orderDisplayTotal equals the server final amount: free shipping, never negative', () => {
  const { orderDisplayTotal } = helperModule
  assert.equal(orderDisplayTotal(28990000, 500000), 28490000)
  assert.equal(orderDisplayTotal(18990000, 0), 18990000)
  assert.equal(orderDisplayTotal(300000, 500000), 0)
  assert.equal(orderDisplayTotal(1000000, -5), 1000000)
})

test('CartPage no longer hardcodes TECHSTORE10 in its coupon box', () => {
  const { CartPage } = cartModule
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CartPage)))
  assert.doesNotMatch(html, /TECHSTORE10/)
})
