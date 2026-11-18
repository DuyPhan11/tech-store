import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

// UC12 — Admin Catalog (ADR-018): API client, slug helper, public filter options, page initial render.

let server
let adminApiModule
let catalogApiModule
let typesModule
let catalogTypesModule
let pageModule
let apiClientModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  ;[adminApiModule, catalogApiModule, typesModule, catalogTypesModule, pageModule, apiClientModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/adminCatalogApi.ts'),
    server.ssrLoadModule('/src/lib/api/catalogApi.ts'),
    server.ssrLoadModule('/src/features/admin/catalog/adminCatalogTypes.ts'),
    server.ssrLoadModule('/src/features/catalog/list/catalogTypes.ts'),
    server.ssrLoadModule('/src/features/admin/catalog/AdminCatalogPage.tsx'),
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
    return new globalThis.Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { calls, restore: () => { globalThis.fetch = original } }
}

const sampleCategory = {
  id: 10, name: 'Laptop AI', slug: 'laptop-ai', description: null, imageUrl: null,
  parentId: 1, parentName: 'Laptop', status: 'ACTIVE', productCount: 0,
  createdAt: '2026-11-19T10:00:00', updatedAt: '2026-11-19T10:00:00',
}

const sampleBrand = {
  id: 7, name: 'Corsair', slug: 'corsair', country: 'Mỹ', description: null, logoUrl: null,
  status: 'ACTIVE', productCount: 0, createdAt: '2026-11-19T10:00:00', updatedAt: '2026-11-19T10:00:00',
}

test('adminCatalogApi calls the approved category endpoints with correct method and body', async () => {
  const { adminCatalogApi } = adminApiModule
  const mock = mockFetch((url, init) => {
    if ((init.method ?? 'GET') === 'GET') return { body: [sampleCategory] }
    if (init.method === 'POST') return { status: 201, body: sampleCategory }
    return { body: { ...sampleCategory, status: 'INACTIVE' } }
  })
  try {
    const list = await adminCatalogApi.listCategories()
    assert.equal(list[0].slug, 'laptop-ai')

    await adminCatalogApi.createCategory({ name: 'Laptop AI', slug: 'laptop-ai', parentId: 1 })
    await adminCatalogApi.updateCategory(10, { name: 'Laptop AI 2', slug: 'laptop-ai', parentId: null })
    const updated = await adminCatalogApi.updateCategoryStatus(10, 'INACTIVE')
    assert.equal(updated.status, 'INACTIVE')

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/categories'],
      ['POST', '/api/admin/categories'],
      ['PUT', '/api/admin/categories/10'],
      ['PATCH', '/api/admin/categories/10/status'],
    ])
    assert.deepEqual(mock.calls[1].body, { name: 'Laptop AI', slug: 'laptop-ai', parentId: 1 })
    assert.deepEqual(mock.calls[3].body, { status: 'INACTIVE' })
  } finally {
    mock.restore()
  }
})

test('adminCatalogApi calls the approved brand endpoints including country', async () => {
  const { adminCatalogApi } = adminApiModule
  const mock = mockFetch((url, init) => {
    if ((init.method ?? 'GET') === 'GET') return { body: [sampleBrand] }
    return { status: init.method === 'POST' ? 201 : 200, body: sampleBrand }
  })
  try {
    const list = await adminCatalogApi.listBrands()
    assert.equal(list[0].country, 'Mỹ')
    await adminCatalogApi.createBrand({ name: 'Corsair', slug: 'corsair', country: 'Mỹ', description: null })
    await adminCatalogApi.updateBrand(7, { name: 'Corsair', slug: 'corsair', country: 'Hoa Kỳ' })
    await adminCatalogApi.updateBrandStatus(7, 'ACTIVE')

    assert.deepEqual(mock.calls.map(c => [c.method, c.url]), [
      ['GET', '/api/admin/brands'],
      ['POST', '/api/admin/brands'],
      ['PUT', '/api/admin/brands/7'],
      ['PATCH', '/api/admin/brands/7/status'],
    ])
    assert.equal(mock.calls[1].body.country, 'Mỹ')
    assert.equal(mock.calls[2].body.country, 'Hoa Kỳ')
    assert.ok(!mock.calls.some(c => c.method === 'DELETE'), 'UC12 không có DELETE (ADR-018 A2)')
  } finally {
    mock.restore()
  }
})

