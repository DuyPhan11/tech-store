import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { renderToStaticMarkup } from 'react-dom/server'
import { matchRoutes } from 'react-router'
import { createServer } from 'vite'

let server
let routes

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  const module = await server.ssrLoadModule('/src/app/routes.tsx')
  routes = module.routes
})

after(async () => server?.close())

function renderRoute(path) {
  return renderToStaticMarkup(matchRoutes(routes, path)[0].route.element)
}

test('customer home renders the catalog sections, local anchors and sample disclosure', () => {
  const html = renderRoute('/')
  assert.match(html, /type="search"/)
  assert.match(html, /aria-label="Danh mục sản phẩm"/)
  assert.match(html, /Sản phẩm nổi bật/)
  assert.match(html, /Khám phá thêm sản phẩm/)
  assert.match(html, /giá trên trang dùng để minh họa/)
  assert.match(html, /Xem thêm sản phẩm/)
  assert.doesNotMatch(html, /Nova Lite|Vùng nội dung/)
  for (const [, target] of html.matchAll(/href="#([^"]+)"/g)) {
    assert.ok(html.includes(`id="${target}"`))
  }
  assert.match(html, /<footer/)
  assert.doesNotMatch(html, /href="\/(login|cart)"/)
})

test('admin shell renders sidebar, breadcrumb and a closed mobile menu', () => {
  const html = renderRoute('/admin')
  assert.match(html, /<aside/)
  assert.match(html, /aria-label="Đường dẫn"/)
  assert.match(html, /Vùng nội dung/)
  assert.match(html, /aria-controls="admin-menu"/)
  assert.match(html, /<dialog id="admin-menu"/)
  assert.doesNotMatch(html, /<dialog[^>]* open/)
})

test('an unknown route does not match a placeholder', () => {
  assert.equal(matchRoutes(routes, '/unknown'), null)
})

test('dev gallery renders the accessible control states and both badge families', () => {
  const matches = matchRoutes(routes, '/__dev/components')
  const html = renderToStaticMarkup(matches[0].route.element)
  assert.match(html, /<button[^>]*disabled=""[^>]*aria-busy="true"/)
  assert.match(html, /aria-invalid="true"/)
  const errorId = html.match(/aria-describedby="([^"]+)"/)[1]
  assert.ok(html.includes(`id="${errorId}"`))
  assert.match(html, /Đã hủy thanh toán/)
  assert.match(html, /Đã hoàn tiền/)
  assert.match(html, /<dialog[^>]*aria-labelledby=/)
})
