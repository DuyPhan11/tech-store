package com.techstore.common.exception;

/** Xung đột nghiệp vụ khi sửa coupon (UC13, ADR-022): đổi trường bị khóa, usageLimit &lt; usedCount → 409. */
public class CouponConflictException extends RuntimeException {
    public CouponConflictException(String message) {
        super(message);
    }
}
