import assert from 'node:assert/strict'
import { URLSearchParams } from 'node:url'
import { before, after, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

let server, source, readQuery, products, detailSource, ProductNotFoundError
before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  const folder = '/src/features/catalog/list/'
  const [mock, types, sample, detailMock] = await Promise.all([
    server.ssrLoadModule(folder + 'mockCatalogSource.ts'),
    server.ssrLoadModule(folder + 'catalogTypes.ts'),
    server.ssrLoadModule(folder + 'catalogSample.ts'),
    server.ssrLoadModule('/src/features/catalog/detail/mockProductDetailSource.ts'),
  ])
  source = mock.mockCatalogSource
  readQuery = types.readQuery
  products = sample.products
  detailSource = detailMock.mockProductDetailSource
  ProductNotFoundError = detailMock.ProductNotFoundError
})
after(async () => server?.close())

function search(params = {}) {
  return source(readQuery(new URLSearchParams(params)), new globalThis.AbortController().signal)
}

test('default public results preserve fixture order, with eight items on the first page', async () => {
  const first = await search()
  const last = await search({ page: '2' })
  assert.equal(first.products.length, 8)
  assert.equal(first.total, products.length)
  assert.deepEqual([...first.products, ...last.products], products)
  assert.deepEqual(await search({ page: '100' }), last)
})

test('Vietnamese name search ignores whitespace, case, accents and crossed d', async () => {
  const result = await search({ q: '   DIEN THOAI  ' })
  assert.deepEqual(result.products.map(p => p.id), ['orbit-6'])
  assert.equal((await search({ q: '512 GB' })).total, 0)
})

test('combines category, brand, keyword and inclusive single-sided or equal price bounds', async () => {
  const filters = { category: 'laptop', brand: 'nova', q: 'nova' }
  assert.equal((await search({ ...filters, min: '18990000', max: '18990000' })).products[0].id, 'nova-14')
  assert.equal((await search({ ...filters, min: '21990000' })).total, 1)
  assert.equal((await search({ ...filters, max: '12990000' })).total, 1)
  assert.equal((await search({ ...filters, brand: 'orbit' })).total, 0)
  assert.equal((await search({ max: '0' })).total, 0)
})

test('sorts the complete result before pagination and leaves default order intact', async () => {
  for (const sort of ['price-asc', 'price-desc']) {
    const first = await search({ sort })
    const last = await search({ sort, page: '2' })
    const expected = [...products].sort((a, b) =>
      sort === 'price-asc' ? a.priceVnd - b.priceVnd : b.priceVnd - a.priceVnd)
    assert.deepEqual([...first.products, ...last.products], expected)
  }
  assert.deepEqual((await search()).products, products.slice(0, 8))
})

test('invalid page and sort use defaults, and aborted requests reject', async () => {
  assert.deepEqual(await search({ page: '-2', sort: 'unknown' }), await search())
  await assert.rejects(source(readQuery(new URLSearchParams()), globalThis.AbortSignal.abort()), { name: 'AbortError' })
})

test('ProductCard renders image, brand, title in h3, specification and currency in VND', async () => {
  const { ProductCard } = await server.ssrLoadModule('/src/features/catalog/ProductCard.tsx')
  const sampleProduct = products[0]
  const html = renderToStaticMarkup(createElement(ProductCard, { product: sampleProduct, brandName: 'Nova' }))
  assert.match(html, /<h3[^>]*>.*Laptop Nova 14.*<\/h3>/)
  assert.match(html, /href="\/products\/nova-14"/)
  assert.match(html, /Nova/)
  assert.match(html, /14 inch · RAM 16 GB · SSD 512 GB/)
  assert.match(html, /18\.990\.000/)
})

test('mockProductDetailSource retrieves ACTIVE product by slug with MAX branch stock', async () => {
  const detail = await detailSource('nova-14')
  assert.equal(detail.slug, 'nova-14')
  assert.equal(detail.sku, 'LAP-NOV-14')
  assert.equal(detail.status, 'ACTIVE')
  assert.equal(detail.inStock, true)
  // Chi nhánh 1 có 5, Chi nhánh 2 có 8 -> MAX là 8 (không cộng dồn SUM 13)
  assert.equal(detail.maxBranchQuantity, 8)
  assert.ok(detail.images.length > 0)
  assert.ok(detail.specifications.length > 0)
})

test('mockProductDetailSource rejects INACTIVE or non-existent product with ProductNotFoundError', async () => {
  await assert.rejects(detailSource('nova-archived'), ProductNotFoundError)
  await assert.rejects(detailSource('non-existent-product'), ProductNotFoundError)
})

test('mockProductDetailSource identifies OUT_OF_STOCK when all active branches have zero quantity', async () => {
  const detail = await detailSource('echo-studio')
  assert.equal(detail.inStock, false)
  assert.equal(detail.maxBranchQuantity, 0)
})

test('ProductGallery renders primary image and thumbnail strip with alt text', async () => {
  const { ProductGallery } = await server.ssrLoadModule('/src/features/catalog/detail/ProductGallery.tsx')
  const testImages = [
    { id: '1', url: '/img1.jpg', alt: 'Ảnh 1', isPrimary: true, displayOrder: 0 },
    { id: '2', url: '/img2.jpg', alt: 'Ảnh 2', isPrimary: false, displayOrder: 1 },
  ]
  const html = renderToStaticMarkup(createElement(ProductGallery, { images: testImages, productName: 'Test Product' }))
  assert.match(html, /src="\/img1\.jpg"/)
  assert.match(html, /alt="Ảnh 1"/)
  assert.match(html, /role="tablist"/)
  assert.match(html, /src="\/img2\.jpg"/)

  // Fallback khi không có ảnh
  const fallbackHtml = renderToStaticMarkup(createElement(ProductGallery, { images: [], productName: 'Empty Product' }))
  assert.match(fallbackHtml, /Chưa có ảnh/)
})


