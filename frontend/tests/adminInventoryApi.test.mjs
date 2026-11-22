import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// UC18 — Admin Inventory (ADR-021): API client, stockLevel, page initial render.

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
    server.ssrLoadModule('/src/lib/api/adminInventoryApi.ts'),
    server.ssrLoadModule('/src/features/admin/inventory/adminInventoryTypes.ts'),
    server.ssrLoadModule('/src/features/admin/inventory/AdminInventoryPage.tsx'),
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

const sampleItem = {
  inventoryId: 3, productId: 1, productName: 'Laptop Nova 14', sku: 'LAP-NOV-14',
  branchId: 1, branchName: 'Chi nhánh Quận 1', branchStatus: 'ACTIVE',
  quantity: 8, minStockAlert: 5, updatedAt: '2026-11-22T10:00:00',
}

test('adminInventoryApi calls the approved endpoints with query params and bodies', async () => {
  const { adminInventoryApi } = apiModule
  const mock = mockFetch((url, init) => {
    if ((init.method ?? 'GET') === 'GET') return { body: url.includes('/branches') ? [{ id: 1, name: 'Q1', status: 'ACTIVE' }] : [sampleItem] }
    if (url.endsWith('/transfer')) return { body: { from: sampleItem, to: { ...sampleItem, branchId: 2 } } }
    return { body: sampleItem }
  })
  try {
    await adminInventoryApi.listInventories()
    await adminInventoryApi.listInventories({ branchId: 2, q: '  nova 14 ' })
    await adminInventoryApi.listInventories({ branchId: null, q: '   ' })
    const branches = await adminInventoryApi.listBranches()
    assert.equal(branches[0].status, 'ACTIVE')
    await adminInventoryApi.adjust({ productId: 1, branchId: 1, type: 'SET', quantity: 0, reason: null })
    const result = await adminInventoryApi.transfer({ productId: 1, fromBranchId: 1, toBranchId: 2, quantity: 3 })
    assert.equal(result.to.branchId, 2)

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/inventories'],
      ['GET', '/api/admin/inventories?branchId=2&q=nova+14'],
      ['GET', '/api/admin/inventories'],
      ['GET', '/api/admin/inventories/branches'],
      ['POST', '/api/admin/inventories/adjust'],
      ['POST', '/api/admin/inventories/transfer'],
    ])
    assert.deepEqual(mock.calls[4].body, { productId: 1, branchId: 1, type: 'SET', quantity: 0, reason: null })
    assert.deepEqual(mock.calls[5].body, { productId: 1, fromBranchId: 1, toBranchId: 2, quantity: 3 })
  } finally {
    mock.restore()
  }
})

test('adminInventoryApi surfaces 409 shortage, 400 validation and 403 as ApiError', async () => {
  const { adminInventoryApi } = apiModule
  const { ApiError } = apiClientModule
  const cases = [
    [409, { status: 409, message: 'Không đủ hàng: Laptop Nova 14 tại Q1 chỉ còn 2, yêu cầu 3' },
      () => adminInventoryApi.adjust({ productId: 1, branchId: 1, type: 'OUTBOUND', quantity: 3 }), err => /Không đủ hàng/.test(err.message)],
    [400, { status: 400, message: 'Chi nhánh xuất và chi nhánh nhận phải khác nhau' },
      () => adminInventoryApi.transfer({ productId: 1, fromBranchId: 1, toBranchId: 1, quantity: 1 }), err => /khác nhau/.test(err.message)],
    [403, { status: 403, message: 'Bạn không có quyền truy cập tài nguyên này' },
      () => adminInventoryApi.listInventories(), err => err.status === 403],
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

test('stockLevel maps quantity against the min-stock threshold', () => {
  const { stockLevel } = typesModule
  assert.equal(stockLevel(0, 5), 'OUT_OF_STOCK')
  assert.equal(stockLevel(1, 5), 'LOW_STOCK')
  assert.equal(stockLevel(5, 5), 'LOW_STOCK')
  assert.equal(stockLevel(6, 5), 'IN_STOCK')
  assert.equal(stockLevel(3, 0), 'IN_STOCK')
})

test('AdminInventoryPage starts in a loading state without mock data', () => {
  const { AdminInventoryPage } = pageModule
  const html = renderToStaticMarkup(createElement(AdminInventoryPage))
  assert.match(html, /Quản lý kho hàng &amp; Tồn kho/)
  assert.match(html, /Điều chuyển kho/)
  assert.match(html, /Điều chỉnh tồn kho/)
  assert.match(html, /Đang tải dữ liệu tồn kho/)
  assert.doesNotMatch(html, /MSI-PRO-16|Cầu Giấy \(Hà Nội\)/)
  assert.match(html, /Vùng nội dung/)
})
