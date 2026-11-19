package com.techstore.product.dto.admin;

import java.time.LocalDateTime;

public record AdminCategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String imageUrl,
        Long parentId,
        String parentName,
        String status,
        long productCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
