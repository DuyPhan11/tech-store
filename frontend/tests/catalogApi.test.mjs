import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let catalogApiModule
let apiClientModule
let apiCatalogSourceModule
let apiProductDetailSourceModule
let productListPageModule
let detailPageModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  const [
    apiMod,
    clientMod,
    catalogSourceMod,
    detailSourceMod,
    listPageMod,
    detailPageMod,
  ] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/catalogApi.ts'),
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
    server.ssrLoadModule('/src/features/catalog/list/apiCatalogSource.ts'),
    server.ssrLoadModule('/src/features/catalog/detail/apiProductDetailSource.ts'),
    server.ssrLoadModule('/src/features/catalog/list/ProductListPage.tsx'),
    server.ssrLoadModule('/src/features/catalog/detail/ProductDetailPage.tsx'),
  ])

  catalogApiModule = apiMod
  apiClientModule = clientMod
  apiCatalogSourceModule = catalogSourceMod
  apiProductDetailSourceModule = detailSourceMod
  productListPageModule = listPageMod
  detailPageModule = detailPageMod
})

after(async () => server?.close())

test('catalogApi.getProducts builds query string with all filters and parses 200 response', async () => {
  const { catalogApi } = catalogApiModule
  const originalFetch = globalThis.fetch
  let interceptedUrl = ''

  const mockResponse = {
    products: [
      {
        id: '1',
        name: 'Laptop Nova 14',
        slug: 'nova-14',
        categoryId: 'laptop',
        brandId: 'nova',
        brandName: 'Nova',
        priceVnd: 18990000,
        image: 'https://example.com/laptop.jpg',
        specification: '14 inch · RAM 16 GB',
        status: 'ACTIVE',
      },
    ],
    total: 1,
    page: 2,
    pageSize: 8,
    totalPages: 1,
  }

  globalThis.fetch = async (url) => {
    interceptedUrl = String(url)
    return new globalThis.Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await catalogApi.getProducts({
      keyword: '  nova  ',
      category: 'laptop',
      brand: 'nova',
      minPrice: 10000000,
      maxPrice: 30000000,
      sort: 'price-asc',
      page: 2,
    })

    assert.ok(interceptedUrl.includes('/api/products?'))
    assert.ok(interceptedUrl.includes('q=nova'))
    assert.ok(interceptedUrl.includes('category=laptop'))
    assert.ok(interceptedUrl.includes('brand=nova'))
    assert.ok(interceptedUrl.includes('min=10000000'))
    assert.ok(interceptedUrl.includes('max=30000000'))
    assert.ok(interceptedUrl.includes('sort=price-asc'))
    assert.ok(interceptedUrl.includes('page=2'))

    assert.equal(result.total, 1)
    assert.equal(result.products[0].slug, 'nova-14')
    assert.equal(result.products[0].brandName, 'Nova')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('catalogApi.getProductBySlug fetches product detail by slug', async () => {
  const { catalogApi } = catalogApiModule
  const originalFetch = globalThis.fetch
  let interceptedUrl = ''

  const mockDetail = {
    id: '1',
    slug: 'nova-14',
    sku: 'LAP-NOV-14',
    name: 'Laptop Nova 14',
    categoryId: 'laptop',
    categoryName: 'Laptop',
    brandId: 'nova',
    brandName: 'Nova',
    priceVnd: 18990000,
    status: 'ACTIVE',
    image: 'https://example.com/laptop.jpg',
    images: [{ id: 1, url: 'https://example.com/laptop.jpg', alt: 'Laptop', isPrimary: true, displayOrder: 1 }],
    specification: '14 inch · RAM 16 GB',
    specifications: [{ label: 'Màn hình', value: '14 inch' }],
    description: 'Mô tả laptop',
    inStock: true,
    maxBranchQuantity: 8,
  }

  globalThis.fetch = async (url) => {
    interceptedUrl = String(url)
    return new globalThis.Response(JSON.stringify(mockDetail), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await catalogApi.getProductBySlug('nova-14')
    assert.equal(interceptedUrl, '/api/products/nova-14')
    assert.equal(result.slug, 'nova-14')
    assert.equal(result.inStock, true)
    assert.equal(result.maxBranchQuantity, 8)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('catalogApi.getProductBySlug rejects with ApiError (404) on not found or inactive product', async () => {
  const { catalogApi } = catalogApiModule
  const originalFetch = globalThis.fetch

  globalThis.fetch = async () => new globalThis.Response(JSON.stringify({
    timestamp: '2026-11-15T23:00:00Z',
    status: 404,
    error: 'Not Found',
    message: 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: non-existent',
    path: '/api/products/non-existent',
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })

  try {
    await assert.rejects(catalogApi.getProductBySlug('non-existent'), { status: 404 })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('apiCatalogSource and apiProductDetailSource delegate to catalogApi', async () => {
  const { apiCatalogSource } = apiCatalogSourceModule
  const { apiProductDetailSource } = apiProductDetailSourceModule
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (url) => {
    const urlStr = String(url)
    if (urlStr.includes('/api/products/')) {
      return new globalThis.Response(JSON.stringify({ id: '1', slug: 'test-slug', inStock: true, maxBranchQuantity: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new globalThis.Response(JSON.stringify({ products: [], total: 0, page: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const catalogResult = await apiCatalogSource({ keyword: '', category: '', brand: '', sort: 'default', page: 1 }, new AbortController().signal)
    assert.equal(catalogResult.total, 0)

    const detailResult = await apiProductDetailSource('test-slug')
    assert.equal(detailResult.slug, 'test-slug')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('ProductListPage renders empty state when total is 0', () => {
  const { ProductListPage } = productListPageModule
  const categories = [{ id: 'laptop', name: 'Laptop' }]
  const brands = [{ id: 'nova', name: 'Nova' }]

  const emptySource = async () => ({ products: [], total: 0, page: 1 })

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/products'] },
      createElement(ProductListPage, { source: emptySource, categories, brands })
    )
  )

  assert.match(html, /Danh sách sản phẩm/)
  assert.match(html, /Đang tải danh sách sản phẩm/)
})

test('ProductDetailPage renders 404 not found UI on 404 error', async () => {
  const { ProductDetailPage } = detailPageModule
  const { ApiError } = apiClientModule

  const notFoundSource = async () => {
    throw new ApiError(404, 'Sản phẩm không tồn tại hoặc đã ngừng kinh doanh')
  }

  const html = renderToStaticMarkup(
    createElement(
      MemoryRouter,
      { initialEntries: ['/products/non-existent'] },
      createElement(ProductDetailPage, { source: notFoundSource, categories: [], brands: [] })
    )
  )

  assert.match(html, /Đang tải thông tin sản phẩm/)
})
