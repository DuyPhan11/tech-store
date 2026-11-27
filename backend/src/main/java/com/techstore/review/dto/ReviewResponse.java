package com.techstore.review.dto;

import java.time.LocalDateTime;

public record ReviewResponse(
        Long id,
        Long userId,
        String authorName,
        Long productId,
        String productName,
        String productSlug,
        Long orderId,
        String orderCode,
        Integer rating,
        String comment,
        String status,
        LocalDateTime hiddenAt,
        String hiddenReason,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
