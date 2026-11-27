import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let apiClientModule
let adminReviewApiModule
let adminReviewsPageModule

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;[apiClientModule, adminReviewApiModule, adminReviewsPageModule] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
    server.ssrLoadModule('/src/lib/api/adminReviewApi.ts'),
    server.ssrLoadModule('/src/features/admin/reviews/AdminReviewsPage.tsx'),
  ])
})

after(async () => server?.close())

test('adminReviewApi calls GET /api/admin/reviews and PATCH /api/admin/reviews/:id/hide', async () => {
  const { adminReviewApi } = adminReviewApiModule
  const { ApiError } = apiClientModule
  const original = globalThis.fetch
  const calls = []
  let nextStatus = 200
  let nextBody = []

  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null })
    return new globalThis.Response(JSON.stringify(nextBody), {
      status: nextStatus,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    await adminReviewApi.listReviews('VISIBLE', 'spam')
    assert.equal(calls[0].url, '/api/admin/reviews?status=VISIBLE&q=spam')

    await adminReviewApi.listReviews('ALL', '')
    assert.equal(calls[1].url, '/api/admin/reviews')

    nextBody = { id: 5, status: 'HIDDEN_BY_ADMIN', hiddenReason: 'Spam' }
    const hidden = await adminReviewApi.hideReview(5, 'Spam')
    assert.equal(hidden.status, 'HIDDEN_BY_ADMIN')
    assert.equal(calls[2].method, 'PATCH')
    assert.equal(calls[2].url, '/api/admin/reviews/5/hide')
    assert.deepEqual(calls[2].body, { reason: 'Spam' })

    nextStatus = 409
    nextBody = { status: 409, message: 'Chỉ có thể ẩn đánh giá đang hiển thị' }
    await assert.rejects(
      adminReviewApi.hideReview(5, 'Again'),
      err => err instanceof ApiError && err.status === 409
    )
  } finally {
    globalThis.fetch = original
  }
})

test('AdminReviewsPage starts in loading state without mock APPROVED/PENDING statuses', () => {
  const { AdminReviewsPage } = adminReviewsPageModule
  const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(AdminReviewsPage)))
  assert.match(html, /Đang tải danh sách đánh giá/)
  assert.doesNotMatch(html, /APPROVED/)
  assert.doesNotMatch(html, /Trần Thị B/)
})
