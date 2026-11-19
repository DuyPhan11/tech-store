package com.techstore.product.dto.admin;

import java.time.LocalDateTime;

public record AdminBrandResponse(
        Long id,
        String name,
        String slug,
        String country,
        String description,
        String logoUrl,
        String status,
        long productCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
