package com.techstore.product.dto.admin;

import java.time.LocalDateTime;

/** DTO quản trị chi nhánh (UC19, ADR-020). */
public record AdminBranchResponse(
        Long id,
        String name,
        String phone,
        String address,
        String status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
