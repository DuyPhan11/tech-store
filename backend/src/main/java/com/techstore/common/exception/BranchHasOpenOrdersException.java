package com.techstore.common.exception;

/**
 * Không thể vô hiệu hóa chi nhánh còn đơn PENDING/CONFIRMED/SHIPPING (BUSINESS_RULES §5, ADR-020) → HTTP 409.
 */
public class BranchHasOpenOrdersException extends RuntimeException {
    public BranchHasOpenOrdersException(String message) {
        super(message);
    }
}
