package com.techstore.coupon.entity;

/**
 * Trạng thái hiển thị tính ở server (ADR-022), ưu tiên:
 * DISABLED > EXPIRED > EXHAUSTED > SCHEDULED > ACTIVE.
 */
public enum CouponDisplayStatus {
    ACTIVE,
    SCHEDULED,
    EXPIRED,
    EXHAUSTED,
    DISABLED
}
