package com.techstore.coupon.dto;

import jakarta.validation.constraints.NotNull;

/** PATCH /api/admin/coupons/{id}/status (UC13, ADR-022). */
public record CouponStatusRequest(
        @NotNull(message = "Vui lòng chọn trạng thái bật/tắt")
        Boolean active
) {
}
