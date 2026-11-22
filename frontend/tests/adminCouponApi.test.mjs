import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// UC13 — Admin Coupons (ADR-022): API client, helpers, page initial render, checkout preview client.

let server
let apiModule
let typesModule
let pageModule
let apiClientModule
let checkoutModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  ;[apiModule, typesModule, pageModule, apiClientModule, checkoutModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/adminCouponApi.ts'),
    server.ssrLoadModule('/src/features/admin/coupons/adminCouponTypes.ts'),
    server.ssrLoadModule('/src/features/admin/coupons/AdminCouponsPage.tsx'),
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
    server.ssrLoadModule('/src/lib/api/checkoutApi.ts'),
  ])
})

after(async () => server?.close())

function mockFetch(handler) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined })
    const { status = 200, body = {} } = handler(String(url), init)
    return new globalThis.Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { calls, restore: () => { globalThis.fetch = original } }
}

const sampleCoupon = {
  id: 4, code: 'TECHSTORE10', discountType: 'PERCENTAGE', discountValue: 10, minOrderAmount: 0,
  maxDiscountAmount: 2000000, usageLimit: 100, usedCount: 0, startDate: '2026-01-01T00:00:00',
  endDate: '2027-12-31T23:59:59', active: true, displayStatus: 'ACTIVE',
  createdAt: '2026-11-22T10:00:00', updatedAt: '2026-11-22T10:00:00',
}

const payload = {
  code: 'GIAM500K', discountType: 'FIXED_AMOUNT', discountValue: 500000, minOrderAmount: 10000000,
  maxDiscountAmount: null, usageLimit: 50, startDate: '2026-11-22T00:00:00', endDate: '2026-12-31T23:59:00',
}

test('adminCouponApi calls the approved endpoints with query params and bodies', async () => {
  const { adminCouponApi } = apiModule
  const mock = mockFetch(() => ({ body: sampleCoupon }))
  try {
    await adminCouponApi.list()
    await adminCouponApi.list({ q: '  tech store ', status: 'EXPIRED' })
    await adminCouponApi.list({ q: '   ', status: null })
    await adminCouponApi.get(4)
    await adminCouponApi.create(payload)
    await adminCouponApi.update(4, payload)
    const saved = await adminCouponApi.setActive(4, false)
    assert.equal(saved.code, 'TECHSTORE10')

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/coupons'],
      ['GET', '/api/admin/coupons?q=tech+store&status=EXPIRED'],
      ['GET', '/api/admin/coupons'],
      ['GET', '/api/admin/coupons/4'],
      ['POST', '/api/admin/coupons'],
      ['PUT', '/api/admin/coupons/4'],
      ['PATCH', '/api/admin/coupons/4/status'],
    ])
    assert.deepEqual(mock.calls[4].body, payload)
    assert.deepEqual(mock.calls[5].body, payload)
    assert.deepEqual(mock.calls[6].body, { active: false })
  } finally {
    mock.restore()
  }
})

test('adminCouponApi surfaces 409 conflicts and 400 field errors as ApiError', async () => {
  const { adminCouponApi } = apiModule
  const { ApiError } = apiClientModule
  const cases = [
    [409, { status: 409, message: 'Mã giảm giá GIAM500K đã tồn tại' },
      () => adminCouponApi.create(payload), err => /đã tồn tại/.test(err.message)],
    [409, { status: 409, message: 'Mã TECHSTORE10 đã được sử dụng nên không thể đổi mã, hình thức giảm hoặc giá trị giảm' },
      () => adminCouponApi.update(4, payload), err => /đã được sử dụng/.test(err.message)],
    [400, { status: 400, message: 'Dữ liệu gửi lên không hợp lệ', errors: { code: 'Mã chỉ gồm A-Z' } },
      () => adminCouponApi.create({ ...payload, code: 'a' }), err => err.errors?.code === 'Mã chỉ gồm A-Z'],
    [403, { status: 403, message: 'Bạn không có quyền truy cập tài nguyên này' },
      () => adminCouponApi.list(), err => err.status === 403],
  ]
  for (const [status, body, call, check] of cases) {
    const mock = mockFetch(() => ({ status, body }))
    try {
      await assert.rejects(call(), err => err instanceof ApiError && err.status === status && check(err))
    } finally {
      mock.restore()
    }
  }
})

