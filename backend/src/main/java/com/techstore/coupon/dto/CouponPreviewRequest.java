package com.techstore.coupon.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.util.List;

/**
 * POST /api/checkout/coupon-preview (UC07/UC13, ADR-022).
 * CART: selectedCartItemIds; BUY_NOW: productId + quantity.
 */
public record CouponPreviewRequest(
        @NotBlank(message = "Vui lòng nhập mã giảm giá")
        String couponCode,

        @NotBlank(message = "Thiếu nguồn đặt hàng")
        @Pattern(regexp = "CART|BUY_NOW", message = "Nguồn đặt hàng phải là CART hoặc BUY_NOW")
        String source,

        List<Long> selectedCartItemIds,
        Long productId,
        Integer quantity
) {
}
