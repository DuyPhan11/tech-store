package com.techstore.common.exception;

/**
 * Ngoại lệ khi thanh toán giả lập ONLINE_MOCK thất bại (UC07, ADR-025).
 * Gây rollback toàn bộ transaction checkout và trả về HTTP 400 Bad Request.
 */
public class MockPaymentFailedException extends RuntimeException {
    public MockPaymentFailedException(String message) {
        super(message);
    }
}
