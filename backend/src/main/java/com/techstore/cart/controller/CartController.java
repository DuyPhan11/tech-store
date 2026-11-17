package com.techstore.cart.controller;

import com.techstore.cart.dto.AddToCartRequest;
import com.techstore.cart.dto.CartResponse;
import com.techstore.cart.dto.UpdateCartItemRequest;
import com.techstore.cart.service.CartService;
import com.techstore.common.security.UserPrincipal;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
public class CartController {

    private final CartService cartService;
    private final UserRepository userRepository;

    public CartController(CartService cartService, UserRepository userRepository) {
        this.cartService = cartService;
        this.userRepository = userRepository;
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Yêu cầu xác thực tài khoản");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        String identifier = authentication.getName();
        return userRepository.findByEmailOrPhone(identifier)
                .map(User::getId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy thông tin tài khoản"));
    }

    /**
     * Lấy toàn bộ giỏ hàng của khách hàng đang đăng nhập.
     */
    @GetMapping
    public ResponseEntity<CartResponse> getCart(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        CartResponse response = cartService.getCart(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Thêm sản phẩm vào giỏ hàng (nếu đã có sản phẩm thì cộng dồn số lượng).
     */
    @PostMapping("/items")
    public ResponseEntity<CartResponse> addToCart(Authentication authentication,
                                                  @Valid @RequestBody AddToCartRequest request) {
        Long userId = resolveUserId(authentication);
        CartResponse response = cartService.addToCart(userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Cập nhật số lượng của một dòng sản phẩm trong giỏ hàng.
     */
    @PatchMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> updateItemQuantity(Authentication authentication,
                                                           @PathVariable Long itemId,
                                                           @Valid @RequestBody UpdateCartItemRequest request) {
        Long userId = resolveUserId(authentication);
        CartResponse response = cartService.updateItemQuantity(userId, itemId, request.getQuantity());
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa một dòng sản phẩm khỏi giỏ hàng.
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeItem(Authentication authentication,
                                                   @PathVariable Long itemId) {
        Long userId = resolveUserId(authentication);
        CartResponse response = cartService.removeItem(userId, itemId);
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa toàn bộ sản phẩm trong giỏ hàng.
     */
    @DeleteMapping
    public ResponseEntity<CartResponse> clearCart(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        CartResponse response = cartService.clearCart(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Hỗ trợ alias xóa toàn bộ sản phẩm: DELETE /api/cart/items
     */
    @DeleteMapping("/items")
    public ResponseEntity<CartResponse> clearCartItems(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        CartResponse response = cartService.clearCart(userId);
        return ResponseEntity.ok(response);
    }
}
