import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'vite'

// UC08 + UC14 — khách hủy đơn thất bại vì cửa hàng vừa đổi trạng thái: tải lại danh sách/chi tiết.

let server
let recoveryModule
let apiClientModule

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
  ;[recoveryModule, apiClientModule] = await Promise.all([
    server.ssrLoadModule('/src/features/account/cancelOrderRecovery.ts'),
    server.ssrLoadModule('/src/lib/api/apiClient.ts'),
  ])
})

after(async () => server?.close())

const cancelledOrder = { id: 7, orderCode: 'ORD-1', status: 'CANCELLED', statusLabel: 'Đã hủy', canCancel: false }

test('state-changed rejection reloads orders and detail with a friendly message', async () => {
  const { recoverAfterCancelFailure } = recoveryModule
  const { ApiError } = apiClientModule
  const calls = []
  const result = await recoverAfterCancelFailure(
    new ApiError(400, 'Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận. Trạng thái hiện tại: CANCELLED'),
    7,
    {
      getMyOrders: async () => { calls.push('list'); return [cancelledOrder] },
      getOrderDetail: async id => { calls.push(`detail:${id}`); return cancelledOrder },
    },
  )
  assert.deepEqual(calls.sort(), ['detail:7', 'list'])
  assert.deepEqual(result.orders, [cancelledOrder])
  assert.equal(result.detail.status, 'CANCELLED')
  assert.match(result.message, /^Không thể hủy: đơn hàng vừa được cửa hàng cập nhật\. Trạng thái hiện tại: Đã hủy\./)
  assert.match(result.message, /Chỉ có thể hủy đơn hàng/)
  assert.match(result.message, /Danh sách đơn hàng đã được làm mới\.$/)
})

test('network error keeps the original message; failed reload yields nulls without throwing', async () => {
  const { recoverAfterCancelFailure } = recoveryModule
  const result = await recoverAfterCancelFailure(new Error('Failed to fetch'), 7, {
    getMyOrders: async () => { throw new Error('offline') },
    getOrderDetail: async () => { throw new Error('offline') },
  })
  assert.equal(result.orders, null)
  assert.equal(result.detail, null)
  assert.equal(result.message, 'Failed to fetch')
})