test('adminCatalogApi surfaces 409 duplicate slug and 403 forbidden as ApiError with backend message', async () => {
  const { adminCatalogApi } = adminApiModule
  const { ApiError } = apiClientModule

  let mock = mockFetch(() => ({ status: 409, body: { status: 409, message: 'Slug danh mục đã tồn tại: laptop' } }))
  try {
    await assert.rejects(
      adminCatalogApi.createCategory({ name: 'Laptop', slug: 'laptop' }),
      err => err instanceof ApiError && err.status === 409 && /Slug danh mục đã tồn tại/.test(err.message),
    )
  } finally {
    mock.restore()
  }

  mock = mockFetch(() => ({ status: 403, body: { status: 403, message: 'Bạn không có quyền truy cập tài nguyên này' } }))
  try {
    await assert.rejects(
      adminCatalogApi.listBrands(),
      err => err instanceof ApiError && err.status === 403,
    )
  } finally {
    mock.restore()
  }

  mock = mockFetch(() => ({ status: 400, body: { status: 400, message: 'Dữ liệu gửi lên không hợp lệ', errors: { slug: 'Slug sai' } } }))
  try {
    await assert.rejects(
      adminCatalogApi.createBrand({ name: 'X', slug: 'X X' }),
      err => err instanceof ApiError && err.status === 400 && err.errors?.slug === 'Slug sai',
    )
  } finally {
    mock.restore()
  }
})

test('toSlug converts Vietnamese names to the backend slug format', () => {
  const { toSlug, SLUG_PATTERN } = typesModule
  assert.equal(toSlug('Bàn phím cơ & Chuột'), 'ban-phim-co-chuot')
  assert.equal(toSlug('  Điện thoại Đời mới  '), 'dien-thoai-doi-moi')
  assert.equal(toSlug('Laptop chơi game (Gaming)'), 'laptop-choi-game-gaming')
  assert.equal(toSlug('!!!'), '')
  assert.ok(SLUG_PATTERN.test(toSlug('Màn hình 4K 144Hz')))
  assert.ok(!SLUG_PATTERN.test('Laptop Mới'))
  assert.ok(!SLUG_PATTERN.test('laptop--moi'))
  assert.ok(toSlug('a'.repeat(150)).length <= 100)
})

test('public catalog loads ACTIVE categories and brands from API and maps them to slug-based filter options', async () => {
  const { catalogApi } = catalogApiModule
  const { toCategoryOptions, toBrandOptions } = catalogTypesModule
  const mock = mockFetch(url => {
    if (url.endsWith('/categories')) {
      return { body: [
        { id: 1, name: 'Laptop', slug: 'laptop', parentId: null, parentSlug: null },
        { id: 2, name: 'Laptop Gaming', slug: 'laptop-gaming', parentId: 1, parentSlug: 'laptop' },
      ] }
    }
    return { body: [{ id: 5, name: 'Corsair', slug: 'corsair', logoUrl: null }] }
  })
  try {
    const cats = await catalogApi.getCategories()
    const brands = await catalogApi.getBrands()
    assert.deepEqual(mock.calls.map(c => c.url), ['/api/categories', '/api/brands'])
    assert.deepEqual(toCategoryOptions(cats), [
      { id: 'laptop', name: 'Laptop' },
      { id: 'laptop-gaming', name: 'Laptop Gaming', parentId: 'laptop' },
    ])
    assert.deepEqual(toBrandOptions(brands), [{ id: 'corsair', name: 'Corsair' }])
  } finally {
    mock.restore()
  }
})

test('AdminCatalogPage starts in a loading state without rendering sample data', () => {
  const { AdminCatalogPage } = pageModule
  const html = renderToStaticMarkup(createElement(AdminCatalogPage))
  assert.match(html, /Quản lý danh mục &amp; thương hiệu/)
  assert.match(html, /Đang tải danh mục và thương hiệu/)
  assert.match(html, /Danh mục sản phẩm \(0\)/)
  assert.doesNotMatch(html, /Corsair|Bàn phím cơ/)
  assert.match(html, /<button[^>]*disabled=""[^>]*>\+ Thêm/)
  assert.match(html, /Vùng nội dung/)
})
