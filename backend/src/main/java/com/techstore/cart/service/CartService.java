package com.techstore.cart.service;

import com.techstore.cart.dto.AddToCartRequest;
import com.techstore.cart.dto.CartResponse;

public interface CartService {

    CartResponse getCart(Long userId);

    CartResponse addToCart(Long userId, AddToCartRequest request);

    CartResponse updateItemQuantity(Long userId, Long itemId, Integer quantity);

    CartResponse removeItem(Long userId, Long itemId);

    CartResponse clearCart(Long userId);
}
