package com.techstore.order.service;

import com.techstore.order.dto.admin.AdminOrderPageResponse;
import com.techstore.order.dto.admin.AdminOrderResponse;
import com.techstore.order.dto.admin.OrderStatusUpdateRequest;

/** UC14 — Quản trị đơn hàng (Staff/Admin, ADR-023). */
public interface AdminOrderService {

    AdminOrderPageResponse list(String status, String keyword, int page, int size);

    AdminOrderResponse get(Long id);

    AdminOrderResponse updateStatus(Long actorUserId, Long id, OrderStatusUpdateRequest request);
}
