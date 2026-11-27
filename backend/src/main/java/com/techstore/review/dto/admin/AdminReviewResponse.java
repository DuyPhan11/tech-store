package com.techstore.review.dto.admin;

import java.time.LocalDateTime;

public record AdminReviewResponse(
        Long id,
        Long productId,
        String productName,
        String productSlug,
        Long userId,
        String customerName,
        String customerEmail,
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
