import { apiFetch } from './apiClient'
import type { AddToCartPayload, CartResponse, UpdateCartItemPayload } from '../../features/cart/cartTypes'

export const cartApi = {
  /**
   * Lấy giỏ hàng của người dùng hiện tại (yêu cầu đăng nhập ROLE_CUSTOMER)
   */
  getCart(): Promise<CartResponse> {
    return apiFetch<CartResponse>('/cart')
  },

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  addItem(productId: number, quantity = 1): Promise<CartResponse> {
    const payload: AddToCartPayload = { productId, quantity }
    return apiFetch<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Cập nhật số lượng của một dòng sản phẩm
   */
  updateQuantity(itemId: number, quantity: number): Promise<CartResponse> {
    const payload: UpdateCartItemPayload = { quantity }
    return apiFetch<CartResponse>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Xóa một dòng sản phẩm khỏi giỏ hàng
   */
  removeItem(itemId: number): Promise<CartResponse> {
    return apiFetch<CartResponse>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Xóa toàn bộ sản phẩm trong giỏ hàng
   */
  clearCart(): Promise<CartResponse> {
    return apiFetch<CartResponse>('/cart', {
      method: 'DELETE',
    })
  },
}
