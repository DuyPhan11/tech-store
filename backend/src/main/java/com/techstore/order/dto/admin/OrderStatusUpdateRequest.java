package com.techstore.order.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** PATCH /api/admin/orders/{id}/status (UC14, ADR-023). reason bắt buộc khi CANCELLED (kiểm tra ở service). */
public record OrderStatusUpdateRequest(
        @NotBlank(message = "Vui lòng chọn trạng thái mới")
        @Pattern(regexp = "PENDING|CONFIRMED|SHIPPING|COMPLETED|CANCELLED",
                message = "Trạng thái phải là PENDING, CONFIRMED, SHIPPING, COMPLETED hoặc CANCELLED")
        String status,

        @Size(max = 500, message = "Lý do tối đa 500 ký tự")
        String reason
) {
}
