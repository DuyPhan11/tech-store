package com.techstore.order.controller;

import com.techstore.common.security.UserPrincipal;
import com.techstore.order.dto.admin.AdminOrderPageResponse;
import com.techstore.order.dto.admin.AdminOrderResponse;
import com.techstore.order.dto.admin.OrderStatusUpdateRequest;
import com.techstore.order.service.AdminOrderService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** UC14 — Quản trị đơn hàng (ROLE_STAFF, ADMIN kế thừa; ADR-023). */
@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('STAFF')")
public class AdminOrderController {

    private final AdminOrderService adminOrderService;

    public AdminOrderController(AdminOrderService adminOrderService) {
        this.adminOrderService = adminOrderService;
    }

    @GetMapping
    public AdminOrderPageResponse list(@RequestParam(required = false) String status,
                                       @RequestParam(required = false) String q,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "20") int size) {
        return adminOrderService.list(status, q, page, size);
    }

    @GetMapping("/{id}")
    public AdminOrderResponse get(@PathVariable Long id) {
        return adminOrderService.get(id);
    }

    @PatchMapping("/{id}/status")
    public AdminOrderResponse updateStatus(@AuthenticationPrincipal UserPrincipal currentUser,
                                           @PathVariable Long id,
                                           @Valid @RequestBody OrderStatusUpdateRequest request) {
        return adminOrderService.updateStatus(currentUser.getId(), id, request);
    }
}
