package com.techstore.coupon.dto;

import java.math.BigDecimal;

/** Kết quả xem trước mã giảm giá (UC07/UC13, ADR-022). Không tiêu lượt. */
public record CouponPreviewResponse(
        String couponCode,
        BigDecimal subtotal,
        BigDecimal discountAmount,
        BigDecimal finalAmount
) {
}
