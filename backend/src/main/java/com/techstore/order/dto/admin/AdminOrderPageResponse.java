package com.techstore.order.dto.admin;

import java.util.List;
import java.util.Map;

/** Trang đơn hàng quản trị (UC14, ADR-023). {@code counts} tính theo q, bỏ qua status (cho các tab). */
public record AdminOrderPageResponse(
        List<AdminOrderResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages,
        Map<String, Long> counts
) {
}
