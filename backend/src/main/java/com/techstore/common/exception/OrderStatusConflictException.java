package com.techstore.common.exception;

/** Chuyển trạng thái đơn sai luồng từ quản trị (UC14, ADR-023) → 409. */
public class OrderStatusConflictException extends RuntimeException {
    public OrderStatusConflictException(String message) {
        super(message);
    }
}
