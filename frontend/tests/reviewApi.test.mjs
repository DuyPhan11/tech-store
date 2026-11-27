import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let apiClientModule
let reviewApiModule
let reviewSectionModule

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;[apiClientModule, reviewApiModule, reviewSectionModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
    server.ssrLoadModule('/src/lib/api/reviewApi.ts'),
    server.ssrLoadModule('/src/features/reviews/ProductReviewsSection.tsx'),
  ])
})

after(async () => server?.close())

test('reviewApi calls public, eligible, create, update, and hide endpoints properly', async () => {
  const { reviewApi } = reviewApiModule
  const { ApiError } = apiClientModule
  const original = globalThis.fetch
  const calls = []
  let nextStatus = 200
  let nextBody = { productId: 1, averageRating: 4.5, totalReviews: 2, reviews: [] }

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null })
    return new globalThis.Response(JSON.stringify(nextBody), {
      status: nextStatus,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const pub = await reviewApi.getProductReviews(1)
    assert.equal(pub.averageRating, 4.5)
    assert.equal(calls[0].url, '/api/products/1/reviews')

    await reviewApi.getEligibleOrders(1)
    assert.equal(calls[1].url, '/api/reviews/eligible?productId=1')

    await reviewApi.getMyReviews()
    assert.equal(calls[2].url, '/api/reviews/me')

    nextStatus = 201
    nextBody = { id: 10, rating: 5, status: 'VISIBLE' }
    const created = await reviewApi.createReview({ productId: 1, orderId: 5, rating: 5, comment: 'Tốt' })
    assert.equal(created.id, 10)
    assert.equal(calls[3].method, 'POST')
    assert.equal(calls[3].url, '/api/reviews')

    nextStatus = 200
    await reviewApi.updateReview(10, { rating: 4, comment: 'Ổn' })
    assert.equal(calls[4].method, 'PUT')
    assert.equal(calls[4].url, '/api/reviews/10')

    await reviewApi.hideReview(10, 'Tự ẩn')
    assert.equal(calls[5].method, 'PATCH')
    assert.equal(calls[5].url, '/api/reviews/10/hide')
    assert.deepEqual(calls[5].body, { reason: 'Tự ẩn' })

    nextStatus = 409
    nextBody = { status: 409, message: 'Bạn đã đánh giá sản phẩm này rồi' }
    await assert.rejects(
      reviewApi.createReview({ productId: 1, orderId: 5, rating: 5, comment: 'Trùng' }),
      err => err instanceof ApiError && err.status === 409
    )
  } finally {
    globalThis.fetch = original
  }
})

test('ProductReviewsSection renders aggregate score and empty state in SSR markup', () => {
  const { ProductReviewsSection } = reviewSectionModule
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, null, createElement(ProductReviewsSection, { productId: 1 }))
  )
  assert.match(html, /0\.0/)
  assert.match(html, /đánh giá hiển thị/)
})
