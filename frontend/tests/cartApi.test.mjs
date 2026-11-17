import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'

let server
let cartApiModule
let cartPageModule

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  const [apiMod, pageMod] = await Promise.all([
    server.ssrLoadModule('/src/lib/api/cartApi.ts'),
    server.ssrLoadModule('/src/features/cart/CartPage.tsx'),
  ])

  cartApiModule = apiMod
  cartPageModule = pageMod
})

after(async () => server?.close())

test('cartApi.getCart calls GET /api/cart', async () => {
  const { cartApi } = cartApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify({
      id: 1,
      items: [],
      totalItems: 0,
      totalUniqueItems: 0,
      totalPriceVnd: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await cartApi.getCart()
    assert.match(requestedUrl, /\/api\/cart$/)
    assert.equal(requestedMethod, 'GET')
    assert.equal(res.totalItems, 0)
    assert.deepEqual(res.items, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('cartApi.addItem sends POST /api/cart/items with productId and quantity', async () => {
  const { cartApi } = cartApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''
  let requestedBody = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    requestedBody = String(init?.body ?? '')
    return new Response(JSON.stringify({
      id: 1,
      items: [{ id: 10, productId: 5, productName: 'Test Laptop', priceVnd: 20000000, quantity: 2, subtotalVnd: 40000000, inStock: true }],
      totalItems: 2,
      totalUniqueItems: 1,
      totalPriceVnd: 40000000,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await cartApi.addItem(5, 2)
    assert.match(requestedUrl, /\/api\/cart\/items$/)
    assert.equal(requestedMethod, 'POST')
    assert.deepEqual(JSON.parse(requestedBody), { productId: 5, quantity: 2 })
    assert.equal(res.totalItems, 2)
    assert.equal(res.items[0].productId, 5)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('cartApi.updateQuantity sends PATCH /api/cart/items/:id with new quantity', async () => {
  const { cartApi } = cartApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''
  let requestedBody = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    requestedBody = String(init?.body ?? '')
    return new Response(JSON.stringify({
      id: 1,
      items: [{ id: 10, productId: 5, productName: 'Test Laptop', priceVnd: 20000000, quantity: 4, subtotalVnd: 80000000, inStock: true }],
      totalItems: 4,
      totalUniqueItems: 1,
      totalPriceVnd: 80000000,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await cartApi.updateQuantity(10, 4)
    assert.match(requestedUrl, /\/api\/cart\/items\/10$/)
    assert.equal(requestedMethod, 'PATCH')
    assert.deepEqual(JSON.parse(requestedBody), { quantity: 4 })
    assert.equal(res.totalItems, 4)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('cartApi.removeItem sends DELETE /api/cart/items/:id', async () => {
  const { cartApi } = cartApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify({
      id: 1,
      items: [],
      totalItems: 0,
      totalUniqueItems: 0,
      totalPriceVnd: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await cartApi.removeItem(10)
    assert.match(requestedUrl, /\/api\/cart\/items\/10$/)
    assert.equal(requestedMethod, 'DELETE')
    assert.equal(res.totalItems, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('cartApi.clearCart sends DELETE /api/cart', async () => {
  const { cartApi } = cartApiModule
  const originalFetch = globalThis.fetch
  let requestedUrl = ''
  let requestedMethod = ''

  globalThis.fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedMethod = init?.method ?? 'GET'
    return new Response(JSON.stringify({
      id: 1,
      items: [],
      totalItems: 0,
      totalUniqueItems: 0,
      totalPriceVnd: 0,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const res = await cartApi.clearCart()
    assert.match(requestedUrl, /\/api\/cart$/)
    assert.equal(requestedMethod, 'DELETE')
    assert.equal(res.totalItems, 0)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('CartPage renders properly in initial state', () => {
  const { CartPage } = cartPageModule
  const html = renderToStaticMarkup(
    createElement(MemoryRouter, null, createElement(CartPage))
  )
  assert.match(html, /Giỏ hàng của bạn/)
})
