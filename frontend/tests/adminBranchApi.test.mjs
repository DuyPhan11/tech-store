import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// UC19 — Admin Branches (ADR-020): API client, extractCity, page initial render.

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
    server.ssrLoadModule('/src/lib/api/adminBranchApi.ts'),
    server.ssrLoadModule('/src/features/admin/branches/adminBranchTypes.ts'),
    server.ssrLoadModule('/src/features/admin/branches/AdminBranchesPage.tsx'),
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

const sampleBranch = {
  id: 4, name: 'Chi nhánh Thủ Đức', phone: '028 3333 4444', address: '12 Võ Văn Ngân, TP.HCM',
  status: 'ACTIVE', createdAt: '2026-11-22T10:00:00', updatedAt: '2026-11-22T10:00:00',
}

test('adminBranchApi calls the approved endpoints with correct method and body (no DELETE)', async () => {
  const { adminBranchApi } = apiModule
  const mock = mockFetch((url, init) => {
    if ((init.method ?? 'GET') === 'GET') return { body: [sampleBranch] }
    return { status: init.method === 'POST' ? 201 : 200, body: sampleBranch }
  })
  try {
    const list = await adminBranchApi.listBranches()
    assert.equal(list[0].name, 'Chi nhánh Thủ Đức')
    await adminBranchApi.createBranch({ name: 'Chi nhánh Thủ Đức', phone: null, address: '12 Võ Văn Ngân, TP.HCM' })
    await adminBranchApi.updateBranch(4, { name: 'CN Thủ Đức', phone: '028 3333 4444', address: '12 Võ Văn Ngân, TP.HCM' })
    await adminBranchApi.updateStatus(4, 'INACTIVE')

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/branches'],
      ['POST', '/api/admin/branches'],
      ['PUT', '/api/admin/branches/4'],
      ['PATCH', '/api/admin/branches/4/status'],
    ])
    assert.deepEqual(mock.calls[1].body, { name: 'Chi nhánh Thủ Đức', phone: null, address: '12 Võ Văn Ngân, TP.HCM' })
    assert.deepEqual(mock.calls[3].body, { status: 'INACTIVE' })
    assert.ok(!mock.calls.some(c => c.method === 'DELETE'), 'UC19 không có DELETE (ADR-020)')
  } finally {
    mock.restore()
  }
})

test('adminBranchApi surfaces 409 open orders, 400 field errors and 403 as ApiError', async () => {
  const { adminBranchApi } = apiModule
  const { ApiError } = apiClientModule
  const cases = [
    [409, { status: 409, message: 'Chi nhánh còn 2 đơn hàng chưa hoàn tất' }, () => adminBranchApi.updateStatus(1, 'INACTIVE'),
      err => /chưa hoàn tất/.test(err.message)],
    [400, { status: 400, message: 'Dữ liệu gửi lên không hợp lệ', errors: { phone: 'Sai' } },
      () => adminBranchApi.createBranch({ name: 'X', phone: 'abc', address: 'Y' }), err => err.errors?.phone === 'Sai'],
    [403, { status: 403, message: 'Bạn không có quyền truy cập tài nguyên này' }, () => adminBranchApi.listBranches(),
      err => err.status === 403],
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

test('extractCity returns the trimmed part after the last comma, or an em dash', () => {
  const { extractCity, PHONE_PATTERN } = typesModule
  assert.equal(extractCity('123 Lê Lợi, Quận 1, TP.HCM'), 'TP.HCM')
  assert.equal(extractCity('45 Cầu Giấy, Phường Dịch Vọng,   Hà Nội  '), 'Hà Nội')
  assert.equal(extractCity('78 Nguyễn Văn Linh Đà Nẵng'), '—')
  assert.equal(extractCity('12 Võ Văn Ngân, '), '—')
  assert.equal(extractCity(''), '—')
  assert.equal(extractCity(null), '—')

  assert.ok(PHONE_PATTERN.test('(028) 1234 5678'))
  assert.ok(PHONE_PATTERN.test('+84 901-234-567'))
  assert.ok(!PHONE_PATTERN.test('1234'))
  assert.ok(!PHONE_PATTERN.test('hotline 0901'))
})

test('AdminBranchesPage starts in a loading state without mock data or the manager column', () => {
  const { AdminBranchesPage } = pageModule
  const html = renderToStaticMarkup(createElement(AdminBranchesPage))
  assert.match(html, /Quản lý chi nhánh cửa hàng/)
  assert.match(html, /Đang tải danh sách chi nhánh/)
  assert.match(html, /Tỉnh \/ Thành phố/)
  assert.doesNotMatch(html, /Quản lý chi nhánh<\/th>/)
  assert.doesNotMatch(html, /Minh Anh|Cầu Giấy \(Hà Nội\)/)
  assert.match(html, /<button[^>]*disabled=""[^>]*>\+ Thêm chi nhánh/)
  assert.match(html, /Vùng nội dung/)
})
