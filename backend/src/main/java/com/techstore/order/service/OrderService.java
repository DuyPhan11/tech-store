package com.techstore.order.service;

import com.techstore.order.dto.OrderResponse;

import java.util.List;

public interface OrderService {
    List<OrderResponse> getMyOrders(String email);
    OrderResponse getMyOrderDetail(String email, Long orderId);
    OrderResponse getMyOrderDetailByCode(String email, String orderCode);
    OrderResponse cancelOrder(String email, Long orderId, String cancelReason);
}