test('checkoutApi.previewCoupon posts to coupon-preview and exposes errors.reason', async () => {
  const { checkoutApi } = checkoutModule
  const { ApiError } = apiClientModule
  const ok = mockFetch(() => ({ body: { couponCode: 'TECHSTORE10', subtotal: 18990000, discountAmount: 1899000, finalAmount: 17091000 } }))
  try {
    const request = { couponCode: 'TECHSTORE10', source: 'CART', selectedCartItemIds: [12, 15] }
    const result = await checkoutApi.previewCoupon(request)
    assert.equal(result.finalAmount, 17091000)
    assert.deepEqual(ok.calls.map(c => [c.method, c.url]), [['POST', '/api/checkout/coupon-preview']])
    assert.deepEqual(ok.calls[0].body, request)
  } finally {
    ok.restore()
  }
  const bad = mockFetch(() => ({ status: 400, body: { status: 400, message: 'Mã giảm giá HETHAN2025 đã hết hạn', errors: { reason: 'EXPIRED' } } }))
  try {
    await assert.rejects(
      checkoutApi.previewCoupon({ couponCode: 'HETHAN2025', source: 'BUY_NOW', productId: 1, quantity: 1 }),
      err => err instanceof ApiError && err.status === 400 && err.errors?.reason === 'EXPIRED',
    )
  } finally {
    bad.restore()
  }
})

test('coupon helpers format discounts, statuses and datetime-local values', () => {
  const { formatDiscount, DISPLAY_STATUS_LABELS, DISPLAY_STATUSES, isoToLocalInput, localInputToIso, formatDateTime, defaultDateRange } = typesModule
  assert.match(formatDiscount(sampleCoupon), /^Giảm 10% \(tối đa 2\.000\.000\s?₫\)$/)
  assert.equal(formatDiscount({ ...sampleCoupon, maxDiscountAmount: null }), 'Giảm 10%')
  assert.match(formatDiscount({ discountType: 'FIXED_AMOUNT', discountValue: 500000, maxDiscountAmount: null }), /^Giảm 500\.000\s?₫$/)

  assert.deepEqual(DISPLAY_STATUSES.slice().sort(), ['ACTIVE', 'DISABLED', 'EXHAUSTED', 'EXPIRED', 'SCHEDULED'])
  for (const s of DISPLAY_STATUSES) assert.ok(DISPLAY_STATUS_LABELS[s])

  assert.equal(isoToLocalInput('2027-12-31T23:59:59'), '2027-12-31T23:59')
  assert.equal(isoToLocalInput(null), '')
  assert.equal(localInputToIso('2026-12-31T23:59'), '2026-12-31T23:59:00')
  assert.equal(localInputToIso(''), '')
  assert.equal(formatDateTime('2026-01-05T08:30:00'), '05/01/2026 08:30')

  const range = defaultDateRange(new Date(2026, 10, 22, 9, 5))
  assert.equal(range.startDate, '2026-11-22T09:05')
  assert.equal(range.endDate, '2026-12-22T23:59')
})

test('AdminCouponsPage starts in a loading state without mock data', () => {
  const { AdminCouponsPage } = pageModule
  const html = renderToStaticMarkup(createElement(AdminCouponsPage))
  assert.match(html, /Quản lý mã khuyến mãi &amp; Voucher/)
  assert.match(html, /Tạo mã khuyến mãi mới/)
  assert.match(html, /Đang tải danh sách mã khuyến mãi/)
  assert.match(html, /Tất cả trạng thái/)
  assert.doesNotMatch(html, /TECHSTORE10|SUMMER/)
  assert.match(html, /Vùng nội dung/)
})
