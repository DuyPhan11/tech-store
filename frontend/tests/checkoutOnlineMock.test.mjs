import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let apiClientModule
let checkoutApiModule
let checkoutPageModule
let successPageModule

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;[apiClientModule, checkoutApiModule, checkoutPageModule, successPageModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
    server.ssrLoadModule('/src/lib/api/checkoutApi.ts'),
    server.ssrLoadModule('/src/features/checkout/CheckoutPage.tsx'),
    server.ssrLoadModule('/src/features/checkout/CheckoutSuccessPage.tsx'),
  ])
})

after(async () => server?.close())

test('checkoutApi.checkout sends ONLINE_MOCK with mockPaymentSuccess and surfaces 400 failure', async () => {
  const { checkoutApi } = checkoutApiModule
  const { ApiError } = apiClientModule
  const original = globalThis.fetch
  const calls = []
  let shouldFail = false

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) })
    if (shouldFail) {
      return new globalThis.Response(
        JSON.stringify({ status: 400, message: 'Thanh toán trực tuyến (giả lập) thất bại.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new globalThis.Response(
      JSON.stringify({
        orderId: 12,
        orderCode: 'ORD-MOCK-1',
        status: 'PENDING',
        paymentMethod: 'ONLINE_MOCK',
        paymentStatus: 'PAID',
        finalAmount: 18990000,
        items: [],
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const okRes = await checkoutApi.checkout({
      source: 'BUY_NOW',
      productId: 1,
      quantity: 1,
      branchId: 1,
      paymentMethod: 'ONLINE_MOCK',
      mockPaymentSuccess: true,
      recipientName: 'Nguyễn Văn A',
      recipientPhone: '0901234567',
      shippingAddress: '123 Lê Lợi, TP.HCM',
    })
    assert.equal(okRes.paymentMethod, 'ONLINE_MOCK')
    assert.equal(okRes.paymentStatus, 'PAID')
    assert.equal(calls[0].body.mockPaymentSuccess, true)

    shouldFail = true
    await assert.rejects(
      checkoutApi.checkout({
        source: 'BUY_NOW',
        productId: 1,
        quantity: 1,
        branchId: 1,
        paymentMethod: 'ONLINE_MOCK',
        mockPaymentSuccess: false,
        recipientName: 'Nguyễn Văn A',
        recipientPhone: '0901234567',
        shippingAddress: '123 Lê Lợi, TP.HCM',
      }),
      err => err instanceof ApiError && err.status === 400 && err.message.includes('thất bại')
    )
    assert.equal(calls[1].body.mockPaymentSuccess, false)
  } finally {
    globalThis.fetch = original
  }
})

test('CheckoutPage renders ONLINE_MOCK option and CheckoutSuccessPage renders PAID status', () => {
  const { CheckoutPage } = checkoutPageModule
  const { CheckoutSuccessPage } = successPageModule

  const checkoutHtml = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(CheckoutPage)))
  assert.match(checkoutHtml, /Đang chuẩn bị thông tin thanh toán/)

  const successHtml = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      {
        initialEntries: [{
          pathname: '/checkout/success',
          state: {
            orderCode: 'ORD-MOCK-99',
            customerName: 'Nguyễn Văn A',
            paymentMethod: 'ONLINE_MOCK',
            paymentStatus: 'PAID',
            grandTotal: 18990000,
          },
        }],
      },
      createElement(CheckoutSuccessPage)
    )
  )
  assert.match(successHtml, /Online Mock/)
  assert.match(successHtml, /Đã thanh toán \(PAID\)/)
})
