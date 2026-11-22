import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// UC14 — Admin Orders (ADR-023): API client, helpers, page initial render.

let server
let apiModule
let typesModule
let pageModule
let apiClientModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  ;[apiModule, typesModule, pageModule, apiClientModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/adminOrderApi.ts'),
    server.ssrLoadModule('/src/features/admin/orders/adminOrderTypes.ts'),
    server.ssrLoadModule('/src/features/admin/orders/AdminOrdersPage.tsx'),
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
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

const sampleOrder = {
  id: 7, orderCode: 'ORD-20261122-ABC123', status: 'PENDING', statusLabel: 'Chờ xác nhận',
  paymentMethod: 'COD', paymentStatus: 'UNPAID', paymentStatusLabel: 'Chưa thanh toán',
  recipientName: 'Nguyễn Văn A', recipientPhone: '0901234567', shippingAddress: '1 Lê Lợi',
  branchId: 1, branchName: 'Chi nhánh Quận 1', totalItemsAmount: 18990000, discountAmount: 0, finalAmount: 18990000,
  canCancel: true, items: [], createdAt: '2026-11-22T14:05:00', updatedAt: '2026-11-22T14:05:00',
  customer: { id: 3, fullName: 'Khách hàng Thử nghiệm', email: 'customer@techstore.vn', phone: '0903456789' },
  payment: { method: 'COD', status: 'UNPAID', transactionCode: 'COD-ORD', amount: 18990000, paidAt: null, refundedAt: null },
}

const samplePage = {
  items: [sampleOrder], page: 0, size: 20, totalElements: 1, totalPages: 1,
  counts: { ALL: 1, PENDING: 1, CONFIRMED: 0, SHIPPING: 0, COMPLETED: 0, CANCELLED: 0 },
}

test('adminOrderApi calls the approved endpoints with query params and bodies', async () => {
  const { adminOrderApi } = apiModule
  const mock = mockFetch(url => ({ body: url.includes('/status') || /orders\/\d+$/.test(url) ? sampleOrder : samplePage }))
  try {
    const page = await adminOrderApi.list()
    assert.equal(page.counts.PENDING, 1)
    await adminOrderApi.list({ status: 'SHIPPING', q: '  0901 234 ', page: 2, size: 20 })
    await adminOrderApi.list({ status: null, q: '   ', page: 0 })
    await adminOrderApi.get(7)
    await adminOrderApi.updateStatus(7, 'CONFIRMED')
    await adminOrderApi.updateStatus(7, 'CANCELLED', 'Khách gọi điện hủy')

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/orders'],
      ['GET', '/api/admin/orders?status=SHIPPING&q=0901+234&page=2&size=20'],
      ['GET', '/api/admin/orders'],
      ['GET', '/api/admin/orders/7'],
      ['PATCH', '/api/admin/orders/7/status'],
      ['PATCH', '/api/admin/orders/7/status'],
    ])
    assert.deepEqual(mock.calls[4].body, { status: 'CONFIRMED', reason: null })
    assert.deepEqual(mock.calls[5].body, { status: 'CANCELLED', reason: 'Khách gọi điện hủy' })
  } finally {
    mock.restore()
  }
})

test('adminOrderApi surfaces 409 transition conflicts, 400 validation and 403 as ApiError', async () => {
  const { adminOrderApi } = apiModule
  const { ApiError } = apiClientModule
  const cases = [
    [409, { status: 409, message: 'Không thể chuyển đơn ORD-1 từ "Đang giao hàng" sang "Đã hủy"' },
      () => adminOrderApi.updateStatus(7, 'CANCELLED', 'x'), err => /Không thể chuyển/.test(err.message)],
    [400, { status: 400, message: 'Vui lòng nhập lý do hủy đơn' },
      () => adminOrderApi.updateStatus(7, 'CANCELLED'), err => /lý do/.test(err.message)],
    [403, { status: 403, message: 'Bạn không có quyền truy cập tài nguyên này' },
      () => adminOrderApi.list(), err => err.status === 403],
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

test('nextActions follows the approved status flow; formatDateTime keeps server time', () => {
  const { nextActions, formatDateTime, ORDER_STATUSES, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } = typesModule
  assert.deepEqual(nextActions('PENDING'), { next: 'CONFIRMED', canCancel: true })
  assert.deepEqual(nextActions('CONFIRMED'), { next: 'SHIPPING', canCancel: true })
  assert.deepEqual(nextActions('SHIPPING'), { next: 'COMPLETED', canCancel: false })
  assert.deepEqual(nextActions('COMPLETED'), { next: null, canCancel: false })
  assert.deepEqual(nextActions('CANCELLED'), { next: null, canCancel: false })
  for (const s of ORDER_STATUSES) assert.ok(ORDER_STATUS_LABELS[s])
  assert.equal(PAYMENT_STATUS_LABELS.REFUNDED, 'Đã hoàn tiền')
  assert.equal(formatDateTime('2026-11-22T14:05:59.123'), '22/11/2026 14:05')
  assert.equal(formatDateTime(null), '—')
})

test('AdminOrdersPage starts in a loading state without mock data', () => {
  const { AdminOrdersPage } = pageModule
  const html = renderToStaticMarkup(createElement(AdminOrdersPage))
  assert.match(html, /Quản lý đơn hàng \(Orders\)/)
  assert.match(html, /Đang tải danh sách đơn hàng/)
  assert.match(html, /Tất cả \(0\)/)
  assert.match(html, /Chờ xác nhận \(0\)/)
  assert.doesNotMatch(html, /TS-100245/)
  assert.match(html, /Vùng nội dung/)
})
