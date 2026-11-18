package com.techstore.order.controller;

import com.techstore.order.dto.CancelOrderRequest;
import com.techstore.order.dto.OrderResponse;
import com.techstore.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/orders")
@PreAuthorize("hasRole('CUSTOMER')")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/me")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Principal principal) {
        List<OrderResponse> orders = orderService.getMyOrders(principal.getName());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/me/{id}")
    public ResponseEntity<OrderResponse> getMyOrderDetail(Principal principal, @PathVariable Long id) {
        OrderResponse order = orderService.getMyOrderDetail(principal.getName(), id);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(Principal principal,
                                                     @PathVariable Long id,
                                                     @Valid @RequestBody CancelOrderRequest request) {
        OrderResponse cancelledOrder = orderService.cancelOrder(principal.getName(), id, request.getCancelReason());
        return ResponseEntity.ok(cancelledOrder);
    }
}
