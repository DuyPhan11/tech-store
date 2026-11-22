package com.techstore.coupon.dto;

import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponDisplayStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** CouponResponse (UC13, ADR-022). {@code displayStatus} tính ở server. */
public record CouponResponse(
        Long id,
        String code,
        String discountType,
        BigDecimal discountValue,
        BigDecimal minOrderAmount,
        BigDecimal maxDiscountAmount,
        int usageLimit,
        int usedCount,
        LocalDateTime startDate,
        LocalDateTime endDate,
        boolean active,
        CouponDisplayStatus displayStatus,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CouponResponse of(Coupon c, CouponDisplayStatus displayStatus) {
        return new CouponResponse(c.getId(), c.getCode(), c.getDiscountType().name(), c.getDiscountValue(),
                c.getMinOrderAmount(), c.getMaxDiscountAmount(), c.getUsageLimit(), c.getUsedCount(),
                c.getStartDate(), c.getEndDate(), c.isActive(), displayStatus, c.getCreatedAt(), c.getUpdatedAt());
    }
}
