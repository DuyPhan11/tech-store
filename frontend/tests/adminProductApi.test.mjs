import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// UC11 — Admin Products (ADR-019): API client multipart, helpers, page initial render.

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
    server.ssrLoadModule('/src/lib/api/adminProductApi.ts'),
    server.ssrLoadModule('/src/features/admin/products/adminProductTypes.ts'),
    server.ssrLoadModule('/src/features/admin/products/AdminProductsPage.tsx'),
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
  ])
})

after(async () => server?.close())

function mockFetch(handler) {
  const original = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body, headers: new globalThis.Headers(init.headers) })
    const { status = 200, body = {} } = handler(String(url), init)
    return new globalThis.Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { calls, restore: () => { globalThis.fetch = original } }
}

const sampleProduct = {
  id: 12, name: 'Laptop Nova 14', slug: 'laptop-nova-14', sku: 'NOVA-14',
  categoryId: 2, categoryName: 'Laptop Gaming', brandId: 1, brandName: 'Nova',
  price: 18990000, costPrice: 15000000, description: null, specifications: [],
  status: 'ACTIVE', totalStock: 3, primaryImageUrl: 'https://res.cloudinary.com/demo/a.png',
  images: [{ id: 31, url: 'https://res.cloudinary.com/demo/a.png', primary: true, displayOrder: 0 }],
  createdAt: '2026-11-22T10:00:00', updatedAt: '2026-11-22T10:00:00',
}

const samplePayload = {
  name: 'Laptop Nova 14', slug: 'laptop-nova-14', sku: 'NOVA-14', categoryId: 2, brandId: 1,
  price: 18990000, costPrice: 15000000, specifications: [{ label: 'CPU', value: 'Core i7' }],
  images: [{ imageId: 31, primary: false }, { fileIndex: 0, primary: true }],
}

test('adminProductApi calls the approved endpoints with correct methods (no DELETE)', async () => {
  const { adminProductApi } = apiModule
  const mock = mockFetch((url, init) => {
    if ((init.method ?? 'GET') === 'GET') return { body: url.endsWith('/products') ? [sampleProduct] : sampleProduct }
    return { status: init.method === 'POST' ? 201 : 200, body: sampleProduct }
  })
  try {
    const list = await adminProductApi.listProducts()
    assert.equal(list[0].sku, 'NOVA-14')
    await adminProductApi.getProduct(12)
    await adminProductApi.createProduct(samplePayload, [new globalThis.Blob([new Uint8Array([0x89, 0x50])], { type: 'image/png' })])
    await adminProductApi.updateProduct(12, samplePayload)
    const updated = await adminProductApi.updateStatus(12, 'INACTIVE')
    assert.equal(updated.id, 12)

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/products'],
      ['GET', '/api/admin/products/12'],
      ['POST', '/api/admin/products'],
      ['PUT', '/api/admin/products/12'],
      ['PATCH', '/api/admin/products/12/status'],
    ])
    assert.equal(mock.calls[4].body, JSON.stringify({ status: 'INACTIVE' }))
    assert.ok(!mock.calls.some(c => c.method === 'DELETE'), 'UC11 không có DELETE (ADR-019)')
  } finally {
    mock.restore()
  }
})

test('create/update send multipart FormData with JSON data part and files; Content-Type left to the browser', async () => {
  const { adminProductApi } = apiModule
  const mock = mockFetch(() => ({ status: 201, body: sampleProduct }))
  try {
    const file = new globalThis.File([new Uint8Array([0xff, 0xd8, 0xff])], 'photo.jpg', { type: 'image/jpeg' })
    await adminProductApi.createProduct(samplePayload, [file])
    const { body, headers } = mock.calls[0]
    assert.ok(body instanceof globalThis.FormData)
    assert.equal(headers.has('Content-Type'), false, 'boundary multipart phải do fetch tự đặt')

    const data = body.get('data')
    assert.equal(data.type, 'application/json')
    assert.deepEqual(JSON.parse(await data.text()), samplePayload)

    const files = body.getAll('files')
    assert.equal(files.length, 1)
    assert.equal(files[0].name, 'photo.jpg')
  } finally {
    mock.restore()
  }
})

test('adminProductApi surfaces 409, 400 field errors, 403 and 502 as ApiError with backend message', async () => {
  const { adminProductApi } = apiModule
  const { ApiError } = apiClientModule
  const cases = [
    [409, { status: 409, message: 'Mã SKU đã tồn tại: NOVA-14' }, err => /SKU đã tồn tại/.test(err.message)],
    [400, { status: 400, message: 'Dữ liệu gửi lên không hợp lệ', errors: { slug: 'Slug sai' } }, err => err.errors?.slug === 'Slug sai'],
    [403, { status: 403, message: 'Bạn không có quyền truy cập tài nguyên này' }, err => err.status === 403],
    [502, { status: 502, message: 'Không thể tải ảnh lên Cloudinary. Vui lòng thử lại sau.' }, err => /Cloudinary/.test(err.message)],
  ]
  for (const [status, body, check] of cases) {
    const mock = mockFetch(() => ({ status, body }))
    try {
      await assert.rejects(
        adminProductApi.createProduct(samplePayload, []),
        err => err instanceof ApiError && err.status === status && check(err),
      )
    } finally {
      mock.restore()
    }
  }
})

test('normalizeSku and validateImageFile mirror backend rules', () => {
  const { normalizeSku, SKU_PATTERN, validateImageFile, MAX_PRODUCT_IMAGES } = typesModule
  assert.equal(normalizeSku('msi creator 16'), 'MSI-CREATOR-16')
  assert.equal(normalizeSku('  Đời mới -- 2026 '), 'DOI-MOI-2026')
  assert.ok(SKU_PATTERN.test(normalizeSku('Laptop Nova 14')))
  assert.ok(!SKU_PATTERN.test('nova-14'))
  assert.ok(normalizeSku('A'.repeat(80)).length <= 50)
  assert.equal(MAX_PRODUCT_IMAGES, 8)

  assert.equal(validateImageFile({ name: 'a.png', type: 'image/png', size: 1000 }), null)
  assert.match(validateImageFile({ name: 'a.gif', type: 'image/gif', size: 1000 }), /JPEG, PNG hoặc WebP/)
  assert.match(validateImageFile({ name: 'big.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }), /5MB/)
  assert.match(validateImageFile({ name: 'empty.webp', type: 'image/webp', size: 0 }), /rỗng/)
})

test('AdminProductsPage starts in a loading state without mock data and without a delete action', () => {
  const { AdminProductsPage } = pageModule
  const html = renderToStaticMarkup(createElement(AdminProductsPage))
  assert.match(html, /Quản lý sản phẩm/)
  assert.match(html, /Đang tải danh sách sản phẩm/)
  assert.match(html, /<button[^>]*disabled=""[^>]*>\+ Thêm sản phẩm mới/)
  assert.doesNotMatch(html, /MSI-PRO-16|Xóa sản phẩm/)
  assert.doesNotMatch(html, /Số lượng nhập kho/)
  assert.match(html, /Vùng nội dung/)
})
