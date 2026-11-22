package com.techstore.common.exception;

/**
 * Coupon không áp dụng được (UC07/UC13, ADR-022) → 400, kèm {@code errors.reason}.
 * Lý do: NOT_FOUND, DISABLED, NOT_STARTED, EXPIRED, EXHAUSTED, MIN_ORDER_NOT_MET, ALREADY_USED.
 */
public class InvalidCouponException extends RuntimeException {

    public enum Reason {
        NOT_FOUND, DISABLED, NOT_STARTED, EXPIRED, EXHAUSTED, MIN_ORDER_NOT_MET, ALREADY_USED
    }

    private final Reason reason;

    public InvalidCouponException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public Reason getReason() {
        return reason;
    }
}
