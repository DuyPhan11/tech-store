export interface CartItemDto {
  id: number
  productId: number
  productName: string
  productSlug: string
  productSku: string
  productImage: string
  priceVnd: number
  quantity: number
  subtotalVnd: number
  inStock: boolean
}

export interface CartResponse {
  id: number
  items: CartItemDto[]
  totalItems: number
  totalUniqueItems: number
  totalPriceVnd: number
}

export interface AddToCartPayload {
  productId: number
  quantity?: number
}

export interface UpdateCartItemPayload {
  quantity: number
}
